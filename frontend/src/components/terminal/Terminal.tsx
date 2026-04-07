'use client';

import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/joy';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { closeAllPositions, cancelAllOrders } from '@/store/slices/terminalSlice';
import { useLtpPoller } from '@/hooks/useLtpPoller';

import IndexSelection       from './components/IndexSelection';
import ExpiryAndQuantityRow from './components/ExpiryAndQuantityRow';
import StrikePriceRow       from './components/StrikePriceRow';
import CheckBoxRow          from './components/CheckBoxRow';
import OrderPanel           from './components/OrderPanel';
import PredefinedPtsRow     from './components/PredefinedPtsRow';
import CloseAllRow          from './components/CloseAllRow';
import TabsRow              from './components/TabsRow';

export function Terminal() {
  const dispatch  = useDispatch();
  const { activeIndexName, activeExpiry, selectedContracts } = useSelector(
    (s: RootState) => s.terminal
  );

  // ── Start tiered LTP polling for all watched contracts ──────────────────────
  useLtpPoller();

  // ── Global keyboard shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'z' || e.key === 'Z') dispatch(closeAllPositions());
      if (e.key === 'x' || e.key === 'X') dispatch(cancelAllOrders());
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dispatch]);

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', height: '100%',
      bgcolor: '#ffffff', border: '1px solid #e5e7eb',
      borderRadius: '8px', overflow: 'hidden',
    }}>
      {/* Header */}
      <Box sx={{
        px: '10px', py: '6px', borderBottom: '1px solid #e5e7eb',
        bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#374151',
            letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Trading Terminal
          </Typography>
          {activeExpiry && (
            <Box sx={{ fontSize: '10px', fontWeight: 600, color: '#10b981',
              bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', px: '6px', py: '1px' }}>
              {activeIndexName} · {activeExpiry}
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {selectedContracts.length > 0 && (
            <Box sx={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600, mr: '4px' }}>
              {selectedContracts.length} contracts
            </Box>
          )}
          <Box sx={{
            width: 6, height: 6, borderRadius: '50%',
            bgcolor: selectedContracts.length > 0 ? '#10b981' : '#d1d5db',
            animation: selectedContracts.length > 0 ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
          }} />
          <Typography sx={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600 }}>
            {selectedContracts.length > 0 ? 'LIVE' : 'IDLE'}
          </Typography>
        </Box>
      </Box>

      {/* Index tab pills */}
      <IndexSelection />

      {/* Fixed body (only order/trade book scrolls) */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ExpiryAndQuantityRow />
        <StrikePriceRow />
        <CheckBoxRow />
        <OrderPanel />
        <PredefinedPtsRow />
        <CloseAllRow />
        <TabsRow />
      </Box>
    </Box>
  );
}