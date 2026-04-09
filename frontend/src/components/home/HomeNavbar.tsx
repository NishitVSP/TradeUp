'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Button } from '@mui/material';

export function HomeNavbar() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean>(false);

  useEffect(() => {
      // Check for token and validate it
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
      
      if (storedToken) {
        // Simple token validation - check if it's not expired
        try {
          const tokenData = JSON.parse(atob(storedToken.split('.')[1]));
          const currentTime = Date.now() / 1000;
          const isExpired = tokenData.exp < currentTime;
          setIsTokenValid(!isExpired);
        } catch (error) {
          setIsTokenValid(false);
        }
      }
    }, []);
  
    const handleSignInClick = () => {
      if (token && isTokenValid) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    };

  return (
    <Box
      component="nav"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pt: 2,
        mb: 0,
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
          width={200}
          height={50}
          style={{ objectFit: 'contain' }}
          priority
        />
      </Box>


      {/* Auth buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Button
        onClick={handleSignInClick}
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