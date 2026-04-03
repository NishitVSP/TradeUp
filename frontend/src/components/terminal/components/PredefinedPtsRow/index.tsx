import React from 'react';
import { Box, Input, Tooltip, Typography } from '@mui/joy';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  setPdTarget,
  setPdSL,
  setPdTrail,
  setMtmTrail,
} from '@/store/slices/terminalSlice';
import { TerminalLabel } from '../../styled';

interface FieldConfig {
  key: 'pdTarget' | 'pdSL' | 'pdTrail' | 'mtmTrail';
  label: string;
  placeholder: string;
  tooltip: string;
  color: string;
}

const FIELDS: FieldConfig[] = [
  {
    key: 'pdTarget',
    label: 'PD TGT',
    placeholder: 'Pts',
    tooltip: 'Predefined target in points — auto-exits when profit hits this level',
    color: '#10b981',
  },
  {
    key: 'pdSL',
    label: 'PD SL',
    placeholder: 'Pts',
    tooltip: 'Predefined stop-loss in points — auto-exits when loss hits this level',
    color: '#ef4444',
  },
  {
    key: 'pdTrail',
    label: 'PD Trail',
    placeholder: 'Pts',
    tooltip: 'Trailing stop-loss per position in points — trails the best achieved price',
    color: '#f59e0b',
  },
  {
    key: 'mtmTrail',
    label: 'MTM Trail',
    placeholder: 'Pts',
    tooltip: 'Mark-to-market trailing stop — based on combined PnL of all open positions',
    color: '#6366f1',
  },
];

const PredefinedPtsRow: React.FC = () => {
  const dispatch = useDispatch();
  const terminal = useSelector((s: RootState) => s.terminal);

  const setters = {
    pdTarget: setPdTarget,
    pdSL: setPdSL,
    pdTrail: setPdTrail,
    mtmTrail: setMtmTrail,
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        p: '6px 8px',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      {FIELDS.map(({ key, label, placeholder, tooltip, color }) => (
        <Tooltip key={key} title={tooltip} placement="top" size="sm">
          <Box sx={{ minWidth: 0 }}>
            <TerminalLabel sx={{ color }}>{label}</TerminalLabel>
            <Input
              value={terminal[key]}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, '');
                dispatch(setters[key](v));
              }}
              placeholder={placeholder}
              size="sm"
              sx={{
                fontSize: '11px',
                width: '100%',
                '--Input-minHeight': '28px',
                '& input': { padding: '3px 6px', textAlign: 'center' },
                '&:focus-within': {
                  outline: `2px solid ${color}40`,
                  borderColor: color,
                },
              }}
            />
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
};

export default PredefinedPtsRow;