'use client';

import Link from 'next/link';
import { Box, Typography, Button } from '@mui/material';

export function HeroSection() {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: { xs: 10, md: 14 },
        position: 'relative',
      }}
    >
      {/* Eyebrow badge */}
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 0.75,
          mb: 4,
          borderRadius: '999px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          background: 'rgba(16, 185, 129, 0.06)',
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: '#10b981',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.4 },
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            fontFamily: '"DM Mono", monospace',
            color: '#10b981',
            fontWeight: 600,
            letterSpacing: '0.08em',
            fontSize: '0.7rem',
          }}
        >
          PAPER OPTIONS TRADING · 24×7
        </Typography>
      </Box>

      {/* Main heading */}
      <Typography
        component="h1"
        sx={{
          fontFamily: '"Playfair Display", serif',
          fontWeight: 800,
          fontSize: { xs: '3.2rem', sm: '4.5rem', md: '6rem' },
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: '#0a0a0a',
          mb: 3,
        }}
      >
        Trade{' '}
        <Box
          component="span"
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          smarter.
        </Box>
        <br />
        Risk nothing.
      </Typography>

      <Typography
        variant="h6"
        sx={{
          fontFamily: '"DM Sans", sans-serif',
          color: '#6b7280',
          fontWeight: 400,
          maxWidth: 520,
          mx: 'auto',
          mb: 6,
          lineHeight: 1.7,
          fontSize: { xs: '1rem', md: '1.125rem' },
        }}
      >
        Master option trading across India's top indexes — 
        no capital at risk, ever.
      </Typography>

      {/* CTA Buttons */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          mb: 10,
          px: { xs: 3, sm: 0 },
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
            letterSpacing: '0.01em',
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
          Start Trading Free →
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
          Sign In
        </Button>
      </Box>

      {/* Stat strip */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: { xs: 4, sm: 8 },
          flexWrap: 'wrap',
        }}
      >
        {[
          { value: '6', label: 'Indexes supported' },
          { value: '24×7', label: 'Market access' },
          { value: '₹0', label: 'Capital required' },
        ].map((stat) => (
          <Box key={stat.label} sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontSize: '1.9rem',
                fontWeight: 700,
                color: '#0a0a0a',
                lineHeight: 1,
              }}
            >
              {stat.value}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                color: '#9ca3af',
                fontSize: '0.72rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}