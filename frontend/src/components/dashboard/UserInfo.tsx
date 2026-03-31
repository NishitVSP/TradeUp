'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, IconButton } from '@mui/material';
import { LogOut } from 'lucide-react';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  InfoRow,
  InfoLabel,
  InfoValue,
  BalanceCard,
  BalanceAmount,
} from './styled';
import { Button } from '../ui';

interface User {
  user_id?: number;
  userId?: number;
  user_name?: string;
  userName?: string;
  email: string;
  phone_number?: string;
  phoneNumber?: string;
  balance?: number;
  created_at?: string;
}

interface UserInfoProps {
  user: User;
  onBalanceUpdate: (newBalance: number) => void;
}

export function UserInfo({ user, onBalanceUpdate }: UserInfoProps) {
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleAddFunds = async () => {
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/auth/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: numAmount }),
      });

      const data = await response.json();

      if (data.success) {
        onBalanceUpdate(data.data.balance);
        setAddFundsOpen(false);
        setAmount('');
      } else {
        setError(data.message || 'Failed to add funds');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatBalance = (balance: number | undefined | null): string => {
    const bal = balance ?? 0;
    return bal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Handle both snake_case (from DB) and camelCase (from localStorage)
  const userId = user.user_id ?? user.userId;
  const userName = user.user_name ?? user.userName;
  const phoneNumber = user.phone_number ?? user.phoneNumber;
  const balance = user.balance ?? 0;

  return (
    <>
      <Panel>
        <PanelHeader>
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <img
                src="/tradeupLogo_brand.svg"
                alt="TradeUp Logo"
                style={{
                  height: '40px',
                  width: 'auto',
                }}
              />
            </Box>
            <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.95rem',
              color: '#64748b',
              margin: '4px 0 0 0',
            }}
          >
            Welcome back, {userName}
          </p>
        </Box>
        
      </PanelHeader>

        <BalanceCard>
          <InfoLabel sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Virtual Balance
          </InfoLabel>
          <BalanceAmount>
            ₹{formatBalance(balance)}
          </BalanceAmount>
          <Button
            variant="primary"
            fullWidth
            onClick={() => setAddFundsOpen(true)}
            sx={{
              mt: 2,
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            Add Funds
          </Button>
        </BalanceCard>

        <Box>
          <InfoRow>
            <InfoLabel>Name</InfoLabel>
            <InfoValue>{userName || 'N/A'}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Email</InfoLabel>
            <InfoValue sx={{ fontSize: '0.85rem' }}>{user.email}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Phone</InfoLabel>
            <InfoValue>{phoneNumber || 'N/A'}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Member Since</InfoLabel>
            <InfoValue>{formatDate(user.created_at)}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>User ID</InfoLabel>
            <InfoValue>#{userId || 'N/A'}</InfoValue>
          </InfoRow>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <IconButton
            onClick={handleLogout}
            sx={{
              background: '#f90101f6',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              '&:hover': {
                background: '#f90101f6',
                borderColor: '#f90101f6',
              },
            }}
          >
            <LogOut size={20} color="#ffffff" />
          </IconButton>
        </Box>
      </Panel>

      <Dialog
        open={addFundsOpen}
        onClose={() => {
          setAddFundsOpen(false);
          setAmount('');
          setError('');
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 700,
            fontSize: '1.25rem',
          }}
        >
          Add Virtual Funds
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Amount (₹)"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            InputProps={{
              inputProps: { min: 0, step: 100 },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: '"DM Sans", sans-serif',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button
            onClick={() => {
              setAddFundsOpen(false);
              setAmount('');
              setError('');
            }}
            variant="secondary"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddFunds}
            variant="primary"
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}
          >
            {loading ? 'Adding...' : 'Add Funds'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}