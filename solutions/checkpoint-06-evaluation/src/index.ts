import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { extractReceiptFlow } from './flows/receipt.flow.js';
import { askExpenseAssistantFlow } from './flows/chat.flow.js';
import { loadTransactions, filterExpenses } from './tools/get-expenses.js';
import type { ExpenseCategory } from './schemas/expense.schema.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for development clients
app.use(cors());

// Support large payloads for base64 receipt photos (up to 25MB)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

/**
 * POST /api/expenses/scan-receipt
 * Extracts structured expense information from a receipt image (Base64 data URI or HTTP URL)
 */
app.post('/api/expenses/scan-receipt', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawImage = req.body.image || req.body.imageUrl;
    const preferredCurrency = req.body.preferredCurrency || 'USD';

    if (!rawImage || typeof rawImage !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing required field: "image" or "imageUrl" (must be a base64 Data URI or image URL)',
      });
      return;
    }

    // Ensure base64 string has proper Data URI prefix if raw base64 was sent
    let formattedImageUrl = rawImage.trim();
    if (
      !formattedImageUrl.startsWith('http://') &&
      !formattedImageUrl.startsWith('https://') &&
      !formattedImageUrl.startsWith('data:')
    ) {
      // Default to jpeg if no mime-type prefix is present
      formattedImageUrl = `data:image/jpeg;base64,${formattedImageUrl}`;
    }

    // Invoke Genkit extraction flow
    const extractedExpense = await extractReceiptFlow({
      imageUrl: formattedImageUrl,
      preferredCurrency,
    });

    res.status(200).json({
      success: true,
      data: extractedExpense,
    });
  } catch (error: any) {
    console.error('Error extracting receipt:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing the receipt',
    });
  }
});

/**
 * POST /api/chat
 * Natural language chat endpoint to answer user questions about their past expenses using Genkit tools
 */
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: "message" (must be a non-empty string)',
      });
      return;
    }

    const chatResponse = await askExpenseAssistantFlow({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
    });

    res.status(200).json({
      success: true,
      data: chatResponse,
    });
  } catch (error: any) {
    console.error('Error in chat assistant:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing the chat request',
    });
  }
});

/**
 * GET /api/expenses
 * Retrieves filtered transactions and calculated financial totals
 */
app.get('/api/expenses', (req: Request, res: Response): void => {
  try {
    const allTransactions = loadTransactions();
    const { category, merchantName, startDate, endDate, minAmount, maxAmount, limit } = req.query;

    const parsedMin = minAmount !== undefined && minAmount !== '' && !isNaN(Number(minAmount)) ? Number(minAmount) : undefined;
    const parsedMax = maxAmount !== undefined && maxAmount !== '' && !isNaN(Number(maxAmount)) ? Number(maxAmount) : undefined;
    const parsedLimit = limit !== undefined && limit !== '' && !isNaN(Number(limit)) ? Number(limit) : 50;

    const result = filterExpenses(allTransactions, {
      category: category ? (String(category) as ExpenseCategory) : undefined,
      merchantName: merchantName ? String(merchantName) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      minAmount: parsedMin,
      maxAmount: parsedMax,
      limit: parsedLimit,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while retrieving expenses',
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Expense Tracker Backend running on http://localhost:${PORT}`);
  console.log(`📸 Receipt Scan API: POST http://localhost:${PORT}/api/expenses/scan-receipt`);
  console.log(`💬 Expense Chat API: POST http://localhost:${PORT}/api/chat`);
  console.log(`📊 Expenses Query API: GET http://localhost:${PORT}/api/expenses`);
});

export default app;
