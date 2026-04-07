/**
 * ltpWorker.ts
 *
 * Runs in a Worker thread.
 * Receives spot prices + contract list from main thread.
 * Computes Black-Scholes LTPs in-thread (pure CPU, no I/O).
 * Sends back batch of { key, ltp } to main thread for DB write.
 */
import { parentPort, workerData } from 'worker_threads';

// ─── Inline Black-Scholes (avoid import issues across worker boundary) ────────

const RISK_FREE_RATE = 0.07;
const VOLATILITY     = 0.20;

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function cdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function blackScholes(S: number, K: number, T: number, type: 'ce' | 'pe'): number {
  if (T <= 0 || S <= 0 || K <= 0) {
    return type === 'ce' ? Math.max(0, S - K) : Math.max(0, K - S);
  }
  const d1 = (Math.log(S / K) + (RISK_FREE_RATE + 0.5 * VOLATILITY * VOLATILITY) * T)
             / (VOLATILITY * Math.sqrt(T));
  const d2 = d1 - VOLATILITY * Math.sqrt(T);
  if (type === 'ce') {
    return Math.max(0, S * cdf(d1) - K * Math.exp(-RISK_FREE_RATE * T) * cdf(d2));
  } else {
    return Math.max(0, K * Math.exp(-RISK_FREE_RATE * T) * cdf(-d2) - S * cdf(-d1));
  }
}

function getDaysToExpiry(expiryDate: string): number {
  const [day, month, year] = expiryDate.split('-').map(Number);
  const expiry = new Date(year, month - 1, day);
  const diffMs = expiry.getTime() - Date.now();
  const days   = diffMs / (1000 * 60 * 60 * 24);
  return days <= 0 ? 0.000000011574074074 : days;
}

// ─── Worker state ─────────────────────────────────────────────────────────────

interface ContractSpec {
  key:        string;       // "NIFTY-24000-30-03-2026-CE"
  indexName:  string;
  strikePrice: number;
  expiryDate: string;
  optionType: 'CE' | 'PE';
}

interface WorkerData {
  workerId:  number;
  contracts: ContractSpec[];
  interval:  number;        // 500 | 1000 | 2000 ms — this worker's tier
}

const { workerId, contracts, interval } = workerData as WorkerData;

// Spot prices — updated from main thread
let spotPrices: Record<string, number | null> = {};

// ─── Message handler: receive spot price updates from main thread ─────────────
if (parentPort) {
  parentPort.on('message', (msg: {
    type: 'spotUpdate'  | 'addContracts' | 'removeContract';
    spots?: Record<string, number | null>;
    contracts?: ContractSpec[];
    key?: string;
  }) => {
    if (msg.type === 'spotUpdate' && msg.spots) {
      spotPrices = { ...spotPrices, ...msg.spots };
    }
    if (msg.type === 'addContracts' && msg.contracts) {
      // Dynamically add new contracts to this worker's list
      for (const c of msg.contracts) {
        if (!contracts.find(x => x.key === c.key)) {
          contracts.push(c);
        }
      }
    }
    if (msg.type === 'removeContract' && msg.key) {
      const idx = contracts.findIndex(x => x.key === msg.key);
      if (idx !== -1) contracts.splice(idx, 1);
    }
  });

  // ─── Main compute loop ──────────────────────────────────────────────────────
  setInterval(() => {
    if (contracts.length === 0) return;

    const results: Array<{
      key:        string;
      indexName:  string;
      strikePrice: number;
      expiryDate: string;
      optionType: string;
      ltp:        number;
    }> = [];

    for (const c of contracts) {
      const spot = spotPrices[c.indexName];
      if (!spot || spot <= 0) continue;

      const T   = getDaysToExpiry(c.expiryDate) / 365.25;
      const ltp = Math.round(blackScholes(spot, c.strikePrice, T, c.optionType.toLowerCase() as 'ce' | 'pe') * 100) / 100;

      results.push({
        key:         c.key,
        indexName:   c.indexName,
        strikePrice: c.strikePrice,
        expiryDate:  c.expiryDate,
        optionType:  c.optionType,
        ltp,
      });
    }

    if (results.length > 0) {
      parentPort!.postMessage({ type: 'ltpBatch', workerId, results });
    }
  }, interval);
}