import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  placeOrder,
  getOrders,
  getPositions,
  cancelOrder,
  closePositionApi,
  getContractLTPs,
} from '../controllers/orderController';

const router = Router();

// All routes require a valid JWT
router.use(authenticateToken);

// ── Orders ────────────────────────────────────────────────────────────────────
router.post('/',                  placeOrder);       // POST  /api/orders
router.get('/',                   getOrders);        // GET   /api/orders
router.patch('/:orderId/cancel',  cancelOrder);      // PATCH /api/orders/:orderId/cancel

// ── Positions ─────────────────────────────────────────────────────────────────
router.get('/positions',          getPositions);     // GET   /api/orders/positions
router.post('/close-position',    closePositionApi); // POST  /api/orders/close-position

// ── Batch LTP fetch (frontend useLtpPoller hook) ──────────────────────────────
router.post('/ltps',              getContractLTPs);  // POST  /api/orders/ltps

export default router;