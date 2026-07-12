/**
 * groqClient.ts
 *
 * Wraps the Groq SDK with automatic API-key rotation.
 *
 * Why: Groq's free/dev tier has per-key rate limits (TPM/RPM). Since you have
 * 3 keys from different accounts, this tries key #1 first; if it hits a
 * rate-limit (429) or auth/quota error, it automatically retries the SAME
 * request on the next key — completely transparent to the rest of the app.
 *
 * Setup: put all 3 keys in backend/.env as:
 *   GROQ_API_KEY_1=...
 *   GROQ_API_KEY_2=...
 *   GROQ_API_KEY_3=...
 * (GROQ_API_KEY, singular, also works as a 4th/fallback for compatibility)
 */

import Groq from 'groq-sdk';
import { logger } from '../utils/logger';

function loadKeys(): string[] {
  const keys = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY, // optional extra/fallback
  ].filter((k): k is string => !!k && k.trim().length > 0);

  if (keys.length === 0) {
    throw new Error('No Groq API keys found. Set GROQ_API_KEY_1 (and _2, _3) in .env');
  }
  return keys;
}

const API_KEYS = loadKeys();
logger.info(`Groq client initialized with ${API_KEYS.length} API key(s)`);

// One SDK client per key, created lazily and cached
const clients: Map<string, Groq> = new Map();
function getClient(apiKey: string): Groq {
  if (!clients.has(apiKey)) {
    clients.set(apiKey, new Groq({ apiKey }));
  }
  return clients.get(apiKey)!;
}

// Round-robin starting point so we don't always hammer key #1 first
let cursor = 0;

/** Errors worth rotating keys for: rate limit, quota exceeded, invalid/expired key */
function isRotatableError(err: any): boolean {
  const status = err?.status ?? err?.response?.status;
  return status === 429 || status === 401 || status === 403;
}

/**
 * Calls Groq's chat.completions.create, automatically rotating through all
 * configured API keys if one fails with a rate-limit/quota/auth error.
 */
export async function createChatCompletion(
  params: any
): Promise<Groq.Chat.Completions.ChatCompletion> {
  let lastError: any = null;

  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    const keyIndex = (cursor + attempt) % API_KEYS.length;
    const apiKey = API_KEYS[keyIndex];
    const client = getClient(apiKey);

    try {
      const result = await client.chat.completions.create(params);
      cursor = keyIndex; // stick with the key that worked
      return result as Groq.Chat.Completions.ChatCompletion;
    } catch (err: any) {
      lastError = err;
      if (isRotatableError(err)) {
        logger.warn(`Groq key #${keyIndex + 1} failed (${err?.status ?? 'unknown'}), trying next key...`);
        continue;
      }
      // Non-rotatable error (bad request, model error, etc.) — fail fast
      throw err;
    }
  }

  logger.error('All Groq API keys exhausted or failed.');
  throw lastError;
}