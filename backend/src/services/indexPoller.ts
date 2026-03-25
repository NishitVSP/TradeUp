import { fetchSpotPrices } from '../scripts/fetchSpotPrices';
import { logger } from '../utils/logger';

// Global structure for index prices
export const indexPrices: Record<string, number | null> = {
  'NIFTY': null,
  'BANKNIFTY': null,
  'FINNIFTY': null,
  'MIDCPNIFTY': null,
  'BANKEX': null,
  'SENSEX': null
};

// Store simulated base prices
let simulatedPrices: Record<string, number | null> = { ...indexPrices };
let previousPrice: number | null = null;

// Market sessions configuration (IST)
const MARKET_SESSIONS = [
  { name: 'INDIA', start: 9, end: 15, endMinute: 30, url: 'https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI' },
  { name: 'LONDON', start: 15, end: 21, endMinute: 0, url: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EFTSE' },
  { name: 'NEWYORK', start: 21, end: 1, endMinute: 30, url: 'https://query1.finance.yahoo.com/v8/finance/chart/%5ENYA' },
  { name: 'BITCOIN', start: 1, end: 4, endMinute: 30, url: 'https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD' },
  { name: 'NEWZEALAND', start: 4, end: 7, endMinute: 0, url: 'https://query1.finance.yahoo.com/v8/finance/chart/%5ENZ50' },
  { name: 'SHANGHAI', start: 7, end: 9, endMinute: 15, url: 'https://query1.finance.yahoo.com/v8/finance/chart/000001.SS' }
];

// Helper to check if current time is within market session
function getCurrentMarketSession(): typeof MARKET_SESSIONS[0] | null {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;

  for (const session of MARKET_SESSIONS) {
    let startTime = session.start * 60;
    let endTime = session.end * 60 + (session.endMinute || 0);

    // Handle overnight sessions (e.g., NEWYORK 21:00 to 01:30)
    if (session.name === 'NEWYORK') {
      if (currentTime >= startTime || currentTime < endTime) {
        return session;
      }
    } else {
      if (currentTime >= startTime && currentTime < endTime) {
        return session;
      }
    }
  }
  return null;
}

// Fetch live data from Yahoo Finance
async function fetchLiveData(url: string): Promise<number | null> {
  try {
    const response = await fetch(url);
    const data = await response.json() as any;
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    return price || null;
  } catch (error) {
    logger.error('Error fetching live data:', error);
    return null;
  }
}

// Poll market session and get percentage change
async function pollMarketChange(): Promise<number | null> {
  const session = getCurrentMarketSession();
  if (!session) return null;
  // console.log(`\n🔍 Active Market: ${session.name} (${new Date().toLocaleTimeString()})`);
  const currentPrice = await fetchLiveData(session.url);
  let percentChange: number | null = null;

  if (previousPrice !== null && currentPrice !== null) {
    percentChange = ((currentPrice - previousPrice) / previousPrice) * 100;
    // Cap at 15% to avoid extreme changes
    if (Math.abs(percentChange) > 15) {
      logger.warn(`Skipping invalid change: ${percentChange}%`);
      return null;
    }
  }

  if (currentPrice !== null) {
    previousPrice = currentPrice;
  }

  return percentChange;
}

// Apply percentage change to all Indian indices with random variation
function applyPriceChange(percentChange: number) {
  for (const index of Object.keys(indexPrices)) {
    const prev = simulatedPrices[index];
    if (prev !== null && prev !== undefined) {
      // Add random variation between -0.025% to +0.025%
      const randomSign = Math.random() > 0.5 ? 1 : -1;
      const randomVariation = (Math.random() * 0.05 - 0.025) * randomSign;
      const finalChange = percentChange + randomVariation;
      const newPrice = prev * (1 + finalChange / 100);
      simulatedPrices[index] = Number(newPrice.toFixed(2));
    }
  }
}

// Update global indexPrices with simulated prices
function updateIndexPrices() {
  for (const index of Object.keys(indexPrices)) {
    if (simulatedPrices[index] !== null) {
      indexPrices[index] = simulatedPrices[index];
    }
  }
}

// Initialize with real Indian index prices
async function initializePrices() {
  const spots = await fetchSpotPrices();
  for (const spot of spots) {
    indexPrices[spot.symbol] = spot.spotPrice;
    simulatedPrices[spot.symbol] = spot.spotPrice;
    logger.info(`Initial ${spot.symbol}: ${spot.spotPrice}`);
  }
}

// Start simulation
let baseUpdateInterval: NodeJS.Timeout;
let priceUpdateInterval: NodeJS.Timeout;

export async function startSimulation() {
  logger.info('Starting index price simulation...');

  // 1. Initialize with real prices
  await initializePrices();

  // 2. Start base price update (every 10 seconds during market hours)
  baseUpdateInterval = setInterval(async () => {
    const percentChange = await pollMarketChange();
    
    if (percentChange !== null) {
        const oldNifty = simulatedPrices['NIFTY'];
        const newNifty = oldNifty !== null ? oldNifty * (1 + percentChange / 100) : null;
    
       // console.log(`\n📈 MARKET CHANGE: ${percentChange.toFixed(4)}%`);
       // console.log(`   NIFTY: ${oldNifty?.toFixed(2)} → ${newNifty?.toFixed(2)}`);
        logger.debug(`Market change: ${percentChange.toFixed(4)}%`);
        applyPriceChange(percentChange);
    } else {
      // If no market session, apply small random drift (0.05% max)
      const drift = (Math.random() - 0.5) * 0.1;
      if (Math.abs(drift) > 0.01) {
       // console.log(`🌊 DRIFT: ${drift.toFixed(4)}% (no active market session)`);
      }
      applyPriceChange(drift);
    }
  }, 10000);

  // 3. Start high-frequency updates (every 300ms) for smooth price movement
  priceUpdateInterval = setInterval(() => {
    for (const index of Object.keys(indexPrices)) {
      const base = simulatedPrices[index];
      if (base !== null && base !== undefined) {
        // Box-Muller transform for normal distribution
        const u = 1 - Math.random();
        const v = Math.random();
        const stddev = 0.0025; // 0.25% standard deviation
        const percentChange = stddev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        
        const newPrice = base * (1 + (percentChange / 100));
        indexPrices[index] = Number(newPrice.toFixed(2));
      }
    }
  }, 300);

  logger.info('Simulation running');
}

export function stopSimulation() {
  if (baseUpdateInterval) clearInterval(baseUpdateInterval);
  if (priceUpdateInterval) clearInterval(priceUpdateInterval);
  logger.info('Simulation stopped');
}

// Get current spot price for an index
export function getSpotPrice(indexName: string): number | null {
  return indexPrices[indexName] ?? null;
}

// Get all spot prices
export function getAllSpots(): Record<string, number | null> {
  return { ...indexPrices };
}