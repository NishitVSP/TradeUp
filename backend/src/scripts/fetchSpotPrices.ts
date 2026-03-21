import axios from 'axios';

interface IndexSpot {
  symbol: string;
  spotPrice: number;
}

// Using Yahoo Finance as data source (free, no API key)
const YAHOO_SYMBOLS = {
  'NIFTY': '^NSEI',
  'BANKNIFTY': '^NSEBANK',
  'FINNIFTY': 'NIFTY_FIN_SERVICE.NS',
  'MIDCPNIFTY': 'NIFTY_MIDCAP_100.NS',
  'BANKEX': 'BSE-BANK.BO',
  'SENSEX': '^BSESN'
};

export async function fetchSpotPrices(): Promise<IndexSpot[]> {
  try {
    const spots: IndexSpot[] = [];
    
    for (const [index, symbol] of Object.entries(YAHOO_SYMBOLS)) {
      try {
        // Yahoo Finance API endpoint
        const response = await axios.get(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
        );
        
        const price = response.data.chart.result[0].meta.regularMarketPrice;
        
        spots.push({
          symbol: index,
          spotPrice: Math.round(price)
        });
        
        // console.log(`${index}: ${price}`);
      } catch (err) {
        console.error(`Failed to fetch ${index}:`, err);
        // Fallback to approximate values if API fails
        const fallback: Record<string, number> = {
          'NIFTY': 23600,
          'BANKNIFTY': 54700,
          'FINNIFTY': 25600,
          'MIDCPNIFTY': 55000,
          'BANKEX': 61400,
          'SENSEX': 76000
        };
        spots.push({
          symbol: index,
          spotPrice: fallback[index]
        });
      }
    }
    
    return spots;
  } catch (error) {
    console.error('Error fetching spot prices:', error);
    throw error;
  }
}

fetchSpotPrices().then(spots => {
  console.log('\nFinal Spot Prices:');
  spots.forEach(s => console.log(`${s.symbol}: ${s.spotPrice}`));
});