/**
 * optionsSimulator.ts
 *
 * Manages LTP simulation for watched option contracts using Worker threads.
 *
 * Architecture:
 *  ┌─────────────────────────────────────────────────┐
 *  │  Main thread                                    │
 *  │  • Manages watchedContracts Map                 │
 *  │  • Broadcasts spot prices to workers (300ms)    │
 *  │  • Receives computed LTPs from workers          │
 *  │  • Batch-writes LTPs to SQLite (WAL, 150ms)     │
 *  └──────┬──────────────────────────────────────────┘
 *         │  Worker threads (worker_threads API)
 *  ┌──────┴──────────────────────────────────────────┐
 *  │  HOT  worker  (≤5 from ATM)   500ms             │
 *  │  WARM worker  (6-10 from ATM) 1000ms            │
 *  │  COLD worker  (>10 from ATM)  2000ms            │
 *  └─────────────────────────────────────────────────┘
 *
 * CPU allocation (on a typical 8-core laptop):
 *   8 - 2 = 6 available → min(6, 3) = 3 workers (one per tier)
 *   1 CPU reserved for Node.js main thread
 *   1 CPU reserved for OS + frontend
 */

import { Worker }   from 'worker_threads';
import { cpus }     from 'os';
import path         from 'path';
import { open }     from 'sqlite';
import sqlite3      from 'sqlite3';
import { getSpotPrice, getAllSpots } from './indexPoller';
import { logger }   from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WatchedContract {
  indexName:    string;
  strikePrice:  number;
  expiryDate:   string;
  optionType:   'CE' | 'PE';
  tier:         Tier;
}

interface ContractSpec {
  key:          string;
  indexName:    string;
  strikePrice:  number;
  expiryDate:   string;
  optionType:   'CE' | 'PE';
}

type Tier = 'hot' | 'warm' | 'cold';

// ─── Config ───────────────────────────────────────────────────────────────────

const DB_PATH = './data/tradeup.db';

const STEP: Record<string, number> = {
  NIFTY: 50, BANKNIFTY: 100, FINNIFTY: 50,
  MIDCPNIFTY: 25, BANKEX: 100, SENSEX: 100,
};

const TIER_INTERVALS: Record<Tier, number> = { hot: 500, warm: 1000, cold: 2000 };

// Reserve 1 for main thread + 1 for OS/frontend; cap at 3 (one per tier)
const NUM_WORKERS = Math.min(Math.max(1, cpus().length - 2), 3);

// ─── State ────────────────────────────────────────────────────────────────────

export const watchedContracts = new Map<string, WatchedContract>();

const workers: Partial<Record<Tier, Worker>> = {};

// Pending LTP updates — accumulated from worker messages, batch-flushed to DB
const pending = new Map<string, {
  indexName: string; strikePrice: number;
  expiryDate: string; optionType: string; ltp: number;
}>();

let started            = false;
let spotBroadcast:       NodeJS.Timeout | null = null;
let dbFlushInterval:     NodeJS.Timeout | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeKey(c: { indexName: string; strikePrice: number; expiryDate: string; optionType: string }): string {
  return `${c.indexName}-${c.strikePrice}-${c.expiryDate}-${c.optionType}`;
}

function getTier(indexName: string, strikePrice: number, spot: number): Tier {
  const step = STEP[indexName] ?? 50;
  const dist = Math.abs(strikePrice - Math.round(spot / step) * step) / step;
  if (dist <= 5)  return 'hot';
  if (dist <= 10) return 'warm';
  return 'cold';
}

/** Maps a logical tier to whichever worker is actually available */
function resolveWorker(tier: Tier): Worker | undefined {
  if (workers[tier])   return workers[tier];
  if (workers['hot'])  return workers['hot'];  // fallback: hot handles everything on 1-worker setup
  return undefined;
}

function workerFile(): string {
  const base = path.resolve(__dirname, '../workers/ltpWorker');
  // ts-node dev: load .ts; compiled: load .js
  if (process.env.TS_NODE_DEV || process.env.NODE_ENV !== 'production') {
    return base + '.ts';
  }
  return base + '.js';
}

// ─── DB batch flush ───────────────────────────────────────────────────────────

