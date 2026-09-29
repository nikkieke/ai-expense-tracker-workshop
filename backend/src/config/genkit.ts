import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const PRIMARY_MODEL_NAME = process.env.PRIMARY_MODEL || 'gemini-3.8-flash';
export const FALLBACK_MODEL_NAME = process.env.FALLBACK_MODEL || 'gemini-3.5-flash-lite';

export const primaryModel = googleAI.model(PRIMARY_MODEL_NAME);
export const fallbackModel = googleAI.model(FALLBACK_MODEL_NAME);

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  model: primaryModel,
});
