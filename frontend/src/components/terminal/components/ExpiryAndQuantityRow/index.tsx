import React from 'react';
import { Box, Select, Option } from '@mui/joy';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setActiveExpiry, setLots, stepLots, LOT_SIZES } from '@/store/slices/terminalSlice';
import { TerminalRow, TerminalLabel } from '../../styled';
import StepperInput from '../StepperInput';

const ExpiryAndQuantityRow: React.FC = () => {
  const dispatch = useDispatch();
  const { lots, activeIndexName, activeExpiry, indexExpiries } = useSelector((s: RootState) => s.terminal);

  const expiries = indexExpiries[activeIndexName] ?? [];
  const lotSize  = LOT_SIZES[activeIndexName] ?? 1;
  const totalQty = lots * lotSize;

  return (
    <TerminalRow sx={{ gap: '6px' }}>
      {/* Expiry dropdown - list built from what was added for this index */}
      <Box sx={{ flex: 1.6, minWidth: 0 }}>
        <TerminalLabel>Expiry</TerminalLabel>
        {expiries.length > 0 ? (
          <Select
            value={activeExpiry || expiries[0]}
            onChange={(_, v) => v && dispatch(setActiveExpiry(v))}
            size="sm"
            sx={{ width: '100%', fontSize: '11px', fontWeight: 600 }}
          >
            {expiries.map((e, i) => (
              <Option key={e} value={e} sx={{ fontSize: '11px' }}>
                {e}{i === 0 ? ' ★' : ''}
              </Option>
            ))}
          </Select>
        ) : (
          <Box sx={{
            fontSize: '10px', color: '#9ca3af', px: '8px', py: '5px',
            border: '1px solid #e5e7eb', borderRadius: '6px', bgcolor: '#f9fafb',
          }}>
            Add contract first
          </Box>
        )}
      </Box>

      {/* Lots stepper */}
      <Box sx={{ flex: 0.8, minWidth: 0 }}>
        <TerminalLabel>Lots</TerminalLabel>
        <StepperInput
          value={lots}
          onChange={(v) => { const n = parseInt(v, 10); if (!isNaN(n) && n > 0) dispatch(setLots(n)); }}
          onStep={(dir) => dispatch(stepLots(dir))}
        />
      </Box>

      {/* Qty badge */}
      <Box sx={{ flex: 0.8, minWidth: 0 }}>
        <TerminalLabel>Qty</TerminalLabel>
        <Box sx={{
          fontSize: '11px', fontWeight: 700, color: '#10b981', px: '8px', py: '4px',
          bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', textAlign: 'center',
        }}>
          {totalQty}
        </Box>
      </Box>

      {/* Lot size badge */}
      <Box sx={{ flex: 0.6, minWidth: 0 }}>
        <TerminalLabel>Lot sz</TerminalLabel>
        <Box sx={{
          fontSize: '11px', fontWeight: 600, color: '#6b7280', px: '6px', py: '4px',
          bgcolor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', textAlign: 'center',
        }}>
          {lotSize}
        </Box>
      </Box>
    </TerminalRow>
  );
};

export default ExpiryAndQuantityRow;