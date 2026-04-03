import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { blackScholes, getDaysToExpiry, daysToYears } from '../utils/blackScholes';
import { getSpotPrice, getAllSpots } from './indexPoller';
import { logger } from '../utils/logger';

interface OptionContract {
  contract_id: number;
  index_name: string;
  strike_price: number;
  expiry_date: string;
  option_type: 'CE' | 'PE';
  ltp: number;
  last_updated: string;
}

interface WatchedContract {
  indexName: string;
  strikePrice: number;
  expiryDate: string;
  optionType: 'CE' | 'PE';
  interval: number; // 500, 1000, or 2000ms
  lastUpdate: number;
}

const STRIKE_CONFIG: Record<string, { stepSize: number; range: number }> = {
  NIFTY: { stepSize: 50, range: 40 },
  BANKNIFTY: { stepSize: 100, range: 40 },
  FINNIFTY: { stepSize: 50, range: 40 },
  MIDCPNIFTY: { stepSize: 25, range: 40 },
  BANKEX: { stepSize: 100, range: 40 },
  SENSEX: { stepSize: 100, range: 40 },
};

// Track watched contracts with their update intervals
export const watchedContracts = new Map<string, WatchedContract>();
let simulationInterval: NodeJS.Timeout | null = null;

/**
 * Calculate update interval based on distance from ATM
 */
export function calculateUpdateInterval(
  indexName: string,
  strikePrice: number,
  spotPrice: number
): number {
  const config = STRIKE_CONFIG[indexName];
  if (!config) return 2000;

  const atmStrike = Math.round(spotPrice / config.stepSize) * config.stepSize;
  const strikeDistance = Math.abs(strikePrice - atmStrike) / config.stepSize;

  // [-5, +5] strikes from ATM: 500ms
  if (strikeDistance <= 5) {
    return 500;
  }
  // [-10, +10] strikes from ATM (excluding the first 5): 1000ms
  else if (strikeDistance <= 10) {
    return 1000;
  }
  // All other contracts: 2000ms
  else {
    return 2000;
  }
}

/**
 * Initialize options simulator with NIFTY ATM contracts by default
 */
export async function initializeOptionsSimulator() {
  logger.info('Initializing options simulator...');

  // Start with NIFTY ATM contracts
  const spots = getAllSpots();
  const niftySpot = spots['NIFTY'];

  if (niftySpot) {
    const atmStrike = Math.round(niftySpot / 50) * 50;
    
    // Get the nearest expiry
    const db = await open({
      filename: './data/tradeup.db',
      driver: sqlite3.Database,
    });

    const expiryResult = await db.get(
      `SELECT DISTINCT expiry_date FROM options_contract 
       WHERE index_name = ? 
       ORDER BY expiry_date ASC LIMIT 1`,
      ['NIFTY']
    );

    await db.close();

    if (expiryResult) {
      await addContractToWatch('NIFTY', atmStrike, expiryResult.expiry_date, 'CE');
      await addContractToWatch('NIFTY', atmStrike, expiryResult.expiry_date, 'PE');
      logger.info(`Added NIFTY ATM contracts to watch: ${atmStrike} CE and PE`);
    }
  }

  startSimulation();
}

/**
 * Add a contract to the watch list for simulation
 */
export async function addContractToWatch(
  indexName: string,
  strikePrice: number,
  expiryDate: string,
  optionType: 'CE' | 'PE'
): Promise<boolean> {
  const contractKey = `${indexName}-${strikePrice}-${expiryDate}-${optionType}`;

  if (watchedContracts.has(contractKey)) {
    logger.debug(`Contract ${contractKey} already being watched`);
    return true;
  }

  try {
    // Check if contract exists in database
    const db = await open({
      filename: './data/tradeup.db',
      driver: sqlite3.Database,
    });

    const contract = await db.get(
      `SELECT contract_id FROM options_contract 
       WHERE index_name = ? AND strike_price = ? AND expiry_date = ? AND option_type = ?`,
      [indexName, strikePrice, expiryDate, optionType]
    );

    await db.close();

    if (contract) {
      const spotPrice = getSpotPrice(indexName);
      const interval = spotPrice
        ? calculateUpdateInterval(indexName, strikePrice, spotPrice)
        : 2000;

      watchedContracts.set(contractKey, {
        indexName,
        strikePrice,
        expiryDate,
        optionType,
        interval,
        lastUpdate: 0,
      });

      logger.info(`Added contract to watch: ${contractKey} (interval: ${interval}ms)`);
      return true;
    } else {
      logger.warn(`Contract not found in database: ${contractKey}`);
      return false;
    }
  } catch (error) {
    logger.error('Error adding contract to watch:', error);
    return false;
  }
}

/**
 * Remove a contract from the watch list
 */
export function removeContractFromWatch(
  indexName: string,
  strikePrice: number,
  expiryDate: string,
  optionType: 'CE' | 'PE'
): void {
  const contractKey = `${indexName}-${strikePrice}-${expiryDate}-${optionType}`;
  watchedContracts.delete(contractKey);
  logger.info(`Removed contract from watch: ${contractKey}`);
}

/**
 * Get all currently watched contracts
 */
