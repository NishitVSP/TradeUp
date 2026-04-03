import React from 'react';
import { Box, Select, Option, Typography } from '@mui/joy';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setCeStrike, setPeStrike, stepCeStrike, stepPeStrike } from '@/store/slices/terminalSlice';
import { TerminalRow, TerminalLabel } from '../../styled';
import StepperInput from '../StepperInput';

const StrikePriceRow: React.FC = () => {
  const dispatch = useDispatch();
  const { ceStrike, peStrike, ceLtp, peLtp, activeIndexName, indexStrikes } = useSelector(
    (s: RootState) => s.terminal
  );

  const strikes = indexStrikes[activeIndexName] ?? [];

  return (
    <TerminalRow sx={{ gap: '6px' }}>
      {/* ── CE side ── */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TerminalLabel>CE Strike</TerminalLabel>
          <Typography sx={{
            fontSize: '10px', fontWeight: 700, color: '#10b981',
            px: '6px', py: '1px', bgcolor: '#f0fdf4',
            borderRadius: '4px', border: '1px solid #bbf7d0',
          }}>
            {ceLtp !== null ? ceLtp.toFixed(2) : '—'}
          </Typography>
        </Box>

        {strikes.length > 0 ? (
          <StepperInput
            value={ceStrike ?? ''}
            onChange={(v) => { const n = parseInt(v, 10); if (!isNaN(n)) dispatch(setCeStrike(n)); }}
            onStep={(dir) => dispatch(stepCeStrike(dir))}
          />
        ) : (
          /* Fallback if no contracts added yet - allow manual entry */
          <StepperInput
            value={ceStrike ?? ''}
            onChange={(v) => { const n = parseInt(v, 10); if (!isNaN(n)) dispatch(setCeStrike(n)); }}
            onStep={(dir) => {
              const step = 50;
              dispatch(setCeStrike((ceStrike ?? 24000) + dir * step));
            }}
          />
        )}

        {/* Strike dropdown (click to pick from full list) */}
        {strikes.length > 0 && (
          <Select
            value={ceStrike ?? strikes[Math.floor(strikes.length / 2)]}
            onChange={(_, v) => v !== null && dispatch(setCeStrike(v as number))}
            size="sm"
            sx={{ fontSize: '10px', '--Select-minHeight': '22px' }}
          >
            {strikes.map((s) => (
              <Option key={s} value={s} sx={{ fontSize: '10px' }}>{s}</Option>
            ))}
          </Select>
        )}
      </Box>

      {/* Divider */}
      <Box sx={{ width: '1px', bgcolor: '#f0f0f0', alignSelf: 'stretch', mx: '2px' }} />

      {/* ── PE side ── */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TerminalLabel>PE Strike</TerminalLabel>
          <Typography sx={{
            fontSize: '10px', fontWeight: 700, color: '#ef4444',
            px: '6px', py: '1px', bgcolor: '#fef2f2',
            borderRadius: '4px', border: '1px solid #fecaca',
          }}>
            {peLtp !== null ? peLtp.toFixed(2) : '—'}
          </Typography>
        </Box>

        {strikes.length > 0 ? (
          <StepperInput
            value={peStrike ?? ''}
            onChange={(v) => { const n = parseInt(v, 10); if (!isNaN(n)) dispatch(setPeStrike(n)); }}
            onStep={(dir) => dispatch(stepPeStrike(dir))}
          />
        ) : (
          <StepperInput
            value={peStrike ?? ''}
            onChange={(v) => { const n = parseInt(v, 10); if (!isNaN(n)) dispatch(setPeStrike(n)); }}
            onStep={(dir) => {
              const step = 50;
              dispatch(setPeStrike((peStrike ?? 24000) + dir * step));
            }}
          />
        )}

        {strikes.length > 0 && (
          <Select
            value={peStrike ?? strikes[Math.floor(strikes.length / 2)]}
            onChange={(_, v) => v !== null && dispatch(setPeStrike(v as number))}
            size="sm"
            sx={{ fontSize: '10px', '--Select-minHeight': '22px' }}
          >
            {strikes.map((s) => (
              <Option key={s} value={s} sx={{ fontSize: '10px' }}>{s}</Option>
            ))}
          </Select>
        )}
      </Box>
    </TerminalRow>
  );
};

export default StrikePriceRow;