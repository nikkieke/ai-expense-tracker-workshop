import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { extractReceiptFlow } from './flows/receipt.flow.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

/**
 * POST /api/expenses/scan-receipt
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

    let formattedImageUrl = rawImage.trim();
    if (
      !formattedImageUrl.startsWith('http://') &&
      !formattedImageUrl.startsWith('https://') &&
      !formattedImageUrl.startsWith('data:')
    ) {
      formattedImageUrl = `data:image/jpeg;base64,${formattedImageUrl}`;
    }

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

app.listen(PORT, () => {
  console.log(`🚀 [Checkpoint 01: Native AI] Server running at http://localhost:${PORT}`);
});
