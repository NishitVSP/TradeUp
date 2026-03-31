'use client';

import { Box, Typography } from '@mui/material';

const FEATURES = [
  {
    
    title: 'Real-time Pricing',
    description:
      'Black-Scholes formula calculates accurate option premiums using live volatility, time decay, and interest rates.',
    accent: '#10b981',
    bg: 'rgba(16, 185, 129, 0.05)',
    border: 'rgba(16, 185, 129, 0.18)',
  },
  {
    
    title: '24×7 Trading',
    description:
      'Markets never sleep here. Practice intraday, overnight, or weekend strategies without waiting for open hours.',
    accent: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.05)',
    border: 'rgba(245, 158, 11, 0.18)',
  },
  {
    
    title: 'Risk-Free Learning',
    description:
      'Simulated paper trades with real market data. Build conviction and test strategies with zero financial exposure.',
    accent: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.05)',
    border: 'rgba(99, 102, 241, 0.18)',
  },
];

export function FeaturesSection() {
  return (
    <Box sx={{ mb: 14 }}>
      {/* Section label */}
      <Typography
        sx={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '0.68rem',
          letterSpacing: '0.12em',
          color: '#9ca3af',
          textAlign: 'center',
          mb: 2,
          textTransform: 'uppercase',
        }}
      >
        Why TradeUp
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Playfair Display", serif',
          fontSize: { xs: '2rem', md: '2.6rem' },
          fontWeight: 700,
          color: '#0a0a0a',
          textAlign: 'center',
          mb: 8,
          letterSpacing: '-0.02em',
        }}
      >
        Everything you need to learn options
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {FEATURES.map((feature) => (
          <Box
            key={feature.title}
            sx={{
              p: 4,
              borderRadius: '16px',
              border: `1px solid ${feature.border}`,
              bgcolor: feature.bg,
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 40px ${feature.border}`,
              },
            }}
          >
            
            <Typography
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#0a0a0a',
                mb: 1.5,
              }}
            >
              {feature.title}
            </Typography>
            <Typography
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.9rem',
                color: '#6b7280',
                lineHeight: 1.75,
              }}
            >
              {feature.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}