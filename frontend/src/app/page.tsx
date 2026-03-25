'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import { customGradients } from '../theme';

const SUPPORTED_INDEXES = [
  { name: 'NIFTY' },
  { name: 'BANKNIFTY' },
  { name: 'FINNIFTY' },
  { name: 'MIDCPNIFTY' },
  { name: 'BANKEX' },
  { name: 'SENSEX' },
];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: customGradients.background,
        py: 4,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.03) 0%, transparent 100%)',
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            py: 8,
          }}
        >
        

          {/* Header */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: customGradients.primary,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            TradeUp
          </Typography>
          
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 600 }}
          >
            Paper Option Trading 24x7 Platform
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 6, maxWidth: 700 }}
          >
            Built for learning trading with real-time Black-Scholes pricing and zero risk
          </Typography>

          {/* Supported Indexes */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Supported Indexes
            </Typography>
            <Grid container spacing={2} sx={{ maxWidth: 800, mx: 'auto' }}>
              {SUPPORTED_INDEXES.map((index) => (
                <Grid size={{ xs: 6, sm: 4 }} key={index.name}>
                  <Card
                    sx={{
                      height: '100%',
                      background: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        borderColor: 'primary.main',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {index.name}
                      </Typography>
                      
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Features */}
          <Grid container spacing={4} sx={{ mb: 8 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: 'primary.main',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    📈
                  </Avatar>
                  <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                    Real-time Pricing
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Black-Scholes formula for accurate option premiums
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: 'secondary.main',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    ⚡
                  </Avatar>
                  <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                    24x7 Trading
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Practice anytime, anywhere with continuous market simulation
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: '#6366f1',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    🎓
                  </Avatar>
                  <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                    Risk-Free Learning
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Paper trading with real market data, zero financial risk
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Call to Action */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Button
                variant="contained"
                size="large"
                href="/register"
                LinkComponent={Link}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  background: customGradients.primary,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #dc2626 100%)',
                  },
                }}
              >
                Start Trading
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                href="/login"
                LinkComponent={Link}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'primary.50',
                  },
                }}
              >
                Sign In
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Join thousands of traders learning options strategies risk-free
            </Typography>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              mt: 8,
              pt: 4,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              © 2026 TradeUp. Paper Option Trading Platform for Learning.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
