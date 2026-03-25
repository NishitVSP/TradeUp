'use client';

import { Box, Container, Grid, Typography } from '@mui/material';
import { LoginForm } from '../../components/auth/LoginForm';

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #f0fdf4 0%, #fef2f2 50%, #ffffff 50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
      }}
    >
      <Container maxWidth="sm">
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h2" sx={{ mb: 1, fontWeight: 600 }}>
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to your TradeUp account
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <LoginForm />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}