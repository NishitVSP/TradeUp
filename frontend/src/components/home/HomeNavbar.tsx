'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Box, Button } from '@mui/material';

export function HomeNavbar() {
  return (
    <Box
      component="nav"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 2.5,
        px: { xs: 2, md: 0 },
        borderBottom: '1px solid #f3f4f6',
        mb: 2,
      }}
    >
      {/* Logo */}
      <Box
        component={Link}
        href="/"
        sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
      >
        <Image
          src="/tradeupLogo_brand.svg"
          alt="TradeUp - Learn Option Trading 24x7"
          width={240}
          height={70}
          style={{ objectFit: 'contain' }}
          priority
        />
      </Box>

      {/* Nav links */}
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 4, alignItems: 'center' }}>
        {['Features', 'Indexes', 'About'].map((item) => (
          <Box
            key={item}
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.875rem',
              color: '#6b7280',
              cursor: 'pointer',
              transition: 'color 0.15s',
              '&:hover': { color: '#0a0a0a' },
            }}
          >
            {item}
          </Box>
        ))}
      </Box>

      {/* Auth buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Button
          component={Link}
          href="/login"
          sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 500,
            fontSize: '0.875rem',
            color: '#374151',
            textTransform: 'none',
            px: 2,
            py: 0.75,
            '&:hover': { color: '#10b981', bgcolor: 'transparent' },
          }}
        >
          Sign In
        </Button>
        <Button
          component={Link}
          href="/register"
          sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 600,
            fontSize: '0.875rem',
            textTransform: 'none',
            px: 2.5,
            py: 0.75,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            boxShadow: '0 2px 12px rgba(16,185,129,0.3)',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
            },
          }}
        >
          Get Started
        </Button>
      </Box>
    </Box>
  );
}