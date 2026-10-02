import {
  ai,
  primaryModel,
  fallbackModel,
  PRIMARY_MODEL_NAME,
  FALLBACK_MODEL_NAME,
} from '../config/genkit.js';
import {
  ChatInputSchema,
  ChatOutputSchema,
  type ChatInput,
  type ChatOutput,
} from '../schemas/chat.schema.js';
import { getExpensesTool } from '../tools/get-expenses.js';
import { withRetry } from '../utils/resilience.js';

/**
 * Builds the system instruction prompt with current calendar date anchor.
 */
function buildSystemPrompt(): string {
  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

  return `You are a helpful, accurate, and friendly personal financial assistant and expense advisor.

Current Reference Date: ${todayIso} (Year: ${currentYear}, Month: ${currentMonth})
User Transaction History: Records available from August 2026 to October 2026.

CORE INSTRUCTIONS:
1. ALWAYS use the "getExpenses" tool whenever the user asks about their spending, purchases, expenses, budget, or transactions.
2. Resolve relative timeframes accurately using the Current Reference Date:
   - "this month" / "current month": from ${currentYear}-${currentMonth}-01 to the end of month ${currentYear}-${currentMonth}-30 (or 31).
   - "last month": calculate the previous month range.
   - "this week" / "last week" / "yesterday": compute the exact ISO date ranges (YYYY-MM-DD).
3. If the user asks about a specific merchant (e.g. "How much at Starbucks?" or "Uber rides"), pass the merchant name to the tool.
4. If the user asks about a category (e.g. "Groceries", "Dining", "Transportation"), pass the appropriate category filter.
5. Provide clear, conversational, and well-structured answers:
   - Highlight the total amount spent in **bold** with the currency.
   - Include a concise bulleted list of notable purchases or category breakdowns when helpful.
   - If no transactions were found for the query, politely inform the user.`;
}

/**
 * Conversational Assistant Flow allowing users to query expenses in natural language.
 */
export const askExpenseAssistantFlow = ai.defineFlow(
  {
    name: 'askExpenseAssistantFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input: ChatInput): Promise<ChatOutput> => {
    const { message, history = [] } = input;

    // Convert history messages to Genkit multi-turn format if provided
    const messages = [
      ...history.map((h) => ({
        role: h.role,
        content: [{ text: h.content }],
      })),
      {
        role: 'user' as const,
        content: [{ text: message }],
      },
    ];

    let response: any = null;
    let usedFallbackModel = false;

    // 1. Attempt Primary Model
    try {
      response = await withRetry(
        async () => {
          return await ai.generate({
            model: primaryModel,
            system: buildSystemPrompt(),
            messages,
            tools: [getExpensesTool],
          });
        },
        {
          maxRetries: 2,
          timeoutMs: 20000,
          operationName: `Expense Assistant Primary (${PRIMARY_MODEL_NAME})`,
        }
      );
    } catch (err: any) {
      console.warn(
        `⚠️ Chat primary model (${PRIMARY_MODEL_NAME}) failed: ${err.message}. Triggering fallback model (${FALLBACK_MODEL_NAME})...`
      );
    }

    // 2. Attempt Fallback Model if Primary Model Failed
    if (!response) {
      response = await withRetry(
        async () => {
          return await ai.generate({
            model: fallbackModel,
            system: buildSystemPrompt(),
            messages,
            tools: [getExpensesTool],
          });
        },
        {
          maxRetries: 1,
          timeoutMs: 20000,
          operationName: `Expense Assistant Fallback (${FALLBACK_MODEL_NAME})`,
        }
      );
      usedFallbackModel = true;
    }

    const reply = response?.text || 'I could not process your financial query. Please try again.';

    // Observability: Log tool invocations for telemetry
    const toolsUsed: string[] = [];
    if (response.messages) {
      for (const msg of response.messages) {
        if (msg.content) {
          for (const part of msg.content) {
            if ('toolRequest' in part && part.toolRequest?.name) {
              if (!toolsUsed.includes(part.toolRequest.name)) {
                toolsUsed.push(part.toolRequest.name);
              }
            }
          }
        }
      }
    }

    if (toolsUsed.length > 0) {
      console.info(`[Observability] Gemini invoked tools: ${toolsUsed.join(', ')}`);
    } else {
      console.info('[Observability] Gemini generated a direct conversational response (no tools needed).');
    }

    if (usedFallbackModel) {
      console.info(`[Telemetry] Chat response generated using fallback model (${FALLBACK_MODEL_NAME}).`);
    }

    return {
      reply,
    };
  }
);
