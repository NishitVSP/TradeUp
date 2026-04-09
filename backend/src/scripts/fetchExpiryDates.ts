interface IndexExpiries {
  index: string;
  expiries: string[]; // 5 expiry dates in DD-MM-YYYY format
}

export function fetchExpiryDates(): IndexExpiries[] {
  return [
    {
      index: 'NIFTY',
      expiries: [ 
        '13-04-2026',
        '21-04-2026',
        '28-04-2026',
        '05-05-2026',
        '26-05-2026'
      ]
    },
    {
      index: 'BANKNIFTY',
      expiries: [
        '28-04-2026',
        '26-05-2026',
        '30-06-2026'
      ]
    },
    {
      index: 'FINNIFTY',
      expiries: [
        '28-04-2026',
        '26-05-2026',
        '30-06-2026'
      ]
    },
    {
      index: 'MIDCPNIFTY',
      expiries: [
        '28-04-2026',
        '26-05-2026',
        '30-06-2026'
      ]
    },
    {
      index: 'BANKEX',
      expiries: [
        '30-04-2026',
        '27-05-2026',
        '25-06-2026'
      ]
    },
    {
      index: 'SENSEX',
      expiries: [

        '16-04-2026',
        '23-04-2026',
        '30-04-2026',
        '07-05-2026'
      ]
    }
  ];
}
