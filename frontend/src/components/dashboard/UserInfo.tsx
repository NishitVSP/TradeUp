'use client';

import { useState } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
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
  userId: number;
  userName: string;
  email: string;
  phoneNumber?: string;
  balance: number;
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
        
        // Update localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData.balance = data.data.balance;
          localStorage.setItem('user', JSON.stringify(userData));
        }
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

  return (
    <>
      <Panel>
        <PanelHeader>
          <PanelTitle>Account</PanelTitle>
        </PanelHeader>

        <BalanceCard>
          <InfoLabel sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Virtual Balance
          </InfoLabel>
          <BalanceAmount>
            ₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
            <InfoValue>{user.userName}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Email</InfoLabel>
            <InfoValue sx={{ fontSize: '0.85rem' }}>{user.email}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Phone</InfoLabel>
            <InfoValue>{user.phoneNumber || 'N/A'}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Member Since</InfoLabel>
            <InfoValue>{formatDate(user.created_at)}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>User ID</InfoLabel>
            <InfoValue>#{user.userId}</InfoValue>
          </InfoRow>
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