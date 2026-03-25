'use client';

import { Box, Container, Grid, Typography } from '@mui/material';
import { RegisterForm } from '../../components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #f0fdf4 0%, #fef2f2 50%, #ffffff 50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ textAlign: 'center', mb: 0.5 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 0.5, fontWeight: 600 }}>
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Join TradeUp to start paper option trading
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <RegisterForm />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}