/**
 * orderService.ts
 *
 * Core order-placement logic, extracted from orderController.placeOrder
 * so it can be called from TWO places:
 *   1. POST /api/orders          (normal UI order form)
 *   2. POST /api/assistant/chat  (AI assistant, after user confirms)
 *
 * This keeps a SINGLE validated code path for money-moving actions —
 * the AI assistant can only ever call this function, never touch the DB directly.
 */

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { getContractLTP } from './optionsSimulator';
import { logger } from '../utils/logger';

const DB_PATH = './data/tradeup.db';

export interface OrderInput {
  indexName: string;
  strikePrice: number;
  expiryDate: string;
  optionType: 'CE' | 'PE';
  action: 'BUY' | 'SELL';
  orderType: 'MKT' | 'LMT';
  lots: number;
  lotSize: number;
  limitPrice?: number;
}

export interface OrderResult {
  success: boolean;
  message: string;
  data?: any;
}

async function getDb() {
  return open({ filename: DB_PATH, driver: sqlite3.Database });
}

/**
 * Executes an order for a given user. Same logic as orderController.placeOrder,
 * just callable directly instead of via req/res.
 */
export async function executeOrder(userId: number, input: OrderInput): Promise<OrderResult> {
  const db = await getDb();

  try {
    const { indexName, strikePrice, expiryDate, optionType, action, orderType, lots, lotSize, limitPrice } = input;

    if (!indexName || strikePrice === undefined || !expiryDate || !optionType || !action || !orderType || !lots || !lotSize) {
      return { success: false, message: 'Missing required order fields' };
    }

    const quantity = Number(lots) * Number(lotSize);

    const contract = await db.get(
      `SELECT contract_id, ltp FROM options_contract
       WHERE index_name = ? AND strike_price = ? AND expiry_date = ? AND option_type = ?`,
      [indexName, Number(strikePrice), expiryDate, optionType]
    );

    if (!contract) {
      return { success: false, message: `Contract not found: ${indexName} ${strikePrice} ${optionType} (${expiryDate}). Make sure it's being watched first.` };
    }

    // Limit order → stays PENDING
    if (orderType === 'LMT' && limitPrice) {
      const now = new Date().toISOString();
      const orderResult = await db.run(
        `INSERT INTO orders (user_id, contract_id, order_type, action, quantity, limit_price, status, placed_at, executed_at, execution_price)
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, NULL, NULL)`,
        [userId, contract.contract_id, orderType, action, quantity, limitPrice, now]
      );
      return {
        success: true,
        message: 'Limit order placed. Will execute when price crosses limit.',
        data: { orderId: orderResult.lastID, status: 'PENDING' },
      };
    }

    // Market order → executes now
    const liveLtp = await getContractLTP(indexName, Number(strikePrice), optionType, expiryDate);
    const executionPrice = liveLtp ?? contract.ltp ?? 0;

    if (!executionPrice || executionPrice <= 0) {
      return { success: false, message: 'LTP not available yet. Try again shortly.' };
    }

    if (action === 'BUY') {
      const userRow = await db.get(`SELECT balance FROM users WHERE user_id = ?`, [userId]);
      const currentBalance = Number(userRow?.balance ?? 0);
      const required = executionPrice * quantity;
      if (required > currentBalance) {
        return {
          success: false,
          message: `Insufficient balance. Required ₹${required.toFixed(2)}, available ₹${currentBalance.toFixed(2)}.`,
        };
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
      const newQty = Math.max(0, action === 'BUY' ? existingPos.quantity + quantity : existingPos.quantity - quantity);
      if (newQty === 0) {
        await db.run(`DELETE FROM positions WHERE user_id = ? AND contract_id = ?`, [userId, contract.contract_id]);
      } else {
        await db.run(`UPDATE positions SET quantity = ?, unrealized_pnl = 0 WHERE user_id = ? AND contract_id = ?`, [newQty, userId, contract.contract_id]);
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

    logger.info(`[assistant/order] #${orderId}: user=${userId} ${action} ${quantity} ${indexName} ${strikePrice} ${optionType} @${executionPrice}`);

    return {
      success: true,
      message: `Executed: ${action} ${lots} lot(s) of ${indexName} ${strikePrice} ${optionType} @ ₹${executionPrice}`,
      data: {
        orderId, executionPrice, quantity, action, status: 'EXECUTED',
        executedAt: now, balanceAfter: Number(updatedUser?.balance ?? 0),
      },
    };
  } catch (error) {
    logger.error('executeOrder error:', error);
    return { success: false, message: 'Internal server error while placing order' };
  } finally {
    await db.close();
  }
}