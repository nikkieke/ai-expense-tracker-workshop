import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Load environment variables cleanly (CLI export -> local .env -> backend/.env)
if (!process.env.GEMINI_API_KEY) {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../backend/.env'),
    path.resolve(process.cwd(), '../backend/.env'),
  ];

  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      if (process.env.GEMINI_API_KEY) break;
    }
  }
}

export const PRIMARY_MODEL_NAME = process.env.PRIMARY_MODEL || 'gemini-3.5-flash-lite';
export const primaryModel = googleAI.model(PRIMARY_MODEL_NAME);

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  model: primaryModel,
});
