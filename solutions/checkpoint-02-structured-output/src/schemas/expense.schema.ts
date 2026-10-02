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

/**
 * Raw structured output schema enforced via Gemini JSON Mode
 */
export const RawExpenseOutputSchema = z.object({
  merchantName: z
    .string()
    .describe('Name of the store, restaurant, vendor, or business'),
  totalAmount: z
    .number()
    .describe('Final total amount paid on the receipt (must be a positive number)'),
  currency: z
    .string()
    .describe('Currency ISO code (e.g. USD, EUR, GBP) or detected symbol'),
  date: z
    .string()
    .describe('Transaction date in YYYY-MM-DD format'),
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
