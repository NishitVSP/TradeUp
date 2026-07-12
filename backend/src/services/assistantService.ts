/**
 * assistantService.ts
 *
 * Core brain of the chat widget, powered by Groq (llama-3.1-8b-instant —
 * cheapest model, still supports tool-calling well).
 *
 * Handles TWO kinds of user messages:
 *
 *   1. Concept questions ("what is theta decay?")
 *      → retrieve relevant docs from the knowledge base (RAG)
 *      → model answers in plain text, grounded in those docs
 *
 *   2. Trade instructions ("buy 2 lots of NIFTY ATM CE")
 *      → model calls the `propose_order` tool with structured fields
 *      → we do NOT execute yet — we return the proposed order to the frontend
 *      → frontend shows a confirm card; only on explicit confirm do we call
 *        orderService.executeOrder (see assistantController.confirmOrder)
 *
 * Uses Groq's OpenAI-compatible /chat/completions format — NOT Anthropic's
 * Messages API. Key differences to remember:
 *   - tools are {type: "function", function: {name, description, parameters}}
 *   - tool call arguments come back as a JSON STRING that must be parsed
 *   - system prompt is just the first message with role: "system"
 */

import { createChatCompletion } from '../config/groqClient';
import { retrieveRelevantDocs } from '../knowledge/optionsKnowledge';
import { logger } from '../utils/logger';

const MODEL = 'llama-3.1-8b-instant'; // cheapest Groq model with solid tool-calling support

export interface AssistantContext {
  spotPrices: Record<string, number | null>;
  atmStrikes: Record<string, number | null>;
  availableExpiries: Record<string, string[]>;
  balance: number;
}

export interface AssistantReply {
  type: 'text' | 'order_proposal';
  text?: string;
  orderProposal?: {
    indexName: string;
    strikePrice: number;
    expiryDate: string;
    optionType: 'CE' | 'PE';
    action: 'BUY' | 'SELL';
    orderType: 'MKT' | 'LMT';
    lots: number;
    lotSize: number;
    limitPrice?: number;
    summary: string;
  };
}

// OpenAI-style function/tool definition (Groq is OpenAI-compatible)
const PLACE_ORDER_TOOL = {
  type: 'function' as const,
  function: {
    name: 'propose_order',
    description:
      "Propose an options order based on the user's instruction. This does NOT execute the trade — " +
      'it only prepares a structured order for the user to confirm.',
    parameters: {
      type: 'object',
      properties: {
        indexName: { type: 'string', enum: ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'BANKEX', 'SENSEX'] },
        strikePrice: { type: 'number', description: 'Absolute strike price, e.g. 24000 — resolve ATM+offset using the ATM strike given in context.' },
        expiryDate: { type: 'string', description: 'Format DD-MM-YYYY, pick from the availableExpiries given in context.' },
        optionType: { type: 'string', enum: ['CE', 'PE'] },
        action: { type: 'string', enum: ['BUY', 'SELL'] },
        orderType: { type: 'string', enum: ['MKT', 'LMT'] },
        lots: { type: 'number' },
        lotSize: { type: 'number', description: 'Default to 25 if the user does not specify and index is NIFTY-like; ask if genuinely ambiguous.' },
        limitPrice: { type: 'number', description: 'Only required if orderType is LMT.' },
        summary: { type: 'string', description: 'One sentence, human-readable summary of this order for the user to confirm.' },
      },
      required: ['indexName', 'strikePrice', 'expiryDate', 'optionType', 'action', 'orderType', 'lots', 'lotSize', 'summary'],
    },
  },
};

function buildSystemPrompt(context: AssistantContext, relevantDocs: ReturnType<typeof retrieveRelevantDocs>): string {
  const docsBlock = relevantDocs.length
    ? relevantDocs.map((d) => `### ${d.id}\n${d.content}`).join('\n\n')
    : '(No specific reference docs matched this question — answer from general options knowledge, staying concise.)';

  return `You are the TradeUp trading assistant, embedded in a paper-trading options platform.

You do two things:
1. Explain options-trading concepts clearly and concisely (2-4 sentences unless asked for more).
2. Help the user place trades by calling the propose_order tool — you NEVER execute trades directly,
   you only propose them; a human confirms before anything happens.

Current market context (use this to resolve "ATM", "next week's expiry", etc.):
${JSON.stringify(context, null, 2)}

Reference material relevant to this question (ground your concept answers in this when applicable):
${docsBlock}

Rules:
- If the user asks a concept/how-it-works question, just answer in plain text. Do not call any tool.
- If the user gives a trade instruction, resolve strike/expiry using the context above, then call propose_order.
- If a trade instruction is ambiguous (e.g. no expiry, no lot count), ask ONE clarifying question in text instead of guessing.
- Never claim a trade has executed — only the confirm step executes it.
- Keep tone concise and professional, like a trading terminal assistant, not a chatty generic assistant.`;
}

export async function chatWithAssistant(
  userMessage: string,
  context: AssistantContext,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<AssistantReply> {
  const relevantDocs = retrieveRelevantDocs(userMessage);

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: buildSystemPrompt(context, relevantDocs) },
    ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await createChatCompletion({
      model: MODEL,
      messages: messages as any,
      tools: [PLACE_ORDER_TOOL],
      tool_choice: 'auto',
      max_completion_tokens: 512,
      temperature: 0.3, // keep it fairly deterministic — this is a trading tool, not a creative one
    });

    const choice = response.choices[0];
    const toolCall = choice.message.tool_calls?.[0];

    if (toolCall && toolCall.function.name === 'propose_order') {
      let input: any;
      try {
        input = JSON.parse(toolCall.function.arguments);
      } catch (parseErr) {
        logger.error('Failed to parse tool call arguments:', toolCall.function.arguments);
        return { type: 'text', text: "I had trouble structuring that order — could you rephrase it?" };
      }

      return {
        type: 'order_proposal',
        text: choice.message.content ?? undefined,
        orderProposal: {
          indexName: input.indexName,
          strikePrice: input.strikePrice,
          expiryDate: input.expiryDate,
          optionType: input.optionType,
          action: input.action,
          orderType: input.orderType,
          lots: input.lots,
          lotSize: input.lotSize,
          limitPrice: input.limitPrice,
          summary: input.summary,
        },
      };
    }

    return { type: 'text', text: choice.message.content ?? "Sorry, I couldn't process that." };
  } catch (error) {
    logger.error('assistantService.chatWithAssistant error:', error);
    return { type: 'text', text: 'The assistant is temporarily unavailable. Please try again.' };
  }
}