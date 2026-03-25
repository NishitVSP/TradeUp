'use client';

import { Box, Typography } from '@mui/material';

const SUPPORTED_INDEXES = [
  { name: 'NIFTY 50', change: '+0.42%', positive: true },
  { name: 'BANKNIFTY', change: '+0.18%', positive: true },
  { name: 'FINNIFTY', change: '-0.07%', positive: false },
  { name: 'MIDCPNIFTY', change: '+0.63%', positive: true },
  { name: 'BANKEX', change: '+0.29%', positive: true },
  { name: 'SENSEX', change: '+0.51%', positive: true },
];

export function IndexTicker() {
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
        {SUPPORTED_INDEXES.map((index) => (
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
              {index.change}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}