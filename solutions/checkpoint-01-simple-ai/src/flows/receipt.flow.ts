import { ai, primaryModel } from '../config/genkit.js';

export interface SimpleReceiptInput {
  imageUrl: string;
  preferredCurrency?: string;
}

export interface SimpleReceiptOutput {
  merchantName: string;
  totalAmount: number;
  currency: string;
  date: string;
  category: string;
  items: Array<{ name: string; price?: number | null; quantity?: number | null }>;
  tax?: number | null;
  confidence: string;
  summary: string;
}

/**
 * Checkpoint 01: Simple AI Extraction Flow
 * - Uses a simple, freeform prompt
 * - Relies on regex / JSON.parse to extract data
 */
export async function extractReceiptFlow(input: SimpleReceiptInput): Promise<SimpleReceiptOutput> {
  const { imageUrl, preferredCurrency = 'USD' } = input;

  const response = await ai.generate({
    model: primaryModel,
    prompt: [
      { media: { url: imageUrl } },
      {
        text: `You are an AI assistant that extracts receipt data.
Analyze the provided receipt image and extract the following information as JSON:
- merchantName: Name of the merchant or store
- totalAmount: Total expense amount (number)
- currency: Currency (e.g. "${preferredCurrency}")
- date: Transaction date in YYYY-MM-DD
- category: Category of expense (Food & Dining, Groceries, Transportation, Entertainment, Utilities, Shopping, Travel, Other)
- items: List of purchased line items with name, price, and quantity
- tax: Tax amount if available
- confidence: high, medium, or low
- summary: A one-sentence summary of the receipt`,
      },
    ],
    config: {
      temperature: 0.7, // Non-zero default temperature
    },
  });

  const rawText = response.text || '';

  // Attempt to parse JSON from the unstructured response text
  try {
    const cleaned = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      merchantName: parsed.merchantName || 'Unknown Merchant',
      totalAmount: typeof parsed.totalAmount === 'number' ? parsed.totalAmount : parseFloat(parsed.totalAmount) || 0,
      currency: parsed.currency || preferredCurrency,
      date: parsed.date || new Date().toISOString().split('T')[0],
      category: parsed.category || 'Other',
      items: Array.isArray(parsed.items) ? parsed.items : [],
      tax: parsed.tax ?? null,
      confidence: parsed.confidence || 'medium',
      summary: parsed.summary || rawText.slice(0, 100),
    };
  } catch {
    // Simple fallback if the LLM output wasn't valid JSON
    return {
      merchantName: 'Unknown Merchant',
      totalAmount: 0,
      currency: preferredCurrency,
      date: new Date().toISOString().split('T')[0],
      category: 'Other',
      items: [],
      tax: null,
      confidence: 'low',
      summary: rawText.slice(0, 120),
    };
  }
}
