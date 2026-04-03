import React from 'react';
import { Box, Typography } from '@mui/joy';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { closeAllPositions, cancelAllOrders } from '@/store/slices/terminalSlice';
import { TerminalButton } from '../../styled';
import { useBeepSound } from '@/hooks/useBeepSound';

const CloseAllRow: React.FC = () => {
  const dispatch = useDispatch();
  const playBeep = useBeepSound();
  const { positions, orders } = useSelector((s: RootState) => s.terminal);

  const openPositions  = positions.filter((p) => p.status === 'OPEN').length;
  const pendingOrders  = orders.filter((o) => o.status === 'PENDING').length;

  const handleClosePositions = () => {
    if (openPositions === 0) return;
    playBeep();
    dispatch(closeAllPositions());
  };

  const handleCancelOrders = () => {
    if (pendingOrders === 0) return;
    playBeep();
    dispatch(cancelAllOrders());
  };

  return (
    <Box sx={{ display: 'flex', gap: '6px', p: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
      <TerminalButton
        variant="warning"
        onClick={handleClosePositions}
        sx={{
          flex: 1, minHeight: '34px', flexDirection: 'column', gap: '1px',
          opacity: openPositions === 0 ? 0.45 : 1,
        }}
      >
        <Typography sx={{ fontSize: '11px', fontWeight: 700, lineHeight: 1, color: 'white' }}>
          CLOSE POSITIONS
        </Typography>
        <Typography sx={{ fontSize: '9px', opacity: 0.85, lineHeight: 1, color: 'white' }}>
          {openPositions > 0 ? `${openPositions} open  ·  Z` : 'None open  ·  Z'}
        </Typography>
      </TerminalButton>

      <TerminalButton
        variant="sell"
        onClick={handleCancelOrders}
        sx={{
          flex: 1, minHeight: '34px', flexDirection: 'column', gap: '1px',
          opacity: pendingOrders === 0 ? 0.45 : 1,
        }}
      >
        <Typography sx={{ fontSize: '11px', fontWeight: 700, lineHeight: 1, color: 'white' }}>
          CANCEL ORDERS
        </Typography>
        <Typography sx={{ fontSize: '9px', opacity: 0.85, lineHeight: 1, color: 'white' }}>
          {pendingOrders > 0 ? `${pendingOrders} pending  ·  X` : 'None pending  ·  X'}
        </Typography>
      </TerminalButton>
    </Box>
  );
};

export default CloseAllRow;