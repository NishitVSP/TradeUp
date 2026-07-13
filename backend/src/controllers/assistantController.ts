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

// Real per-index lot sizes — must match terminalSlice.ts's LOT_SIZES on the
// frontend exactly. This is the source of truth the assistant's proposed
// lotSize gets forced to below; never trust the LLM's guess here, since it
// directly determines quantity and how much balance an order debits/credits.
const LOT_SIZES: Record<string, number> = {
  NIFTY: 65, BANKNIFTY: 30, FINNIFTY: 60, MIDCPNIFTY: 120, BANKEX: 30, SENSEX: 20,
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

  return { spotPrices, atmStrikes, availableExpiries, balance: Number(userRow?.balance ?? 0), lotSizes: LOT_SIZES };
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

      // Defense against LLM hallucination #2: the model has been observed to
      // guess a lot size (e.g. defaulting to 25) instead of using the real
      // per-index value. Lot size directly determines order quantity and how
      // much balance gets debited/credited, so it is never trusted from the
      // model — always overwritten with the real value before this proposal
      // is shown to the user or can reach executeOrder.
      const correctLotSize = LOT_SIZES[proposal.indexName];
      if (correctLotSize && proposal.lotSize !== correctLotSize) {
        logger.warn(
          `Assistant proposed lotSize=${proposal.lotSize} for ${proposal.indexName}, correcting to ${correctLotSize}`
        );
        proposal.lotSize = correctLotSize;
      }

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

      // Defense against LLM hallucination #3 — the most serious one: the
      // model's freeform text/summary has been observed to disagree with its
      // own structured tool arguments (e.g. saying "CE" in prose while the
      // actual optionType field says "PE"). confirm-order always executes
      // the STRUCTURED fields, never the prose — so if we show the model's
      // prose to the user, what they read can silently differ from what
      // gets traded. Eliminate that possibility entirely by throwing away
      // the model's text/summary here and deriving both deterministically
      // from the now-validated proposal fields instead.
      const confirmText =
        `${proposal.action} ${proposal.lots} lot(s) of ${proposal.indexName} ${proposal.strikePrice} ${proposal.optionType} ` +
        `· expiry ${proposal.expiryDate} · ${proposal.orderType}` +
        (proposal.orderType === 'LMT' && proposal.limitPrice ? ` @ ₹${proposal.limitPrice}` : '');
      reply.text = confirmText;
      proposal.summary = confirmText;
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