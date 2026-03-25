'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container } from '@mui/material';
import {
  HomeNavbar,
  HeroSection,
  IndexTicker,
  FeaturesSection,
  CTASection,
  HomeFooter,
} from '../components/home';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#ffffff',
        // Subtle dot-grid background
        backgroundImage:
          'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      <Container maxWidth="lg">
        <HomeNavbar />
        <HeroSection />
        <IndexTicker />
        <FeaturesSection />
        <CTASection />
        <HomeFooter />
      </Container>
    </Box>
  );
}