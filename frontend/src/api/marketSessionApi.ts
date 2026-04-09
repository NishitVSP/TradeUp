import axios from 'axios';

const API_BASE = 'http://localhost:3001';

export interface MarketSession {
  name: string;
  url: string;
  isOpen: boolean;
}

export interface MarketSessionResponse {
  success: boolean;
  market: MarketSession | null;
  isMarketOpen: boolean;
  message: string;
}

export async function fetchMarketSession(): Promise<MarketSessionResponse> {
  try {
    const response = await axios.get(`${API_BASE}/api/options/market-session`);

    return response.data;
  } catch (error) {
    console.error('Error fetching market session:', error);
    return {
      success: false,
      market: null,
      isMarketOpen: false,
      message: 'Failed to fetch market session',
    };
  }
}
