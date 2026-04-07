import { Request, Response } from 'express';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { getContractLTP } from '../services/optionsSimulator';
import { logger } from '../utils/logger';

const DB_PATH = './data/tradeup.db';

async function getDb() {
  return open({ filename: DB_PATH, driver: sqlite3.Database });
}

// The auth middleware (middleware/auth.ts) sets req.user = { userId, email }
function getUserId(req: Request): number | null {
  const user = (req as any).user;
  return user?.userId ?? user?.user_id ?? null;
}

// ─── Place Order ──────────────────────────────────────────────────────────────
/**
 * POST /api/orders
 * Paper trading — executes immediately.
 * Body: { indexName, strikePrice, expiryDate, optionType, action, orderType, lots, lotSize, limitPrice? }
 */
export async function placeOrder(req: Request, res: Response): Promise<void> {
  const db = await getDb();

  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { indexName, strikePrice, expiryDate, optionType, action, orderType, lots, lotSize, limitPrice } = req.body;

    if (!indexName || strikePrice === undefined || !expiryDate || !optionType || !action || !orderType || !lots || !lotSize) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const quantity = Number(lots) * Number(lotSize);

    const contract = await db.get(
      `SELECT contract_id, ltp FROM options_contract
       WHERE index_name = ? AND strike_price = ? AND expiry_date = ? AND option_type = ?`,
      [indexName, Number(strikePrice), expiryDate, optionType]
    );

    if (!contract) {
      res.status(404).json({ success: false, message: 'Contract not found. Ensure it is being watched.' });
      return;
    }

    let executionPrice: number;
    if (orderType === 'LMT' && limitPrice) {
      executionPrice = parseFloat(limitPrice);
    } else {
      const liveLtp  = await getContractLTP(
        indexName,
        Number(strikePrice),
        optionType as 'CE' | 'PE',
        expiryDate
      );
      executionPrice = liveLtp ?? contract.ltp ?? 0;
    }

    if (!executionPrice || executionPrice <= 0) {
      res.status(400).json({ success: false, message: 'LTP not available yet. Try again shortly.' });
      return;
    }

    // Enforce virtual balance check for BUY orders before execution
    if (action === 'BUY') {
      const userRow = await db.get(`SELECT balance FROM users WHERE user_id = ?`, [userId]);
      const currentBalance = Number(userRow?.balance ?? 0);
      const required = executionPrice * quantity;
      if (required > currentBalance) {
        res.status(400).json({
          success: false,
          message: `Insufficient balance. Required ₹${required.toFixed(2)}, available ₹${currentBalance.toFixed(2)}.`,
        });
        return;
      }
    }

    const now = new Date().toISOString();

    const orderResult = await db.run(
      `INSERT INTO orders (user_id, contract_id, order_type, action, quantity, limit_price, status, placed_at, executed_at, execution_price)
       VALUES (?, ?, ?, ?, ?, ?, 'EXECUTED', ?, ?, ?)`,
      [userId, contract.contract_id, orderType, action, quantity, limitPrice ?? null, now, now, executionPrice]
    );

    const orderId = orderResult.lastID;

    const existingPos = await db.get(
      `SELECT position_id, quantity FROM positions WHERE user_id = ? AND contract_id = ?`,
      [userId, contract.contract_id]
    );

    if (existingPos) {
      const newQty = Math.max(0,
        action === 'BUY' ? existingPos.quantity + quantity : existingPos.quantity - quantity
      );
      if (newQty === 0) {
        await db.run(`DELETE FROM positions WHERE user_id = ? AND contract_id = ?`, [userId, contract.contract_id]);
      } else {
        await db.run(
          `UPDATE positions SET quantity = ?, unrealized_pnl = 0 WHERE user_id = ? AND contract_id = ?`,
          [newQty, userId, contract.contract_id]
        );
      }
    } else {
      await db.run(
        `INSERT INTO positions (user_id, contract_id, quantity, unrealized_pnl, realized_pnl) VALUES (?, ?, ?, 0, 0)`,
        [userId, contract.contract_id, quantity]
      );
    }

    const balanceChange = action === 'BUY' ? -(executionPrice * quantity) : executionPrice * quantity;
    await db.run(`UPDATE users SET balance = balance + ? WHERE user_id = ?`, [balanceChange, userId]);
    const updatedUser = await db.get(`SELECT balance FROM users WHERE user_id = ?`, [userId]);
    const balanceAfter = Number(updatedUser?.balance ?? 0);

    logger.info(`Order #${orderId}: user=${userId} ${action} ${quantity} ${indexName} ${strikePrice} ${optionType} @${executionPrice}`);

    res.json({
      success: true,
      data: { orderId, executionPrice, quantity, action, status: 'EXECUTED', executedAt: now, balanceAfter },
    });
  } catch (error) {
    logger.error('Place order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await db.close();
  }
}

// ─── Get Orders ───────────────────────────────────────────────────────────────
/**
 * GET /api/orders?status=&limit=50&offset=0
 */
export async function getOrders(req: Request, res: Response): Promise<void> {
  const db = await getDb();

  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { status, limit = '50', offset = '0' } = req.query;
    const limitN  = Math.min(parseInt(limit as string, 10), 200);
    const offsetN = parseInt(offset as string, 10);

    let query = `
      SELECT o.order_id, o.order_type, o.action, o.quantity, o.limit_price,
             o.status, o.placed_at, o.executed_at, o.execution_price,
             c.index_name, c.strike_price, c.expiry_date, c.option_type
      FROM orders o
      JOIN options_contract c ON o.contract_id = c.contract_id
      WHERE o.user_id = ?`;
    const params: (string | number)[] = [userId];

    if (status) { query += ' AND o.status = ?'; params.push(status as string); }
    query += ' ORDER BY o.placed_at DESC LIMIT ? OFFSET ?';
    params.push(limitN, offsetN);

    const orders = await db.all(query, params);
    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await db.close();
  }
}

