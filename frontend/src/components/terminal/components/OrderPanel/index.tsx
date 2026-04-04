import React from 'react';
import { Box, Input, Typography } from '@mui/joy';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  setCeBuyLimit, setCeSellLimit,
  setPeBuyLimit, setPeSellLimit,
  placeOrder,
  LOT_SIZES,
} from '@/store/slices/terminalSlice';
import { TerminalButton } from '../../styled';
import { useBeepSound } from '@/hooks/useBeepSound';

interface OrderButtonProps {
  optionType: 'CE' | 'PE';
  transactionType: 'BUY' | 'SELL';
}

const OrderButton: React.FC<OrderButtonProps> = ({ optionType, transactionType }) => {
  const dispatch = useDispatch();
  const playBeep = useBeepSound();
  const t = useSelector((s: RootState) => s.terminal);

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
  const ltp     = optionType === 'CE' ? t.ceLtp    : t.peLtp;
  const isBuy   = transactionType === 'BUY';
  const lotSize = LOT_SIZES[t.activeIndexName] ?? 1;
  const qty     = t.lots * lotSize;

  const handlePlace = () => {
    if (!strike) return;
    playBeep();
    const parsedLimit = limitValue !== '' ? parseFloat(limitValue) : null;
    dispatch(placeOrder({
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
      targetPts:  t.pdTarget !== '' ? parseFloat(t.pdTarget) : null,
      slPts:      t.pdSL    !== '' ? parseFloat(t.pdSL)    : null,
      trailPts:   t.pdTrail !== '' ? parseFloat(t.pdTrail) : null,
    }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {ltp !== null && (
        <Typography sx={{
          fontSize: '9px', color: isBuy ? '#10b981' : '#ef4444',
          textAlign: 'center', fontWeight: 600
        }}>
          LTP {ltp.toFixed(2)}
        </Typography>
      )}
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
          sx={{ flex: 1, fontSize: '11px', '--Input-minHeight': '22px',
            '& input': { padding: '2px 5px' } }}
        />
      </Box>
    </Box>
  );
};

const OrderPanel: React.FC = () => (
  <Box sx={{ p: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', mb: '4px', px: '2px' }}>
      {['CE', 'PE'].map((t) => (
        <Box key={t} sx={{
          textAlign: 'center', fontSize: '10px', fontWeight: 700,
          color: t === 'CE' ? '#10b981' : '#ef4444', letterSpacing: '0.8px'
        }}>{t}</Box>
      ))}
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', mb: '6px' }}>
      <OrderButton optionType="CE" transactionType="BUY" />
      <OrderButton optionType="PE" transactionType="BUY" />
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
      <OrderButton optionType="CE" transactionType="SELL" />
      <OrderButton optionType="PE" transactionType="SELL" />
    </Box>
  </Box>
);

export default OrderPanel;