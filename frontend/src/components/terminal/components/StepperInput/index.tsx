import React from 'react';
import { Box, Input } from '@mui/joy';

interface StepperInputProps {
  value: number | string;
  onChange: (v: string) => void;
  onStep: (dir: 1 | -1) => void;
  placeholder?: string;
  width?: string | number;
  textAlign?: 'left' | 'center' | 'right';
}

const StepperInput: React.FC<StepperInputProps> = ({
  value, onChange, onStep, placeholder = '', width = '100%', textAlign = 'center',
}) => (
  <Box sx={{ display: 'flex', alignItems: 'stretch', width, border: '1px solid #d1d5db',
    borderRadius: '6px', overflow: 'hidden', bgcolor: 'white' }}>
    {/* Down */}
    <Box
      onClick={() => onStep(-1)}
      sx={{
        width: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: '#f9fafb', borderRight: '1px solid #e5e7eb',
        cursor: 'pointer', userSelect: 'none', fontSize: '13px', color: '#6b7280',
        flexShrink: 0,
        '&:hover': { bgcolor: '#f0f0f0', color: '#374151' },
        '&:active': { bgcolor: '#e5e7eb' },
      }}
    >
      ‹
    </Box>

    {/* Input */}
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      size="sm"
      sx={{
        flex: 1, fontSize: '11px', fontWeight: 600, border: 'none',
        borderRadius: 0, '--Input-focusedHighlight': 'transparent',
        '--Input-minHeight': '26px',
        boxShadow: 'none',
        '& input': { textAlign, padding: '2px 4px' },
        '&:before': { display: 'none' },
        '&:focus-within': { outline: 'none' },
      }}
    />

    {/* Up */}
    <Box
      onClick={() => onStep(1)}
      sx={{
        width: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: '#f9fafb', borderLeft: '1px solid #e5e7eb',
        cursor: 'pointer', userSelect: 'none', fontSize: '13px', color: '#6b7280',
        flexShrink: 0,
        '&:hover': { bgcolor: '#f0f0f0', color: '#374151' },
        '&:active': { bgcolor: '#e5e7eb' },
      }}
    >
      ›
    </Box>
  </Box>
);

export default StepperInput;