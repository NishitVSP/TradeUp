import { Request, Response } from 'express';
import { chatWithAssistant, AssistantContext } from '../services/assistantService';
import { executeOrder, OrderInput } from '../services/orderService';
import { getAllSpots } from '../services/indexPoller';
import { fetchExpiryDates } from '../scripts/fetchExpiryDates';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { logger } from '../utils/logger';

function getUserId(req: Request): number | null {
  const user = (req as any).user;
  return user?.userId ?? user?.user_id ?? null;
}

const STRIKE_STEP: Record<string, number> = {
  NIFTY: 50, BANKNIFTY: 100, FINNIFTY: 50, MIDCPNIFTY: 25, BANKEX: 100, SENSEX: 100,
};

async function buildContext(userId: number): Promise<AssistantContext> {
  const spotPrices = getAllSpots();

  const atmStrikes: Record<string, number | null> = {};
  for (const [index, spot] of Object.entries(spotPrices)) {
    const step = STRIKE_STEP[index] ?? 50;
    atmStrikes[index] = spot ? Math.round(spot / step) * step : null;
  }

  const availableExpiries: Record<string, string[]> = {};
  for (const e of fetchExpiryDates()) availableExpiries[e.index] = e.expiries;

  const db = await open({ filename: './data/tradeup.db', driver: sqlite3.Database });
  const userRow = await db.get(`SELECT balance FROM users WHERE user_id = ?`, [userId]);
  await db.close();

  return { spotPrices, atmStrikes, availableExpiries, balance: Number(userRow?.balance ?? 0) };
}

/**
 * POST /api/assistant/chat
 * Body: { message: string, history?: Array<{role, content}> }
 */
export async function chat(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, message: 'message is required' });
      return;
    }

    const context = await buildContext(userId);
    const reply = await chatWithAssistant(message, context, history ?? []);

    // Defense against LLM hallucination: the model can occasionally invent an
    // expiry date or an off-grid strike that doesn't actually exist in our
    // data. Never trust generated order fields blindly — validate against
    // the real context before showing the proposal to the user.
    if (reply.type === 'order_proposal' && reply.orderProposal) {
      const proposal = reply.orderProposal;
      const validExpiries = context.availableExpiries[proposal.indexName] ?? [];
      const step = STRIKE_STEP[proposal.indexName] ?? 50;

      const expiryValid = validExpiries.includes(proposal.expiryDate);
      const strikeValid = proposal.strikePrice % step === 0;

      if (!expiryValid || !strikeValid) {
        logger.warn(
          `Assistant proposed an invalid order (expiryValid=${expiryValid}, strikeValid=${strikeValid}): ${JSON.stringify(proposal)}`
        );
        res.json({
          success: true,
          data: {
            type: 'text',
            text: !expiryValid
              ? `I picked an expiry (${proposal.expiryDate}) that isn't actually available for ${proposal.indexName}. Available expiries: ${validExpiries.join(', ') || 'none loaded'}. Could you specify one?`
              : `That strike doesn't align to ${proposal.indexName}'s ${step}-point step. Could you rephrase (e.g. "ATM", "ATM+2")?`,
          },
        });
        return;
      }
    }

    res.json({ success: true, data: reply });
  } catch (error) {
    logger.error('Assistant chat error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * POST /api/assistant/confirm-order
 * Body: the orderProposal object returned by /chat, unmodified or user-edited.
 * This is the ONLY place an assistant-originated order actually touches money.
 */
export async function confirmOrder(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const input: OrderInput = req.body;
    const result = await executeOrder(userId, input);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    logger.error('Assistant confirm-order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}