import React from 'react';
import { Box, Input } from '@mui/joy';

interface StepperInputProps {
  value: number | string;
  onChange: (v: string) => void;
  onStep: (dir: 1 | -1) => void;
  placeholder?: string;
  width?: string | number;
  textAlign?: 'left' | 'center' | 'right';
  /** If true, user can type in the input. If false, input is read-only (for strikes). */
  allowTyping?: boolean;
}

const StepperInput: React.FC<StepperInputProps> = ({
  value,
  onChange,
  onStep,
  placeholder = '',
  width = '100%',
  textAlign = 'center',
  allowTyping = false,
}) => (
  <Box sx={{
    display: 'flex', alignItems: 'stretch', width,
    border: '1px solid #d1d5db', borderRadius: '6px',
    overflow: 'hidden', bgcolor: 'white',
  }}>
    {/* Decrement */}
    <Box
      onClick={() => onStep(-1)}
      sx={{
        width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: '#f9fafb', borderRight: '1px solid #e5e7eb',
        cursor: 'pointer', userSelect: 'none', fontSize: '15px', color: '#6b7280',
        flexShrink: 0, fontWeight: 700,
        '&:hover': { bgcolor: '#e5e7eb', color: '#374151' },
        '&:active': { bgcolor: '#d1d5db' },
      }}
    >
      −
    </Box>

    {/* Input — read-only for strikes, writable for lots */}
    <Input
      value={value}
      onChange={allowTyping ? (e) => onChange(e.target.value) : undefined}
      readOnly={!allowTyping}
      placeholder={placeholder}
      size="sm"
      sx={{
        flex: 1,
        fontSize: '11px',
        fontWeight: 600,
        border: 'none',
        borderRadius: 0,
        '--Input-focusedHighlight': 'transparent',
        '--Input-minHeight': '26px',
        boxShadow: 'none',
        bgcolor: allowTyping ? 'white' : '#f9fafb',
        cursor: allowTyping ? 'text' : 'default',
        '& input': {
          textAlign,
          padding: '2px 4px',
          cursor: allowTyping ? 'text' : 'default',
        },
        '&:before': { display: 'none' },
        '&:focus-within': { outline: 'none' },
      }}
    />

    {/* Increment */}
    <Box
      onClick={() => onStep(1)}
      sx={{
        width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: '#f9fafb', borderLeft: '1px solid #e5e7eb',
        cursor: 'pointer', userSelect: 'none', fontSize: '15px', color: '#6b7280',
        flexShrink: 0, fontWeight: 700,
        '&:hover': { bgcolor: '#e5e7eb', color: '#374151' },
        '&:active': { bgcolor: '#d1d5db' },
      }}
    >
      +
    </Box>
  </Box>
);

export default StepperInput;