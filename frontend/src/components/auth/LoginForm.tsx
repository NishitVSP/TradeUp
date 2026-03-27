'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Grid, Typography, Alert } from '@mui/material';
import { Button, Input, Card } from '../ui';

export function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
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
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Sign In" subtitle="Access your trading account">
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Input
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!error}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Input
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
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
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don&apos;t have an account?{' '}
                <Link href="/register" style={{ color: '#10b981', textDecoration: 'none' }}>
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
}