import {
  ai,
  primaryModel,
  fallbackModel,
  PRIMARY_MODEL_NAME,
  FALLBACK_MODEL_NAME,
} from '../config/genkit.js';
import {
  ReceiptInputSchema,
  RawExpenseOutputSchema,
  ExpenseOutputSchema,
  type ExpenseOutput,
  type RawExpenseOutput,
} from '../schemas/expense.schema.js';
import { validateAndSanitizeReceipt } from '../validators/receipt.validator.js';
import { withRetry, isRetryableError } from '../utils/resilience.js';

const TIMEOUT_MS = Number(process.env.RECEIPT_TIMEOUT_MS) || 8000;
const MAX_RETRIES = Number(process.env.RECEIPT_MAX_RETRIES) || 1;
const ENABLE_GRACEFUL_FALLBACK = process.env.RECEIPT_ENABLE_FALLBACK !== 'false';

/**
 * Builds the multimodal extraction prompt for Gemini models.
 */
function buildExtractionPrompt(imageUrl: string, preferredCurrency: string) {
  return [
    { media: { url: imageUrl } },
    {
      text: `You are an expert financial assistant specialized in analyzing receipts and extracting structured expense information.

Analyze the provided receipt image carefully and extract all relevant details:
1. merchantName: Identify the store, vendor, restaurant, or business name.
2. totalAmount: Extract the grand total charged/paid (as a positive number).
3. currency: Detect the currency (e.g. USD, EUR, GBP, etc.). If not visible, use "${preferredCurrency}".
4. date: Extract the transaction date in YYYY-MM-DD format. If year is missing or ambiguous, use the best estimated date.
5. category: Classify the expense into exactly one of the following categories:
   - "Food & Dining" (e.g., restaurants, cafes, fast food, coffee shops, bakeries)
   - "Groceries" (e.g., supermarkets, grocery stores, food markets)
   - "Transportation" (e.g., gas/fuel, rideshare, taxi, public transit, parking)
   - "Entertainment" (e.g., cinema, theater, streaming, events)
   - "Utilities" (e.g., electricity, internet, phone bill, water)
   - "Shopping" (e.g., retail, clothes, electronics, general goods)
   - "Travel" (e.g., flights, hotels, train tickets, car rental)
   - "Other" (if it does not fit any of the above)
6. items: Extract individual purchased items with name, price, and quantity when available.
7. tax: Extract sales tax / VAT if listed.
8. confidence: Assess whether extraction confidence is "high", "medium", or "low" based on receipt clarity.
9. summary: Provide a concise one-line summary (e.g., "Lunch at Chipotle").

CRITICAL GUARDRAILS:
- If the image is blurry, unreadable, dark, occluded, or does not clearly display text/numbers:
  * Do NOT guess, fabricate, or hallucinate store names, prices, or line items.
  * Set "confidence" to "low".
  * Set "merchantName" to "Unreadable Receipt".
  * Set "totalAmount" to 0 (or only extract strictly legible numbers).
  * Leave "items" as an empty list [].
  * In "summary", explain: "Receipt image is too blurry or unclear to read reliably."`,
    },
  ];
}

/**
 * Constructs a fallback skeleton when all AI attempts fail so the client app does not crash.
 */
function createFallbackSkeleton(
  preferredCurrency: string,
  errorMessage: string
): ExpenseOutput {
  const todayIso = new Date().toISOString().split('T')[0];

  return {
    merchantName: 'Unprocessed Receipt',
    totalAmount: 0,
    currency: preferredCurrency.toUpperCase(),
    date: todayIso,
    category: 'Other',
    items: [],
    tax: null,
    confidence: 'low',
    summary: 'Receipt extraction failed. Please enter details manually.',
    isMathConsistent: true,
    warnings: [
      {
        field: 'system',
        code: 'EXTRACTION_FAILED',
        message: 'We could not automatically read this receipt. Please review and enter details manually.',
      },
    ],
  };
}

export const extractReceiptFlow = ai.defineFlow(
  {
    name: 'extractReceiptFlow',
    inputSchema: ReceiptInputSchema,
    outputSchema: ExpenseOutputSchema,
  },
  async (input): Promise<ExpenseOutput> => {
    const { imageUrl, preferredCurrency = 'USD' } = input;
    const prompt = buildExtractionPrompt(imageUrl, preferredCurrency);

    let rawOutput: RawExpenseOutput | null = null;
    let usedFallbackModel = false;
    let primaryError: any = null;

    // 1. Attempt Primary Model with Retries & Timeout (temperature 0 for deterministic extraction)
    try {
      rawOutput = await withRetry(
        async () => {
          const response = await ai.generate({
            model: primaryModel,
            prompt,
            config: {
              temperature: 0.0,
            },
            output: {
              schema: RawExpenseOutputSchema,
            },
          });

          if (!response.output) {
            throw new Error(`Empty response received from primary model (${PRIMARY_MODEL_NAME})`);
          }

          return response.output;
        },
        {
          maxRetries: MAX_RETRIES,
          timeoutMs: TIMEOUT_MS,
          operationName: `Primary Model (${PRIMARY_MODEL_NAME})`,
          shouldRetry: (err) => {
            // Fast Failover: If primary model timed out, skip retries and fail over immediately to save client SLA
            if (err.name === 'TimeoutError' || err.message?.includes('timed out')) {
              return false;
            }
            return isRetryableError(err);
          },
        }
      );
    } catch (err: any) {
      primaryError = err;
      console.warn(
        `⚠️ Primary model (${PRIMARY_MODEL_NAME}) failed: ${err.message}. Triggering fallback model (${FALLBACK_MODEL_NAME})...`
      );
    }

    // 2. Attempt Fallback Model if Primary Failed
    if (!rawOutput) {
      try {
        rawOutput = await withRetry(
          async () => {
            const response = await ai.generate({
              model: fallbackModel,
              prompt,
              config: {
                temperature: 0.0,
              },
              output: {
                schema: RawExpenseOutputSchema,
              },
            });

            if (!response.output) {
              throw new Error(`Empty response received from fallback model (${FALLBACK_MODEL_NAME})`);
            }

            return response.output;
          },
          {
            maxRetries: 1,
            timeoutMs: TIMEOUT_MS,
            operationName: `Fallback Model (${FALLBACK_MODEL_NAME})`,
          }
        );

        usedFallbackModel = true;
      } catch (fallbackErr: any) {
        console.error(
          `❌ Fallback model (${FALLBACK_MODEL_NAME}) also failed: ${fallbackErr.message}`
        );

        if (ENABLE_GRACEFUL_FALLBACK) {
          return createFallbackSkeleton(
            preferredCurrency,
            primaryError?.message || fallbackErr.message
          );
        }

        throw new Error(
          'Unable to extract receipt details. Please try uploading a clearer image or enter details manually.'
        );
      }
    }

    // 3. Apply Business Validation, Sanitization, Math Reconciliation, and Confidence Calibration
    const validatedExpense = validateAndSanitizeReceipt(rawOutput, {
      preferredCurrency,
    });

    // Log server-side telemetry if fallback model was used
    if (usedFallbackModel) {
      console.info(
        `[Telemetry] Receipt successfully extracted using fallback model (${FALLBACK_MODEL_NAME}).`
      );
    }

    return validatedExpense;
  }
);
