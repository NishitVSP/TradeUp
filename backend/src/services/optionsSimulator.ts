import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { blackScholes, getDaysToExpiry, daysToYears } from '../utils/blackScholes';
import { getSpotPrice, getAllSpots } from './indexPoller';
import { logger } from '../utils/logger';

interface OptionContract {
  id: number;
  index_name: string;
  strike_price: number;
  expiry_date: string;
  option_type: 'CE' | 'PE';
  ltp: number;
  last_updated: string;
}

// Track which contracts are being simulated
const watchedContracts = new Set<string>();
let simulationInterval: NodeJS.Timeout | null = null;

/**
 * Initialize options simulator with NIFTY ATM contracts by default
 */
export async function initializeOptionsSimulator() {
  logger.info('Initializing options simulator...');
  
  // Start with NIFTY ATM contracts
  const spots = getAllSpots();
  const niftySpot = spots['NIFTY'];
  
  if (niftySpot) {
    const atmStrike = Math.round(niftySpot / 50) * 50; // NIFTY step size is 50
    await addContractToWatch('NIFTY', atmStrike, 'CE');
    await addContractToWatch('NIFTY', atmStrike, 'PE');
    logger.info(`Added NIFTY ATM contracts to watch: ${atmStrike} CE and PE`);
  }
  
  startSimulation();
}

/**
 * Add a contract to the watch list for simulation
 */
export async function addContractToWatch(
  indexName: string, 
  strikePrice: number, 
  optionType: 'CE' | 'PE'
): Promise<boolean> {
  const contractKey = `${indexName}-${strikePrice}-${optionType}`;
  
  if (watchedContracts.has(contractKey)) {
    logger.debug(`Contract ${contractKey} already being watched`);
    return true;
  }

  // Check if contract exists in database
  const db = await open({
    filename: './data/tradeup.db',
    driver: sqlite3.Database
  });

  const contract = await db.get(
    `SELECT id FROM options_contract 
     WHERE index_name = ? AND strike_price = ? AND option_type = ? 
     ORDER BY expiry_date ASC LIMIT 1`,
    [indexName, strikePrice, optionType]
  );

  await db.close();

  if (contract) {
    watchedContracts.add(contractKey);
    logger.info(`Added contract to watch: ${contractKey}`);
    return true;
  } else {
    logger.warn(`Contract not found in database: ${contractKey}`);
    return false;
  }
}

/**
 * Remove a contract from the watch list
 */
export function removeContractFromWatch(
  indexName: string, 
  strikePrice: number, 
  optionType: 'CE' | 'PE'
): void {
  const contractKey = `${indexName}-${strikePrice}-${optionType}`;
  watchedContracts.delete(contractKey);
  logger.info(`Removed contract from watch: ${contractKey}`);
}

/**
 * Get all currently watched contracts
 */
export function getWatchedContracts(): string[] {
  return Array.from(watchedContracts);
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
  
  const ltp = blackScholes(spotPrice, strikePrice, timeToExpiry, optionType.toLowerCase() as 'ce' | 'pe');
  
  // Round to 2 decimal places
  return Math.round(ltp * 100) / 100;
}

/**
 * Update LTPs for all watched contracts in database
 */
async function updateWatchedContractsLTP(): Promise<void> {
  if (watchedContracts.size === 0) {
    return;
  }

  const db = await open({
    filename: './data/tradeup.db',
    driver: sqlite3.Database
  });

  try {
    for (const contractKey of watchedContracts) {
      const [indexName, strikePriceStr, optionType] = contractKey.split('-');
      const strikePrice = parseFloat(strikePriceStr);
      
      // Get current spot price
      const spotPrice = getSpotPrice(indexName);
      if (!spotPrice) {
        logger.warn(`No spot price available for ${indexName}`);
        continue;
      }

      // Get the nearest expiry contract for this strike
      const contract = await db.get(
        `SELECT id, expiry_date FROM options_contract 
         WHERE index_name = ? AND strike_price = ? AND option_type = ? 
         ORDER BY expiry_date ASC LIMIT 1`,
        [indexName, strikePrice, optionType]
      );

      if (!contract) {
        logger.warn(`Contract not found: ${contractKey}`);
        continue;
      }

      // Calculate new LTP
      const newLTP = calculateContractLTP(spotPrice, strikePrice, contract.expiry_date, optionType as 'CE' | 'PE');

      // Update database
      await db.run(
        `UPDATE options_contract 
         SET ltp = ?, last_updated = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [newLTP, contract.id]
      );

      logger.debug(`Updated ${contractKey}: LTP = ${newLTP} (Spot: ${spotPrice})`);
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

  logger.info('Starting options price simulation (500ms interval)');
  
  simulationInterval = setInterval(async () => {
    await updateWatchedContractsLTP();
  }, 500); // 500ms frequency as requested
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
  const db = await open({
    filename: './data/tradeup.db',
    driver: sqlite3.Database
  });

  const result = await db.get(
    `SELECT ltp FROM options_contract 
     WHERE index_name = ? AND strike_price = ? AND option_type = ? 
     ORDER BY expiry_date ASC LIMIT 1`,
    [indexName, strikePrice, optionType]
  );

  await db.close();
  
  return result ? result.ltp : null;
}

/**
 * Get multiple contract LTPs (for frontend display)
 */
export async function getMultipleContractLTPs(
  contracts: Array<{ indexName: string; strikePrice: number; optionType: 'CE' | 'PE' }>
): Promise<Array<{ indexName: string; strikePrice: number; optionType: 'CE' | 'PE'; ltp: number | null }>> {
  const results = [];
  
  for (const contract of contracts) {
    const ltp = await getContractLTP(contract.indexName, contract.strikePrice, contract.optionType);
    results.push({ ...contract, ltp });
  }
  
  return results;
}
