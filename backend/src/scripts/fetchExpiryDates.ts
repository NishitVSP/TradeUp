interface IndexExpiries {
  index: string;
  expiries: string[];
}

export function fetchExpiryDates(): IndexExpiries[] {
  return [
    {
      index: "NIFTY",
      expiries: [
        "14-07-2026",
        "21-07-2026",
        "28-07-2026",
        "04-08-2026",
        "11-08-2026"
      ]
    },
    {
      index: "BANKNIFTY",
      expiries: [
        "28-07-2026",
        "25-08-2026",
        "29-09-2026"
      ]
    },
    {
      index: "FINNIFTY",
      expiries: [
        "28-07-2026",
        "25-08-2026",
        "29-09-2026"
      ]
    },
    {
      index: "MIDCPNIFTY",
      expiries: [
        "28-07-2026",
        "25-08-2026",
        "29-09-2026"
      ]
    },
    {
      index: "BANKEX",
      expiries: [
        "30-07-2026",
        "27-08-2026",
        "24-09-2026"
      ]
    },
    {
      index: "SENSEX",
      expiries: [
        "16-07-2026",
        "23-07-2026",
        "30-07-2026",
        "06-08-2026",
        "13-08-2026"
      ]
    }
  ];
}