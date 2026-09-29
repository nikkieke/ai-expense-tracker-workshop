import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ai } from '../config/genkit.js';
import {
  GetExpensesInputSchema,
  GetExpensesOutputSchema,
  type GetExpensesInput,
  type GetExpensesOutput,
  type ExpenseTransaction,
} from '../schemas/chat.schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedTransactions: ExpenseTransaction[] | null = null;
let cachedFilePath: string | null = null;
let cachedMtimeMs: number = 0;

/**
 * Finds and loads transactions from transactions.json with mtime-aware in-memory caching.
 */
export function loadTransactions(forceReload: boolean = false): ExpenseTransaction[] {
  if (!forceReload && cachedTransactions && cachedFilePath && fs.existsSync(cachedFilePath)) {
    try {
      const stats = fs.statSync(cachedFilePath);
      if (stats.mtimeMs === cachedMtimeMs) {
        return cachedTransactions;
      }
    } catch {
      // Fall through to reload if stat check fails
    }
  }

  const possiblePaths = [
    path.resolve(process.cwd(), '../data/transactions.json'),
    path.resolve(process.cwd(), 'data/transactions.json'),
    path.resolve(__dirname, '../../../data/transactions.json'),
    path.resolve(__dirname, '../../data/transactions.json'),
    path.resolve(__dirname, '../data/transactions.json'),
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        if (Array.isArray(data)) {
          cachedTransactions = data;
          cachedFilePath = filePath;
          cachedMtimeMs = stats.mtimeMs;
          return data;
        }
      } catch (err) {
        console.error(`Error reading transactions from ${filePath}:`, err);
      }
    }
  }

  if (cachedTransactions) {
    return cachedTransactions;
  }

  console.warn('⚠️ Warning: transactions.json could not be found. Returning empty dataset.');
  return [];
}

/**
 * Filters transaction records and computes financial aggregations.
 */
export function filterExpenses(
  transactions: ExpenseTransaction[],
  input: Partial<GetExpensesInput> = {}
): GetExpensesOutput {
  const {
    category,
    merchantName,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    limit = 50,
  } = input;

  const matched = transactions.filter((txn) => {
    // Category filter
    if (category && txn.category.toLowerCase() !== category.toLowerCase()) {
      return false;
    }

    // Merchant name filter (case-insensitive substring match)
    if (merchantName) {
      const search = merchantName.toLowerCase().trim();
      const name = (txn.merchantName || '').toLowerCase();
      if (!name.includes(search)) {
        return false;
      }
    }

    // Date range filters (YYYY-MM-DD string comparison is ISO standard compliant)
    if (startDate && txn.date < startDate) {
      return false;
    }

    if (endDate && txn.date > endDate) {
      return false;
    }

    // Amount range filters
    if (minAmount !== undefined && txn.totalAmount < minAmount) {
      return false;
    }

    if (maxAmount !== undefined && txn.totalAmount > maxAmount) {
      return false;
    }

    return true;
  });

  // Sort by date descending (most recent first)
  matched.sort((a, b) => b.date.localeCompare(a.date));

  // Compute aggregations
  const totalSpent = Number(
    matched.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0).toFixed(2)
  );

  const categoryBreakdown: Record<string, number> = {};
  for (const txn of matched) {
    const cat = txn.category || 'Other';
    categoryBreakdown[cat] = Number(
      ((categoryBreakdown[cat] || 0) + txn.totalAmount).toFixed(2)
    );
  }

  const currency = matched[0]?.currency || 'USD';
  const slicedTransactions = matched.slice(0, limit);

  return {
    totalSpent,
    currency,
    count: matched.length,
    categoryBreakdown,
    transactions: slicedTransactions,
  };
}

/**
 * Genkit Tool that Gemini can call to look up expense transactions and financial metrics.
 */
export const getExpensesTool = ai.defineTool(
  {
    name: 'getExpenses',
    description:
      'Retrieves, filters, and calculates total spending from past expense transactions in the user database. Supports filtering by category (e.g. Groceries, Food & Dining, Transportation, Utilities, Shopping, Travel, Entertainment), merchant name, date ranges (startDate, endDate in YYYY-MM-DD format), or amount ranges.',
    inputSchema: GetExpensesInputSchema,
    outputSchema: GetExpensesOutputSchema,
  },
  async (input): Promise<GetExpensesOutput> => {
    const allTransactions = loadTransactions();
    return filterExpenses(allTransactions, input);
  }
);
