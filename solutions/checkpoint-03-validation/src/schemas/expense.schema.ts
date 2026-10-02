import { z } from 'genkit';

export const ExpenseCategoryEnum = z.enum([
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Entertainment',
  'Utilities',
  'Shopping',
  'Travel',
  'Other',
]);

export type ExpenseCategory = z.infer<typeof ExpenseCategoryEnum>;

export const ReceiptLineItemSchema = z.object({
  name: z.string().describe('Item description or product name'),
  price: z.number().nullable().describe('Price for this line item'),
  quantity: z.number().nullable().default(1).describe('Quantity of items purchased'),
});

export type ReceiptLineItem = z.infer<typeof ReceiptLineItemSchema>;

export const ReceiptInputSchema = z.object({
  imageUrl: z
    .string()
    .describe('Base64 Data URI (e.g. data:image/jpeg;base64,...) or public HTTP URL of the receipt image'),
  preferredCurrency: z
    .string()
    .optional()
    .default('USD')
    .describe('Fallback currency code if not found on the receipt'),
});

export type ReceiptInput = z.infer<typeof ReceiptInputSchema>;

export const ValidationWarningSchema = z.object({
  field: z.string().describe('The field associated with this warning (e.g., date, totalAmount, merchantName)'),
  code: z
    .enum([
      'MATH_DISCREPANCY',
      'FUTURE_DATE_ADJUSTED',
      'INVALID_DATE_FORMAT',
      'OLD_DATE_DETECTED',
      'CURRENCY_NORMALIZED',
      'CURRENCY_FALLBACK',
      'MERCHANT_GENERIC',
      'TAX_ANOMALY',
      'AMOUNT_NON_POSITIVE',
      'EXTRACTION_FAILED',
      'TIMEOUT_WARNING',
      'LOW_CONFIDENCE_EXTRACTION',
      'BLURRY_IMAGE_DETECTED',
    ])
    .describe('Machine-readable validation warning code'),
  message: z.string().describe('Human-readable explanation of the warning or adjustment'),
});

export type ValidationWarning = z.infer<typeof ValidationWarningSchema>;

/**
 * Raw structured output schema extracted directly by the LLM
 */
export const RawExpenseOutputSchema = z.object({
  merchantName: z
    .string()
    .describe('Name of the store, restaurant, vendor, or business'),
  totalAmount: z
    .number()
    .describe('Final total amount paid on the receipt'),
  currency: z
    .string()
    .describe('Currency ISO code or symbol (e.g. USD, EUR, $, etc.)'),
  date: z
    .string()
    .describe('Transaction date (format: YYYY-MM-DD or best approximate date)'),
  category: ExpenseCategoryEnum.describe(
    'Best matching expense category from the predefined list'
  ),
  items: z
    .array(ReceiptLineItemSchema)
    .optional()
    .default([])
    .describe('List of itemized products or services from the receipt'),
  tax: z
    .number()
    .nullable()
    .optional()
    .describe('Sales tax or VAT amount if identified'),
  confidence: z
    .enum(['high', 'medium', 'low'])
    .describe('AI confidence assessment for this receipt extraction'),
  summary: z
    .string()
    .optional()
    .describe('Brief 1-line description of the purchase'),
});

export type RawExpenseOutput = z.infer<typeof RawExpenseOutputSchema>;

/**
 * Enriched and validated output schema returned by the extraction flow
 */
export const ExpenseOutputSchema = RawExpenseOutputSchema.extend({
  isMathConsistent: z
    .boolean()
    .default(true)
    .describe('Whether line items and tax mathematically reconcile with the grand total'),
  warnings: z
    .array(ValidationWarningSchema)
    .default([])
    .describe('List of non-fatal business validation warnings or automated adjustments applied'),
});

export type ExpenseOutput = z.infer<typeof ExpenseOutputSchema>;
