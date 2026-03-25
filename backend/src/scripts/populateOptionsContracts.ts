import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { fetchSpotPrices } from './fetchSpotPrices';
import { fetchExpiryDates } from './fetchExpiryDates';

interface StrikeConfig {
  stepSize: number;
  range: number; // 40 strikes up and down
}

const STRIKE_CONFIG: Record<string, StrikeConfig> = {
  'NIFTY': { stepSize: 50, range: 40 },
  'BANKNIFTY': { stepSize: 100, range: 40 },
  'FINNIFTY': { stepSize: 50, range: 40 },
  'MIDCPNIFTY': { stepSize: 25, range: 40 },
  'BANKEX': { stepSize: 100, range: 40 },
  'SENSEX': { stepSize: 100, range: 40 }
};

export async function populateOptionsContracts() {
  // Get spot prices and expiry dates
  console.log('Fetching spot prices...');
  const spots = await fetchSpotPrices();
  const expiriesData = fetchExpiryDates();
  
  // Create a map for quick lookup
  const spotMap = new Map(spots.map(s => [s.symbol, s.spotPrice]));
  const expiryMap = new Map(expiriesData.map(e => [e.index, e.expiries]));
  
  // Open database connection
  const db = await open({
    filename: './data/tradeup.db',
    driver: sqlite3.Database
  });

  console.log('Clearing existing contracts...');
  await db.run('DELETE FROM options_contract');
  console.log('Database cleared\n');

  console.log('Generating option contracts...\n');
  let totalContracts = 0;

  // For each index
  for (const [index, config] of Object.entries(STRIKE_CONFIG)) {
    const spotPrice = spotMap.get(index);
    if (!spotPrice) {
      console.error(`No spot price for ${index}`);
      continue;
    }

    const expiries = expiryMap.get(index);
    if (!expiries) {
      console.error(`No expiries for ${index}`);
      continue;
    }

    console.log(`${index} (Spot: ${spotPrice})`);

    // Calculate strike range (40 up, 40 down = 81 strikes total)
    const baseStrike = Math.round(spotPrice / config.stepSize) * config.stepSize;
    const minStrike = baseStrike - (40 * config.stepSize);
    const maxStrike = baseStrike + (40 * config.stepSize);

    // For each expiry
    for (const expiry of expiries) {
      let expiryCount = 0;
      
      // For each strike in range (81 strikes: 40 down + ATM + 40 up)
      for (let i = 0; i <= 80; i++) {  // 0 to 80 = 81 strikes
        const strike = minStrike + (i * config.stepSize);
        
        // Insert CE
        try {
          await db.run(
            `INSERT INTO options_contract 
             (index_name, strike_price, expiry_date, option_type, ltp, last_updated)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [index, strike, expiry, 'CE', 0]
          );
          expiryCount++;
        } catch (err: any) {
          if (!err.message.includes('UNIQUE')) {
            console.error(`Error inserting CE: ${index} ${strike} ${expiry}`, err);
          }
        }

        // Insert PE
        try {
          await db.run(
            `INSERT INTO options_contract 
             (index_name, strike_price, expiry_date, option_type, ltp, last_updated)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [index, strike, expiry, 'PE', 0]
          );
          expiryCount++;
        } catch (err: any) {
          if (!err.message.includes('UNIQUE')) {
            console.error(`Error inserting PE: ${index} ${strike} ${expiry}`, err);
          }
        }
      }
      
      console.log(`  ${expiry}: ${expiryCount} contracts (81 strikes × CE+PE)`);
      totalContracts += expiryCount;
    }
    console.log(''); // Empty line between indices
  }

  console.log(`\nTotal contracts generated: ${totalContracts}`);
  
  // Verify count
  const count = await db.get('SELECT COUNT(*) as count FROM options_contract');
  console.log(`Database total: ${count.count} contracts`);
  
  await db.close();
}

// Run
populateOptionsContracts().catch(console.error);