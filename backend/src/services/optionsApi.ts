import { addContractToWatch, removeContractFromWatch, getContractLTP, getMultipleContractLTPs } from './optionsSimulator';
import { logger } from '../utils/logger';

/**
 * API service for options contract management
 * This will be used by the frontend to interact with options simulation
 */

export class OptionsApiService {
  
  /**
   * Start simulating a specific options contract
   */
  static async watchContract(
    indexName: string, 
    strikePrice: number, 
    expiryDate: string,
    optionType: 'CE' | 'PE'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const success = await addContractToWatch(indexName, strikePrice, expiryDate, optionType);
      
      if (success) {
        logger.info(`Frontend requested to watch: ${indexName} ${strikePrice} ${optionType}`);
        return { success: true, message: `Started watching ${indexName} ${strikePrice} ${optionType}` };
      } else {
        return { success: false, message: `Contract not found: ${indexName} ${strikePrice} ${optionType}` };
      }
    } catch (error) {
      logger.error('Error watching contract:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  /**
   * Stop simulating a specific options contract
   */
  static unwatchContract(
    indexName: string, 
    strikePrice: number, 
    expiryDate: string,
    optionType: 'CE' | 'PE'
  ): { success: boolean; message: string } {
    try {
      removeContractFromWatch(indexName, strikePrice, expiryDate, optionType);
      logger.info(`Frontend requested to unwatch: ${indexName} ${strikePrice} ${optionType}`);
      return { success: true, message: `Stopped watching ${indexName} ${strikePrice} ${optionType}` };
    } catch (error) {
      logger.error('Error unwatching contract:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  /**
   * Get current LTP for a single contract
   */
  static async getCurrentLTP(
    indexName: string, 
    strikePrice: number, 
    optionType: 'CE' | 'PE'
  ): Promise<{ success: boolean; ltp: number | null; message: string }> {
    try {
      const ltp = await getContractLTP(indexName, strikePrice, optionType);
      
      if (ltp !== null) {
        return { success: true, ltp, message: 'Success' };
      } else {
        return { success: false, ltp: null, message: 'Contract not found' };
      }
    } catch (error) {
      logger.error('Error getting LTP:', error);
      return { success: false, ltp: null, message: 'Internal server error' };
    }
  }

  /**
   * Get LTPs for multiple contracts (batch request)
   */
  static async getMultipleLTPs(
    contracts: Array<{ indexName: string; strikePrice: number; expiryDate: string; optionType: 'CE' | 'PE' }>
  ): Promise<{ success: boolean; data: Array<{ indexName: string; strikePrice: number; expiryDate: string; optionType: 'CE' | 'PE'; ltp: number | null }>; message: string }> {
    try {
      const data = await getMultipleContractLTPs(contracts);
      return { success: true, data, message: 'Success' };
    } catch (error) {
      logger.error('Error getting multiple LTPs:', error);
      return { success: false, data: [], message: 'Internal server error' };
    }
  }

  /**
   * Get ATM strike price for a given index
   */
  static getATMStrike(indexName: string, spotPrice: number): number {
    const stepSizes: Record<string, number> = {
      'NIFTY': 50,
      'BANKNIFTY': 100,
      'FINNIFTY': 50,
      'MIDCPNIFTY': 25,
      'BANKEX': 100,
      'SENSEX': 100
    };

    const stepSize = stepSizes[indexName] || 50;
    return Math.round(spotPrice / stepSize) * stepSize;
  }
}
