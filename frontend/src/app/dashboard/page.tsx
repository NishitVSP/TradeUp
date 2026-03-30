'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, IconButton } from '@mui/material';
import { LogOut } from 'lucide-react';
import {
  DashboardContainer,
  DashboardGrid,
  Column,
  SplitPanel,
  UserInfo,
  Positions,
  OptionSelector,
  Terminal,
} from '@/components/dashboard';

interface User {
  userId: number;
  userName: string;
  email: string;
  phoneNumber?: string;
  balance: number;
  created_at?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        throw new Error('No user data found');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleBalanceUpdate = (newBalance: number) => {
    if (user) {
      setUser({ ...user, balance: newBalance });
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              animation: 'spin 1s linear infinite',
              borderRadius: '50%',
              height: '48px',
              width: '48px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#10b981',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#64748b', fontFamily: '"DM Sans", sans-serif' }}>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardContainer>
      {/* Header with logout */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <h1
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#1e293b',
              margin: 0,
            }}
          >
            TradeUp Dashboard
          </h1>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.95rem',
              color: '#64748b',
              margin: '4px 0 0 0',
            }}
          >
            Welcome back, {user.userName}
          </p>
        </Box>
        <IconButton
          onClick={handleLogout}
          sx={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            '&:hover': {
              background: '#f8fafc',
              borderColor: '#cbd5e1',
            },
          }}
        >
          <LogOut size={20} color="#64748b" />
        </IconButton>
      </Box>

      {/* Three Column Layout */}
      <DashboardGrid>
        {/* Column 1: User Info (20%) */}
        <Column width="20%">
          <UserInfo user={user} onBalanceUpdate={handleBalanceUpdate} />
        </Column>

        {/* Column 2: Positions & Options (30%) */}
        <Column width="30%">
          <SplitPanel height="60%">
            <Positions />
          </SplitPanel>
          <SplitPanel height="40%">
            <OptionSelector />
          </SplitPanel>
        </Column>

        {/* Column 3: Terminal (50%) */}
        <Column width="50%">
          <Terminal />
        </Column>
      </DashboardGrid>
    </DashboardContainer>
  );
}