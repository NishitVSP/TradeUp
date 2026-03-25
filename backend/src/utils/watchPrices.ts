// backend/src/watchPrices.ts
import { startSimulation, indexPrices } from '../services/indexPoller';

async function watch() {
  await startSimulation();
  
  setInterval(() => {
    const nifty = indexPrices['NIFTY'];
    const banknifty = indexPrices['BANKNIFTY'];
    console.log(`[${new Date().toLocaleTimeString()}] NIFTY: ${nifty} | BANKNIFTY: ${banknifty}`);
  }, 1000);
}

watch().catch(console.error);