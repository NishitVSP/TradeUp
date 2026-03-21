interface IndexExpiries {
  index: string;
  expiries: string[]; // 5 expiry dates in DD-MM-YYYY format
}

export function fetchExpiryDates(): IndexExpiries[] {
  return [
    {
      index: 'NIFTY',
      expiries: [
        '24-03-2026',
        '30-03-2026',
        '07-04-2026', 
        '13-04-2026',
        '21-04-2026'
      ]
    },
    {
      index: 'BANKNIFTY',
      expiries: [
        '30-03-2026',
        '28-04-2026',
        '26-05-2026',
        '30-06-2026',
        '28-07-2026'
      ]
    },
    {
      index: 'FINNIFTY',
      expiries: [
        '30-03-2026',
        '28-04-2026',
        '26-05-2026',
        '30-06-2026',
        '28-07-2026'
      ]
    },
    {
      index: 'MIDCPNIFTY',
      expiries: [
        '30-03-2026',
        '28-04-2026',
        '26-05-2026',
        '30-06-2026',
        '28-07-2026'
      ]
    },
    {
      index: 'BANKEX',
      expiries: [
        '25-03-2026',
        '30-04-2026',
        '27-05-2026',
        '30-06-2026',
        '28-07-2026'
      ]
    },
    {
      index: 'SENSEX',
      expiries: [
        '19-03-2026',
        '25-03-2026',
        '02-04-2026',
        '09-04-2026',
        '16-04-2026'
      ]
    }
  ];
}
