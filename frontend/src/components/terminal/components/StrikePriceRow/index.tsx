import React from 'react';
import { Box, Select, Option, Typography } from '@mui/joy';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setCeStrike, setPeStrike, stepCeStrike, stepPeStrike } from '@/store/slices/terminalSlice';
import { TerminalRow, TerminalLabel } from '../../styled';
import StepperInput from '../StepperInput';

const StrikeColumn: React.FC<{
  side: 'CE' | 'PE';
  strike: number | null;
  ltp: number | null;
  strikes: number[];
  onSelect: (v: number) => void;
  onStep: (dir: 1 | -1) => void;
}> = ({ side, strike, ltp, strikes, onSelect, onStep }) => {
  const isCe = side === 'CE';
  const ltpColor  = isCe ? '#10b981' : '#ef4444';
  const ltpBg     = isCe ? '#f0fdf4' : '#fef2f2';
  const ltpBorder = isCe ? '#bbf7d0' : '#fecaca';

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {/* Label + LTP badge */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TerminalLabel>{side} Strike</TerminalLabel>
        <Typography sx={{
          fontSize: '10px', fontWeight: 700, color: ltpColor,
          px: '5px', py: '1px', bgcolor: ltpBg,
          borderRadius: '4px', border: `1px solid ${ltpBorder}`,
        }}>
          {ltp !== null ? ltp.toFixed(2) : '—'}
        </Typography>
      </Box>

      {/* Stepper — no typing allowed */}
      <StepperInput
        value={strike ?? (strikes[Math.floor(strikes.length / 2)] ?? '—')}
        onChange={() => { /* read-only */ }}
        onStep={onStep}
        allowTyping={false}
      />

      {/* Dropdown for picking any added strike */}
      {strikes.length > 0 && (
        <Select
          value={strike ?? strikes[Math.floor(strikes.length / 2)]}
          onChange={(_, v) => v !== null && onSelect(v as number)}
          size="sm"
          sx={{ fontSize: '10px', '--Select-minHeight': '22px' }}
        >
          {strikes.map((s) => (
            <Option key={s} value={s} sx={{ fontSize: '10px' }}>{s}</Option>
          ))}
        </Select>
      )}

      {strikes.length === 0 && (
        <Box sx={{
          fontSize: '10px', color: '#9ca3af', px: '8px', py: '4px',
          border: '1px solid #e5e7eb', borderRadius: '6px', bgcolor: '#f9fafb', textAlign: 'center',
        }}>
          Add contract first
        </Box>
      )}
    </Box>
  );
};

const StrikePriceRow: React.FC = () => {
  const dispatch = useDispatch();
  const { ceStrike, peStrike, ceLtp, peLtp, activeIndexName, indexSelectedStrikes } = useSelector(
    (s: RootState) => s.terminal
  );

  // Only strikes the user explicitly selected via OptionSelector
  const strikes = indexSelectedStrikes[activeIndexName] ?? [];

  return (
    <TerminalRow sx={{ gap: '6px', alignItems: 'flex-start', py: '6px' }}>
      <StrikeColumn
        side="CE"
        strike={ceStrike}
        ltp={ceLtp}
        strikes={strikes}
        onSelect={(v) => dispatch(setCeStrike(v))}
        onStep={(dir) => dispatch(stepCeStrike(dir))}
      />

      {/* Divider */}
      <Box sx={{ width: '1px', bgcolor: '#f0f0f0', alignSelf: 'stretch', mx: '2px', mt: '18px' }} />

      <StrikeColumn
        side="PE"
        strike={peStrike}
        ltp={peLtp}
        strikes={strikes}
        onSelect={(v) => dispatch(setPeStrike(v))}
        onStep={(dir) => dispatch(stepPeStrike(dir))}
      />
    </TerminalRow>
  );
};

export default StrikePriceRow;