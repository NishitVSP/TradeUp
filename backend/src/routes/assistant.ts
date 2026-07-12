import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { chat, confirmOrder } from '../controllers/assistantController';

const router = Router();

router.use(authenticateToken);

router.post('/chat',           chat);         // POST /api/assistant/chat
router.post('/confirm-order',  confirmOrder); // POST /api/assistant/confirm-order

export default router;