async function flushPending(): Promise<void> {
  if (pending.size === 0) return;

  const batch = Array.from(pending.values());
  pending.clear();

  let db: Awaited<ReturnType<typeof open>> | null = null;
  try {
    db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    await db.run('PRAGMA journal_mode = WAL');
    await db.run('BEGIN');

    for (const u of batch) {
      await db.run(
        `UPDATE options_contract SET ltp = ?, last_updated = CURRENT_TIMESTAMP
         WHERE index_name = ? AND strike_price = ? AND expiry_date = ? AND option_type = ?`,
        [u.ltp, u.indexName, u.strikePrice, u.expiryDate, u.optionType]
      );
    }

    await db.run('COMMIT');
    logger.debug(`DB flush: ${batch.length} LTP updates`);
  } catch (err) {
    try { await db?.run('ROLLBACK'); } catch {}
    logger.error('DB flush error:', err);
  } finally {
    await db?.close();
  }
}

// ─── Worker lifecycle ─────────────────────────────────────────────────────────

function spawnWorker(tier: Tier): Worker {
  const file = workerFile();

  const initialContracts: ContractSpec[] = Array.from(watchedContracts.values())
    .filter(c => c.tier === tier || (NUM_WORKERS === 1))
    .map(c => ({ key: makeKey(c), ...c }));

  const execArgv = file.endsWith('.ts') ? ['--require', 'ts-node/register'] : [];

  const w = new Worker(file, {
    workerData: { workerId: tier, contracts: initialContracts, interval: TIER_INTERVALS[tier] },
    execArgv,
  });

  // Send current spot prices immediately
  w.postMessage({ type: 'spotUpdate', spots: getAllSpots() });

  // Handle messages from worker
  w.on('message', (msg: {
    type: string;
    results?: Array<{ key: string; indexName: string; strikePrice: number; expiryDate: string; optionType: string; ltp: number }>;
  }) => {
    if (msg.type === 'ltpBatch' && msg.results) {
      for (const r of msg.results) pending.set(r.key, r);
    }
  });

  w.on('error', (err) => {
    logger.error(`Worker [${tier}] error:`, err);
    setTimeout(() => { workers[tier] = spawnWorker(tier); }, 2000);
  });

  w.on('exit', (code) => {
    if (code !== 0) {
      logger.warn(`Worker [${tier}] exited (code=${code}), restarting`);
      setTimeout(() => { workers[tier] = spawnWorker(tier); }, 2000);
    }
  });

  logger.info(`Worker [${tier}] spawned — ${initialContracts.length} contracts, ${TIER_INTERVALS[tier]}ms`);
  return w;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function startSimulation(): void {
  if (started) { logger.warn('Simulation already running'); return; }
  started = true;

  const tiers: Tier[] = NUM_WORKERS >= 3 ? ['hot', 'warm', 'cold']
    : NUM_WORKERS === 2 ? ['hot', 'warm']
    : ['hot'];

  for (const tier of tiers) workers[tier] = spawnWorker(tier);

  // Broadcast spot prices to all workers every 300ms
  spotBroadcast = setInterval(() => {
    const spots = getAllSpots();
    for (const w of Object.values(workers)) w?.postMessage({ type: 'spotUpdate', spots });
  }, 300);

  // Flush LTP updates to DB every 150ms
  dbFlushInterval = setInterval(flushPending, 150);

  logger.info(`Simulation started — ${tiers.length} worker(s) on ${cpus().length}-core machine`);
}

export function stopSimulation(): void {
  if (spotBroadcast)   { clearInterval(spotBroadcast);   spotBroadcast   = null; }
  if (dbFlushInterval) { clearInterval(dbFlushInterval); dbFlushInterval = null; }
  for (const [t, w] of Object.entries(workers) as [Tier, Worker][]) {
    w.terminate(); delete workers[t];
  }
  started = false;
  logger.info('Simulation stopped');
}

export async function addContractToWatch(
  indexName: string, strikePrice: number,
  expiryDate: string, optionType: 'CE' | 'PE'
): Promise<boolean> {
  const key = makeKey({ indexName, strikePrice, expiryDate, optionType });
  if (watchedContracts.has(key)) { logger.debug(`Already watching: ${key}`); return true; }

  try {
    const db  = await open({ filename: DB_PATH, driver: sqlite3.Database });
    const row = await db.get(
      `SELECT contract_id FROM options_contract
       WHERE index_name = ? AND strike_price = ? AND expiry_date = ? AND option_type = ?`,
      [indexName, strikePrice, expiryDate, optionType]
    );
    await db.close();

    if (!row) { logger.warn(`Not in DB: ${key}`); return false; }

    const spot = getSpotPrice(indexName);
    const tier = spot ? getTier(indexName, strikePrice, spot) : 'cold';

    watchedContracts.set(key, { indexName, strikePrice, expiryDate, optionType, tier });

    const spec: ContractSpec = { key, indexName, strikePrice, expiryDate, optionType };
    resolveWorker(tier)?.postMessage({ type: 'addContracts', contracts: [spec] });

    logger.info(`Watching [${tier}]: ${key}`);
    return true;
  } catch (err) {
    logger.error('addContractToWatch error:', err);
    return false;
  }
}

export function removeContractFromWatch(
  indexName: string, strikePrice: number,
  expiryDate: string, optionType: 'CE' | 'PE'
): void {
  const key = makeKey({ indexName, strikePrice, expiryDate, optionType });
  if (!watchedContracts.delete(key)) return;
  for (const w of Object.values(workers)) w?.postMessage({ type: 'removeContract', key });
  logger.info(`Unwatched: ${key}`);
}

export function getWatchedContracts(): string[] {
  return Array.from(watchedContracts.keys());
}

/** Backward compat */
export function calculateUpdateInterval(indexName: string, strikePrice: number, spotPrice: number): number {
  return TIER_INTERVALS[getTier(indexName, strikePrice, spotPrice)];
}

export async function initializeOptionsSimulator(): Promise<void> {
  logger.info('Initializing options simulator...');

  const spot = getSpotPrice('NIFTY');
  if (spot) {
    const atm = Math.round(spot / 50) * 50;
    let db: Awaited<ReturnType<typeof open>> | null = null;
    try {
      db = await open({ filename: DB_PATH, driver: sqlite3.Database });
      await db.run('PRAGMA journal_mode = WAL');
      const row = await db.get(
        `SELECT DISTINCT expiry_date FROM options_contract
         WHERE index_name = 'NIFTY' ORDER BY expiry_date ASC LIMIT 1`
      );
      if (row) {
        await addContractToWatch('NIFTY', atm, row.expiry_date, 'CE');
        await addContractToWatch('NIFTY', atm, row.expiry_date, 'PE');
        logger.info(`Default NIFTY ATM: ${atm} CE+PE (${row.expiry_date})`);
      }
    } finally {
      await db?.close();
    }
  }

  startSimulation();
  logger.info('Options simulator ready');
}

// ─── LTP read helpers (used by orderController) ───────────────────────────────

export async function getContractLTP(
  indexName: string,
  strikePrice: number,
  optionType: 'CE' | 'PE',
  expiryDate?: string
): Promise<number | null> {
  // Check pending updates first (freshest value, not yet flushed)
  for (const u of pending.values()) {
    const expiryMatches = expiryDate ? u.expiryDate === expiryDate : true;
    if (
      u.indexName === indexName &&
      u.strikePrice === strikePrice &&
      u.optionType === optionType &&
      expiryMatches
    ) {
      return u.ltp;
    }
  }
  // Fall back to DB
  try {
    const db  = await open({ filename: DB_PATH, driver: sqlite3.Database });
    const row = expiryDate
      ? await db.get(
          `SELECT ltp FROM options_contract
           WHERE index_name = ? AND strike_price = ? AND expiry_date = ? AND option_type = ?
           LIMIT 1`,
          [indexName, strikePrice, expiryDate, optionType]
        )
      : await db.get(
          `SELECT ltp FROM options_contract
           WHERE index_name = ? AND strike_price = ? AND option_type = ?
           ORDER BY expiry_date ASC LIMIT 1`,
          [indexName, strikePrice, optionType]
        );
    await db.close();
    return row?.ltp ?? null;
  } catch (err) {
    logger.error('getContractLTP error:', err);
    return null;
  }
}

export async function getMultipleContractLTPs(
  contracts: Array<{ indexName: string; strikePrice: number; expiryDate: string; optionType: 'CE' | 'PE' }>
): Promise<Array<{ indexName: string; strikePrice: number; expiryDate: string; optionType: 'CE' | 'PE'; ltp: number | null }>> {
  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  const results = [];
  for (const c of contracts) {
    const row = await db.get(
      `SELECT ltp FROM options_contract
       WHERE index_name = ? AND strike_price = ? AND expiry_date = ? AND option_type = ?`,
      [c.indexName, c.strikePrice, c.expiryDate, c.optionType]
    );
    results.push({ ...c, ltp: row?.ltp ?? null });
  }
  await db.close();
  return results;
}