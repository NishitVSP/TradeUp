'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button } from '@mui/material';
import { fetchMarketSession } from '@/api/marketSessionApi';

export function HeroSection() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean>(false);
  const [ marketSession, setMarketSession] = useState<string | null>(null);

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

    // Fetch market session
    const fetchMarketData = async () => {
      try {
        const data = await fetchMarketSession();
        if (data.success && data.market) {
          setMarketSession(data.market.name);
        }
      } catch (error) {
        console.error('Failed to fetch market session:', error);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 7200000); // Update every 2 hours
    return () => clearInterval(interval);
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
          {marketSession ? `Polling from ${marketSession}` : 'PAPER OPTIONS TRADING - 24x7'}
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
        Learn{' '}
        <Box
          component="span"
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Trading.
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
        Master option trading across India's top indexes - anytime, anywhere, whole day!
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
          onClick={handleSignInClick}
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

    </Box>
  );
}