export function getWatchedContracts(): string[] {
  return Array.from(watchedContracts.keys());
}

/**
 * Update intervals for all contracts when spot price changes significantly
 */
function updateWatchedContractIntervals(): void {
  const spots = getAllSpots();

  watchedContracts.forEach((contract, key) => {
    const spotPrice = spots[contract.indexName];
    if (spotPrice) {
      const newInterval = calculateUpdateInterval(
        contract.indexName,
        contract.strikePrice,
        spotPrice
      );

      if (newInterval !== contract.interval) {
        contract.interval = newInterval;
        logger.debug(`Updated interval for ${key}: ${newInterval}ms`);
      }
    }
  });
}

/**
 * Calculate LTP for a single contract using Black-Scholes
 */
function calculateContractLTP(
  spotPrice: number,
  strikePrice: number,
  expiryDate: string,
  optionType: 'CE' | 'PE'
): number {
  const daysToExpiry = getDaysToExpiry(expiryDate);
  const timeToExpiry = daysToYears(daysToExpiry);

  const ltp = blackScholes(
    spotPrice,
    strikePrice,
    timeToExpiry,
    optionType.toLowerCase() as 'ce' | 'pe'
  );

  // Round to 2 decimal places
  return Math.round(ltp * 100) / 100;
}

/**
 * Update LTPs for watched contracts based on their intervals
 */
async function updateWatchedContractsLTP(): Promise<void> {
  if (watchedContracts.size === 0) {
    return;
  }

  const now = Date.now();
  const db = await open({
    filename: './data/tradeup.db',
    driver: sqlite3.Database,
  });

  try {
    for (const [key, contract] of watchedContracts.entries()) {
      // Check if enough time has passed since last update
      if (now - contract.lastUpdate < contract.interval) {
        continue;
      }

      // Get current spot price
      const spotPrice = getSpotPrice(contract.indexName);
      if (!spotPrice) {
        logger.warn(`No spot price available for ${contract.indexName}`);
        continue;
      }

      // Calculate new LTP
      const newLTP = calculateContractLTP(
        spotPrice,
        contract.strikePrice,
        contract.expiryDate,
        contract.optionType
      );

      // Update database
      await db.run(
        `UPDATE options_contract 
         SET ltp = ?, last_updated = CURRENT_TIMESTAMP 
         WHERE index_name = ? AND strike_price = ? AND expiry_date = ? AND option_type = ?`,
        [newLTP, contract.indexName, contract.strikePrice, contract.expiryDate, contract.optionType]
      );

      // Update last update time
      contract.lastUpdate = now;

      logger.debug(
        `Updated ${key}: LTP = ${newLTP} (Spot: ${spotPrice}, Interval: ${contract.interval}ms)`
      );
    }
  } catch (error) {
    logger.error('Error updating contract LTPs:', error);
  } finally {
    await db.close();
  }
}

/**
 * Start the options simulation
 */
export function startSimulation(): void {
  if (simulationInterval) {
    logger.warn('Options simulation already running');
    return;
  }

  logger.info('Starting tiered options price simulation');

  // Run at 100ms frequency to check which contracts need updates
  simulationInterval = setInterval(async () => {
    await updateWatchedContractsLTP();
    
    // Update intervals every 10 seconds based on spot price changes
    if (Date.now() % 10000 < 100) {
      updateWatchedContractIntervals();
    }
  }, 100);
}

/**
 * Stop the options simulation
 */
export function stopSimulation(): void {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    logger.info('Options simulation stopped');
  } else {
    logger.warn('Options simulation not running');
  }
}

/**
 * Get current LTP for a specific contract
 */
export async function getContractLTP(
  indexName: string,
  strikePrice: number,
  optionType: 'CE' | 'PE'
): Promise<number | null> {
  try {
    const db = await open({
      filename: './data/tradeup.db',
      driver: sqlite3.Database,
    });

    const result = await db.get(
      `SELECT ltp FROM options_contract 
       WHERE index_name = ? AND strike_price = ? AND option_type = ? 
       ORDER BY expiry_date ASC LIMIT 1`,
      [indexName, strikePrice, optionType]
    );

    await db.close();

    return result ? result.ltp : null;
  } catch (error) {
    logger.error('Error getting contract LTP:', error);
    return null;
  }
}

/**
 * Get multiple contract LTPs (for frontend display)
 */
export async function getMultipleContractLTPs(
  contracts: Array<{
    indexName: string;
    strikePrice: number;
    expiryDate: string;
    optionType: 'CE' | 'PE';
  }>
): Promise<
  Array<{
    indexName: string;
    strikePrice: number;
    expiryDate: string;
    optionType: 'CE' | 'PE';
    ltp: number | null;
  }>
> {
  const db = await open({
    filename: './data/tradeup.db',
    driver: sqlite3.Database,
  });

  const results = [];

  for (const contract of contracts) {
    const result = await db.get(
      `SELECT ltp FROM options_contract 
       WHERE index_name = ? AND strike_price = ? AND expiry_date = ? AND option_type = ?`,
      [contract.indexName, contract.strikePrice, contract.expiryDate, contract.optionType]
    );

    results.push({
      ...contract,
      ltp: result ? result.ltp : null,
    });
  }

  await db.close();

  return results;
}