// ─── Get Positions ────────────────────────────────────────────────────────────
/**
 * GET /api/orders/positions
 */
export async function getPositions(req: Request, res: Response): Promise<void> {
  const db = await getDb();

  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const positions = await db.all(
      `SELECT p.position_id, p.quantity, p.unrealized_pnl, p.realized_pnl,
              c.index_name, c.strike_price, c.expiry_date, c.option_type, c.ltp AS current_ltp
       FROM positions p
       JOIN options_contract c ON p.contract_id = c.contract_id
       WHERE p.user_id = ? AND p.quantity > 0
       ORDER BY p.position_id DESC`,
      [userId]
    );

    res.json({ success: true, data: positions });
  } catch (error) {
    logger.error('Get positions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await db.close();
  }
}

// ─── Cancel Order ─────────────────────────────────────────────────────────────
/**
 * PATCH /api/orders/:orderId/cancel
 */
export async function cancelOrder(req: Request, res: Response): Promise<void> {
  const db = await getDb();

  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { orderId } = req.params;
    const order = await db.get(
      `SELECT order_id, status FROM orders WHERE order_id = ? AND user_id = ?`,
      [orderId, userId]
    );

    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    if (order.status !== 'PENDING') {
      res.status(400).json({ success: false, message: `Cannot cancel an order with status: ${order.status}` });
      return;
    }

    await db.run(`UPDATE orders SET status = 'CANCELLED' WHERE order_id = ?`, [orderId]);
    res.json({ success: true, message: 'Order cancelled' });
  } catch (error) {
    logger.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await db.close();
  }
}

// ─── Close Position ───────────────────────────────────────────────────────────
/**
 * POST /api/orders/close-position
 * Body: { indexName, strikePrice, expiryDate, optionType }
 */
export async function closePositionApi(req: Request, res: Response): Promise<void> {
  const db = await getDb();

  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { indexName, strikePrice, expiryDate, optionType } = req.body;

    if (!indexName || strikePrice === undefined || !expiryDate || !optionType) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const contract = await db.get(
      `SELECT contract_id, ltp FROM options_contract
       WHERE index_name = ? AND strike_price = ? AND expiry_date = ? AND option_type = ?`,
      [indexName, Number(strikePrice), expiryDate, optionType]
    );

    if (!contract) { res.status(404).json({ success: false, message: 'Contract not found' }); return; }

    const position = await db.get(
      `SELECT position_id, quantity FROM positions WHERE user_id = ? AND contract_id = ? AND quantity > 0`,
      [userId, contract.contract_id]
    );

    if (!position) { res.status(404).json({ success: false, message: 'No open position found' }); return; }

    const liveLtp    = await getContractLTP(
      indexName,
      Number(strikePrice),
      optionType as 'CE' | 'PE',
      expiryDate
    );
    const closePrice = liveLtp ?? contract.ltp ?? 0;
    const now        = new Date().toISOString();

    await db.run(
      `INSERT INTO orders (user_id, contract_id, order_type, action, quantity, status, placed_at, executed_at, execution_price)
       VALUES (?, ?, 'MKT', 'SELL', ?, 'EXECUTED', ?, ?, ?)`,
      [userId, contract.contract_id, position.quantity, now, now, closePrice]
    );

    const credit = closePrice * position.quantity;
    await db.run(
      `UPDATE positions SET quantity = 0, realized_pnl = realized_pnl + ? WHERE user_id = ? AND contract_id = ?`,
      [credit, userId, contract.contract_id]
    );
    await db.run(`UPDATE users SET balance = balance + ? WHERE user_id = ?`, [credit, userId]);
    const updatedUser = await db.get(`SELECT balance FROM users WHERE user_id = ?`, [userId]);
    const balanceAfter = Number(updatedUser?.balance ?? 0);

    logger.info(`Position closed: user=${userId} ${indexName} ${strikePrice} ${optionType} qty=${position.quantity} @${closePrice}`);
    res.json({ success: true, data: { closePrice, quantity: position.quantity, realizedPnl: credit, balanceAfter } });
  } catch (error) {
    logger.error('Close position error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await db.close();
  }
}

// ─── Batch LTP Fetch (frontend tiered poller) ─────────────────────────────────
/**
 * POST /api/orders/ltps
 * Body: { contracts: [{ indexName, strikePrice, expiryDate, optionType }] }
 */
export async function getContractLTPs(req: Request, res: Response): Promise<void> {
  const db = await getDb();

  try {
    const { contracts } = req.body;

    if (!Array.isArray(contracts) || contracts.length === 0) {
      res.status(400).json({ success: false, message: 'contracts array required' });
      return;
    }

    const results = await Promise.all(
      contracts.map(async (c: { indexName: string; strikePrice: number; expiryDate: string; optionType: string }) => {
        const row = await db.get(
          `SELECT ltp FROM options_contract
           WHERE index_name = ? AND strike_price = ? AND expiry_date = ? AND option_type = ?`,
          [c.indexName, Number(c.strikePrice), c.expiryDate, c.optionType]
        );
        return {
          key: `${c.indexName}-${c.strikePrice}-${c.expiryDate}-${c.optionType}`,
          ltp: row?.ltp ?? null,
        };
      })
    );

    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Get LTPs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await db.close();
  }
}