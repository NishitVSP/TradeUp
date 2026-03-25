'use client';

import Link from 'next/link';
import { Box, Typography, Button } from '@mui/material';

export function CTASection() {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: { xs: 8, md: 12 },
        px: { xs: 3, md: 6 },
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #f0fdf8 0%, #fafafa 60%, #fff7f7 100%)',
        border: '1px solid #e8f5f0',
        mb: 10,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -60,
          left: -60,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)',
        },
      }}
    >
      <Typography
        sx={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '0.68rem',
          letterSpacing: '0.12em',
          color: '#10b981',
          mb: 2,
          textTransform: 'uppercase',
        }}
      >
        Get Started Today
      </Typography>

      <Typography
        sx={{
          fontFamily: '"Playfair Display", serif',
          fontSize: { xs: '2rem', md: '3rem' },
          fontWeight: 700,
          color: '#0a0a0a',
          mb: 2,
          letterSpacing: '-0.02em',
          position: 'relative',
          zIndex: 1,
        }}
      >
        Your trading journey
        <br />
        starts here.
      </Typography>

      <Typography
        sx={{
          fontFamily: '"DM Sans", sans-serif',
          color: '#6b7280',
          mb: 5,
          fontSize: '1rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        Join traders learning options strategies risk-free on TradeUp.
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          position: 'relative',
          zIndex: 1,
          px: { xs: 2, sm: 0 },
        }}
      >
        <Button
          component={Link}
          href="/register"
          size="large"
          sx={{
            px: 5,
            py: 1.75,
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 700,
            fontSize: '0.95rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            textTransform: 'none',
            boxShadow: '0 4px 24px rgba(16, 185, 129, 0.35)',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.45)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          Create Free Account →
        </Button>

        <Button
          component={Link}
          href="/login"
          size="large"
          sx={{
            px: 5,
            py: 1.75,
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 600,
            fontSize: '0.95rem',
            borderRadius: '10px',
            border: '1.5px solid #e5e7eb',
            color: '#374151',
            textTransform: 'none',
            bgcolor: '#fff',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#10b981',
              color: '#10b981',
              bgcolor: 'rgba(16,185,129,0.04)',
            },
          }}
        >
          Already have an account
        </Button>
      </Box>
    </Box>
  );
}