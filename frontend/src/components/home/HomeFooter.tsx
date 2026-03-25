'use client';

import { Box, Typography } from '@mui/material';

export function HomeFooter() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid #f3f4f6',
        py: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
      }}
    >
      <Typography
        sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.8rem',
          color: '#9ca3af',
        }}
      >
        © 2026 TradeUp · Paper Options Trading Platform
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: '#10b981',
          }}
        />
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: '#ef4444',
          }}
        />
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: '#10b981',
          }}
        />
        <Typography
          sx={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.7rem',
            color: '#9ca3af',
            ml: 1,
          }}
        >
          For educational use only
        </Typography>
      </Box>
    </Box>
  );
}