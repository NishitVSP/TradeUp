import { Router } from 'express';
import {
  getExpiries,
  getStrikes,
  getSpotPrice,
  watchContract,
  unwatchContract,
  getContractLTP,
  getMultipleContractLTPs,
} from '../controllers/optionsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/options/expiries/:indexName
 * @desc    Get available expiry dates for an index
 * @access  Private
 */
router.get('/expiries/:indexName', authenticateToken, getExpiries);

/**
 * @route   GET /api/options/strikes/:indexName
 * @desc    Get available strike prices for an index
 * @access  Private
 */
router.get('/strikes/:indexName', authenticateToken, getStrikes);

/**
 * @route   GET /api/options/spot/:indexName
 * @desc    Get current spot price for an index
 * @access  Private
 */
router.get('/spot/:indexName', authenticateToken, getSpotPrice);

/**
 * @route   POST /api/options/watch
 * @desc    Start watching an option contract
 * @access  Private
 */
router.post('/watch', authenticateToken, watchContract);

/**
 * @route   POST /api/options/unwatch
 * @desc    Stop watching an option contract
 * @access  Private
 */
router.post('/unwatch', authenticateToken, unwatchContract);

/**
 * @route   GET /api/options/ltp
 * @desc    Get LTP for a single contract
 * @access  Private
 */
router.get('/ltp', authenticateToken, getContractLTP);

/**
 * @route   POST /api/options/ltp/multiple
 * @desc    Get LTPs for multiple contracts
 * @access  Private
 */
router.post('/ltp/multiple', authenticateToken, getMultipleContractLTPs);

export default router;