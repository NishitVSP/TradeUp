'use client';

import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

// Gaussian random number generator (Box-Muller transform)
function gaussianRandom(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Convert [0,1) to (0,1)
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stdDev + mean;
}

const INDEX_NAMES = [
  'NIFTY 50',
  'BANKNIFTY', 
  'FINNIFTY',
  'MIDCPNIFTY',
  'BANKEX',
  'SENSEX'
];

export function IndexTicker() {
  const [indexes, setIndexes] = useState(INDEX_NAMES.map(name => ({
    name,
    change: 0,
    positive: true
  })));
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Generate initial values with Gaussian distribution
    const generateIndexData = () => {
      return INDEX_NAMES.map(name => {
        // Generate change with mean around 0.3% and std dev of 0.4%
        const change = gaussianRandom(0.3, 0.4);
        return {
          name,
          change: parseFloat(change.toFixed(2)),
          positive: change >= 0
        };
      });
    };

    // Set initial values
    setIndexes(generateIndexData());

    // Update every 1 second for visible movement
    const interval = setInterval(() => {
      setIndexes(generateIndexData());
    }, 1000);

    return () => clearInterval(interval);
  }, [isClient]);

  return (
    <Box sx={{ mb: 14 }}>
      <Typography
        sx={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '0.68rem',
          letterSpacing: '0.12em',
          color: '#9ca3af',
          textAlign: 'center',
          mb: 4,
          textTransform: 'uppercase',
        }}
      >
        Supported Indexes
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
          gap: 2,
        }}
      >
        {indexes.map((index) => (
          <Box
            key={index.name}
            sx={{
              px: 2,
              py: 2.5,
              borderRadius: '12px',
              border: '1px solid #f0f0f0',
              bgcolor: '#fff',
              textAlign: 'center',
              cursor: 'default',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              '&:hover': {
                borderColor: '#10b981',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.12)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Typography
              sx={{
                fontFamily: '"DM Mono", monospace',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#0a0a0a',
                letterSpacing: '0.04em',
                mb: 0.5,
              }}
            >
              {index.name}
            </Typography>
            <Typography
              sx={{
                fontFamily: '"DM Mono", monospace',
                fontSize: '0.68rem',
                fontWeight: 500,
                color: index.positive ? '#10b981' : '#ef4444',
              }}
            >
              {index.change > 0 ? `+${index.change}%` : `${index.change}%`}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}