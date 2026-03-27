'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Grid, Typography, Alert } from '@mui/material';
import { Button, Input, Card } from '../ui';

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        router.push('/dashboard');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Create Account"
      subtitle="Join TradeUp to start paper trading"
      sx={{
        '& .MuiCardContent-root, & > div': { p: '12px !important' },
      }}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 0.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1, py: 0.25, fontSize: '0.78rem' }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={1}>
          <Grid size={{ xs: 12 }}>
            <Input
              fullWidth
              label="Full Name"
              type="text"
              size="small"
              value={formData.userName}
              onChange={handleInputChange('userName')}
              error={!!error}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Input
              fullWidth
              label="Email Address"
              type="email"
              size="small"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!error}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Input
              fullWidth
              label="Phone Number"
              type="text"
              size="small"
              value={formData.phoneNumber}
              onChange={handleInputChange('phoneNumber')}
              error={!!error}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Input
              fullWidth
              label="Password"
              type="password"
              size="small"
              value={formData.password}
              onChange={handleInputChange('password')}
              error={!!error}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Input
              fullWidth
              label="Confirm Password"
              type="password"
              size="small"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              error={!!error}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button
              fullWidth
              variant="primary"
              type="submit"
              disabled={loading}
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" fontSize="0.78rem">
                Already have an account?{' '}
                <Link href="/login" style={{ color: '#10b981', textDecoration: 'none' }}>
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
}