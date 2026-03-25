import { startSimulation, stopSimulation as stopIndexSimulation } from './services/indexPoller';
import { populateOptionsContracts } from './scripts/populateOptionsContracts';
import { initializeOptionsSimulator, stopSimulation as stopOptionsSimulation } from './services/optionsSimulator';
import { startServer } from './server';

async function main() {
  console.log('Populating options contracts...');
  //await populateOptionsContracts();
  console.log('Options contracts populated\n');
  
  console.log('Starting TradeUp Backend...');
  await startSimulation();
  
  console.log('Initializing Options Simulator...');
  await initializeOptionsSimulator();
  
  console.log('Starting Express Server...');
  startServer();
  
  console.log('All services running. Press Ctrl+C to stop.');
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    stopOptionsSimulation();
    stopIndexSimulation();
    process.exit(0);
  });
}

main().catch(console.error);