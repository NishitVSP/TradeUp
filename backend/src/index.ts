import { startSimulation } from './services/indexPoller';
import { populateOptionsContracts } from './scripts/populateOptionsContracts';

async function main() {
  console.log('Populating options contracts...');
  await populateOptionsContracts();
  console.log('Options contracts populated\n');
  
  console.log('Starting TradeUp Backend...');
  await startSimulation();
  console.log('Simulation running. Press Ctrl+C to stop.');
}

main().catch(console.error);