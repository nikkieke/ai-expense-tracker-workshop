import { z } from 'genkit';
import { ExpenseCategoryEnum, ReceiptLineItemSchema } from './expense.schema.js';

export const ExpenseTransactionSchema = z.object({
  id: z.string().describe('Unique identifier of the transaction'),
  merchantName: z.string().describe('Name of the merchant or store'),
  totalAmount: z.number().describe('Total amount of the transaction'),
  currency: z.string().default('USD').describe('Currency of the transaction (e.g. USD)'),
  date: z.string().describe('Date of the transaction in YYYY-MM-DD format'),
  category: ExpenseCategoryEnum.describe('Category of the expense'),
  summary: z.string().optional().describe('Short description or note about the transaction'),
  items: z.array(ReceiptLineItemSchema).optional().describe('Optional list of itemized line items'),
  tax: z.number().nullable().optional().describe('Tax amount if listed'),
});

export type ExpenseTransaction = z.infer<typeof ExpenseTransactionSchema>;

export const GetExpensesInputSchema = z.object({
  category: ExpenseCategoryEnum.optional().describe(
    'Filter by expense category (e.g., Groceries, Food & Dining, Transportation, Utilities, Shopping, Travel, Entertainment, Other)'
  ),
  merchantName: z
    .string()
    .optional()
    .describe('Filter by merchant name (case-insensitive search, e.g., "Whole Foods", "Uber", "Trader Joe")'),
  startDate: z
    .string()
    .optional()
    .describe('Filter transactions on or after this date (format: YYYY-MM-DD)'),
  endDate: z
    .string()
    .optional()
    .describe('Filter transactions on or before this date (format: YYYY-MM-DD)'),
  minAmount: z.number().optional().describe('Minimum total amount filter'),
  maxAmount: z.number().optional().describe('Maximum total amount filter'),
  limit: z.number().optional().default(50).describe('Maximum number of transactions to return'),
});

export type GetExpensesInput = z.infer<typeof GetExpensesInputSchema>;

export const GetExpensesOutputSchema = z.object({
  totalSpent: z.number().describe('Sum total of all matching expenses'),
  currency: z.string().describe('Currency code (e.g., USD)'),
  count: z.number().describe('Number of transactions matched'),
  categoryBreakdown: z
    .record(z.string(), z.number())
    .describe('Spending breakdown aggregated by category'),
  transactions: z.array(ExpenseTransactionSchema).describe('List of matched transactions'),
});

export type GetExpensesOutput = z.infer<typeof GetExpensesOutputSchema>;

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model', 'system']).describe('Role of the message sender'),
  content: z.string().describe('Text content of the message'),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatInputSchema = z.object({
  message: z.string().describe("User's question or message regarding their expenses"),
  history: z
    .array(ChatMessageSchema)
    .optional()
    .default([])
    .describe('Optional previous conversation turns'),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.object({
  reply: z.string().describe("Assistant's conversational response"),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

