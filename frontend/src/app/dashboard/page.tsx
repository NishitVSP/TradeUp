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
  user_id: number;
  user_name: string;
  email: string;
  phone_number?: string;
  balance: number;
  created_at?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
      } else {
        // Token invalid or expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

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

  if (error) {
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
          <p style={{ color: '#ef4444', fontFamily: '"DM Sans", sans-serif', marginBottom: '16px' }}>
            {error}
          </p>
          <button
            onClick={() => router.push('/login')}
            style={{
              padding: '10px 20px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Go to Login
          </button>
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

      {/* Add keyframes for spinner animation */}
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </DashboardContainer>
  );
}