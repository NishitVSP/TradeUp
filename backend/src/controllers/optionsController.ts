import { Request, Response } from 'express';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { fetchExpiryDates } from '../scripts/fetchExpiryDates';
import { getSpotPrice as getIndexSpotPrice } from '../services/indexPoller';
import { OptionsApiService } from '../services/optionsApi';
import { logger } from '../utils/logger';

const STRIKE_CONFIG: Record<string, { stepSize: number; range: number }> = {
  NIFTY: { stepSize: 50, range: 40 },
  BANKNIFTY: { stepSize: 100, range: 40 },
  FINNIFTY: { stepSize: 50, range: 40 },
  MIDCPNIFTY: { stepSize: 25, range: 40 },
  BANKEX: { stepSize: 100, range: 40 },
  SENSEX: { stepSize: 100, range: 40 },
};

/**
 * Get available expiry dates for an index
 */
export async function getExpiries(req: Request, res: Response): Promise<void> {
  try {
    const { indexName } = req.params;

    const allExpiries = fetchExpiryDates();
    const indexExpiries = allExpiries.find((e) => e.index === indexName);

    if (!indexExpiries) {
      res.status(404).json({
        success: false,
        message: `No expiries found for ${indexName}`,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        indexName,
        expiries: indexExpiries.expiries,
      },
    });
  } catch (error) {
    logger.error('Get expiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * Get available strike prices for an index
 */
export async function getStrikes(req: Request, res: Response): Promise<void> {
  try {
    const { indexName } = req.params;

    const config = STRIKE_CONFIG[indexName as string];
    if (!config) {
      res.status(404).json({
        success: false,
        message: `Invalid index: ${indexName}`,
      });
      return;
    }

    const spotPrice = getIndexSpotPrice(indexName as string);
    if (!spotPrice) {
      res.status(404).json({
        success: false,
        message: `Spot price not available for ${indexName}`,
      });
      return;
    }

    // Calculate ATM strike
    const atmStrike = Math.round(spotPrice / config.stepSize) * config.stepSize;

    // Generate strikes: 40 below ATM + ATM + 40 above ATM = 81 strikes
    const strikes: number[] = [];
    for (let i = -config.range; i <= config.range; i++) {
      strikes.push(atmStrike + i * config.stepSize);
    }

    res.json({
      success: true,
      data: {
        indexName,
        spotPrice,
        atmStrike,
        stepSize: config.stepSize,
        strikes,
      },
    });
  } catch (error) {
    logger.error('Get strikes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * Get current spot price for an index
 */
export async function getSpotPrice(req: Request, res: Response): Promise<void> {
  try {
    const { indexName } = req.params;

    const spotPrice = getIndexSpotPrice(indexName as string);
    if (!spotPrice) {
      res.status(404).json({
        success: false,
        message: `Spot price not available for ${indexName}`,
      });
      return;
    }

    const config = STRIKE_CONFIG[indexName as string] ;
    const atmStrike = config
      ? Math.round(spotPrice / config.stepSize) * config.stepSize
      : null;

    res.json({
      success: true,
      data: {
        indexName,
        spotPrice,
        atmStrike,
      },
    });
  } catch (error) {
    logger.error('Get spot price error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * Start watching an option contract
 */
export async function watchContract(req: Request, res: Response): Promise<void> {
  try {
    const { indexName, strikePrice, expiryDate, optionType } = req.body;

    if (!indexName || !strikePrice || !expiryDate || !optionType) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
      return;
    }

    const result = await OptionsApiService.watchContract(
      indexName,
      strikePrice,
      expiryDate,
      optionType
    );

    res.json(result);
  } catch (error) {
    logger.error('Watch contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * Stop watching an option contract
 */
export async function unwatchContract(req: Request, res: Response): Promise<void> {
  try {
    const { indexName, strikePrice, expiryDate, optionType } = req.body;

    if (!indexName || !strikePrice || !expiryDate || !optionType) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
      return;
    }

    const result = OptionsApiService.unwatchContract(
      indexName,
      strikePrice,
      expiryDate,
      optionType
    );

    res.json(result);
  } catch (error) {
    logger.error('Unwatch contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * Get LTP for a single contract
 */
export async function getContractLTP(req: Request, res: Response): Promise<void> {
  try {
    const { indexName, strikePrice, optionType } = req.query;

    if (!indexName || !strikePrice || !optionType) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
      return;
    }

    const result = await OptionsApiService.getCurrentLTP(
      indexName as string,
      parseFloat(strikePrice as string),
      optionType as 'CE' | 'PE'
    );

    res.json(result);
  } catch (error) {
    logger.error('Get contract LTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * Get LTPs for multiple contracts
 */
export async function getMultipleContractLTPs(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { contracts } = req.body;

    if (!contracts || !Array.isArray(contracts)) {
      res.status(400).json({
        success: false,
        message: 'Invalid contracts array',
      });
      return;
    }

    const result = await OptionsApiService.getMultipleLTPs(contracts);

    res.json(result);
  } catch (error) {
    logger.error('Get multiple LTPs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}