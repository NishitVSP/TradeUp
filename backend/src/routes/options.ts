import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getExpiries,
  getStrikes,
  getSpotPrice,
  watchContract,
  watchMultipleContracts,
  unwatchContract,
  getContractLTP,
  getMultipleContractLTPs,
  getCurrentMarketSession,
} from '../controllers/optionsController';

const router = Router();

router.get('/market-session',       getCurrentMarketSession); // GET /api/options/market-session

// All routes require a valid JWT
router.use(authenticateToken);
// Market data (no auth required for public market information)
router.get('/expiries/:indexName',  getExpiries);           // GET /api/options/expiries/NIFTY
router.get('/strikes/:indexName',   getStrikes);            // GET /api/options/strikes/NIFTY
router.get('/spot/:indexName',      getSpotPrice);          // GET /api/options/spot/NIFTY

// ── Contract simulation (LTP generation) ─────────────────────────────────────
router.post('/watch',               watchContract);         // POST /api/options/watch
router.post('/watch/multiple',      watchMultipleContracts);// POST /api/options/watch/multiple
router.post('/unwatch',             unwatchContract);       // POST /api/options/unwatch

// ── LTP retrieval ─────────────────────────────────────────────────────────────
router.get('/ltp',                  getContractLTP);        // GET  /api/options/ltp?indexName=&strikePrice=&optionType=
router.post('/ltp/multiple',        getMultipleContractLTPs);// POST /api/options/ltp/multiple

export default router;