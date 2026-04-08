import React, { useState } from 'react';
import { Box, Input, Typography } from '@mui/joy';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  setCeBuyLimit, setCeSellLimit,
  setPeBuyLimit, setPeSellLimit,
  placeOrder, executeOrderLocally, updateOrderStatus,
  LOT_SIZES,
} from '@/store/slices/terminalSlice';
import { TerminalButton } from '../../styled';
import { useBeepSound } from '@/hooks/useBeepSound';

const API_BASE = 'http://localhost:3001';

interface OrderButtonProps {
  optionType: 'CE' | 'PE';
  transactionType: 'BUY' | 'SELL';
  onWarning: (message: string | null) => void;
}

const OrderButton: React.FC<OrderButtonProps> = ({ optionType, transactionType, onWarning }) => {
  const dispatch  = useDispatch();
  const playBeep  = useBeepSound();
  const t         = useSelector((s: RootState) => s.terminal);

  const limitValue =
    optionType === 'CE' && transactionType === 'BUY'  ? t.ceBuyLimit  :
    optionType === 'CE' && transactionType === 'SELL' ? t.ceSellLimit :
    optionType === 'PE' && transactionType === 'BUY'  ? t.peBuyLimit  :
    t.peSellLimit;

  const setLimit = (v: string) => {
    const clean = v.replace(/[^0-9.]/g, '');
    if      (optionType === 'CE' && transactionType === 'BUY')  dispatch(setCeBuyLimit(clean));
    else if (optionType === 'CE' && transactionType === 'SELL') dispatch(setCeSellLimit(clean));
    else if (optionType === 'PE' && transactionType === 'BUY')  dispatch(setPeBuyLimit(clean));
    else                                                         dispatch(setPeSellLimit(clean));
  };

  const strike  = optionType === 'CE' ? t.ceStrike : t.peStrike;
  const isBuy   = transactionType === 'BUY';
  const lotSize = LOT_SIZES[t.activeIndexName] ?? 1;
  const qty     = t.lots * lotSize;

  const handlePlace = async () => {
    if (!strike || !t.activeExpiry) return;
    playBeep();
    onWarning(null);

    const parsedLimit = limitValue !== '' ? parseFloat(limitValue) : null;

    // 1. Optimistically add to Redux order book immediately
    const optimisticId = `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    dispatch(placeOrder({
      id: optimisticId,
      indexName:      t.activeIndexName,
      strikePrice:    strike,
      expiryDate:     t.activeExpiry,
      optionType,
      transactionType,
      lots:           t.lots,
      quantity:       qty,
      lotSize,
      orderType:      parsedLimit !== null ? 'LIMIT' : 'MARKET',
      limitPrice:     parsedLimit,
      targetPts:      t.pdTarget !== '' ? parseFloat(t.pdTarget) : null,
      slPts:          t.pdSL     !== '' ? parseFloat(t.pdSL)     : null,
      trailPts:       t.pdTrail  !== '' ? parseFloat(t.pdTrail)  : null,
    }));

    // 2. Call real API
    try {
      // Only run on client-side to prevent hydration errors
      if (typeof window === 'undefined') {
        onWarning('Client-side only operation');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        onWarning('Authentication required');
        return;
      }
      
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          indexName:   t.activeIndexName,
          strikePrice: strike,
          expiryDate:  t.activeExpiry,
          optionType,
          action:      transactionType,
          orderType:   parsedLimit !== null ? 'LMT' : 'MKT',
          lots:        t.lots,
          lotSize,
          limitPrice:  parsedLimit,
          targetPts:   t.pdTarget !== '' ? parseFloat(t.pdTarget) : null,
          slPts:       t.pdSL     !== '' ? parseFloat(t.pdSL)     : null,
          trailPts:    t.pdTrail  !== '' ? parseFloat(t.pdTrail)  : null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (parsedLimit !== null) {
          
        } else {
          // Market order executed immediately
          dispatch(executeOrderLocally({
            id: optimisticId,
            executedPrice: data.data.executionPrice,
          }));
          if (typeof window !== 'undefined' && typeof data.data?.balanceAfter === 'number') {
            window.dispatchEvent(new CustomEvent('tradeup:balance-updated', { detail: { balance: data.data.balanceAfter } }));
          }
        }
      } else {
        dispatch(updateOrderStatus({ id: optimisticId, status: 'FAILED' }));
        onWarning(data?.message || 'Order failed. Please add funds and try again.');
      }
    } catch (err) {
      // Backend not reachable - for limit orders, keep as PENDING and let monitor handle execution
      if (parsedLimit !== null) {
        // Limit order: keep as PENDING, let useLimitOrderMonitor handle execution
        onWarning('Backend unreachable. Limit order will execute when price crosses limit.');
      } else {
        // Market order: execute immediately
        dispatch(executeOrderLocally({
          id: optimisticId,
          executedPrice: 0, // Market order fallback
        }));
        onWarning('Backend unreachable. Market order simulated locally.');
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <TerminalButton
        variant={isBuy ? 'buy' : 'sell'}
        onClick={handlePlace}
        sx={{ minHeight: '32px', width: '100%', flexDirection: 'column', gap: '1px' }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700 }}>{optionType} {transactionType}</span>
        <span style={{ fontSize: '9px', opacity: 0.8 }}>{t.lots}L · {qty} qty</span>
      </TerminalButton>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <Typography sx={{ fontSize: '10px', color: '#9ca3af', whiteSpace: 'nowrap' }}>Lmt</Typography>
        <Input
          value={limitValue}
          onChange={(e) => setLimit(e.target.value)}
          placeholder="MKT"
          size="sm"
          sx={{
            flex: 1, fontSize: '11px', '--Input-minHeight': '22px',
            '& input': { padding: '2px 5px' },
          }}
        />
      </Box>
    </Box>
  );
};

const OrderPanel: React.FC = () => {
  const [warning, setWarning] = useState<string | null>(null);

  return (
    <Box sx={{ p: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', mb: '6px' }}>
        <OrderButton optionType="CE" transactionType="BUY" onWarning={setWarning} />
        <OrderButton optionType="PE" transactionType="BUY" onWarning={setWarning} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <OrderButton optionType="CE" transactionType="SELL" onWarning={setWarning} />
        <OrderButton optionType="PE" transactionType="SELL" onWarning={setWarning} />
      </Box>
      {warning && (
        <Box sx={{
          mt: '6px',
          px: '8px',
          py: '4px',
          borderRadius: '6px',
          border: '1px solid #fde68a',
          bgcolor: '#fffbeb',
          color: '#92400e',
          fontSize: '10px',
          fontWeight: 600,
        }}>
          {warning}
        </Box>
      )}
    </Box>
  );
};

export default OrderPanel;