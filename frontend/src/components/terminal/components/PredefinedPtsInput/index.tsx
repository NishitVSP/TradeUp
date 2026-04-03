import React, { useState } from 'react';
import { Box, Input, Typography } from '@mui/joy';
import { TerminalLabel } from '../../styled';

interface PredefinedPtsInputProps {
  type: 'PDTGT' | 'PDSL' | 'PDTRAIL' | 'MTMTRAIL';
}

const PredefinedPtsInput: React.FC<PredefinedPtsInputProps> = ({ type }) => {
  const [value, setValue] = useState('');

  const getLabel = () => {
    switch (type) {
      case 'PDTGT':
        return 'PD TGT';
      case 'PDSL':
        return 'PD SL';
      case 'PDTRAIL':
        return 'PD Trail';
      case 'MTMTRAIL':
        return 'MTM Trail';
      default:
        return type;
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'PDTGT':
        return 'Target pts';
      case 'PDSL':
        return 'Stop loss pts';
      case 'PDTRAIL':
        return 'Trail pts';
      case 'MTMTRAIL':
        return 'MTM Trail';
      default:
        return 'Points';
    }
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <TerminalLabel>{getLabel()}</TerminalLabel>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={getPlaceholder()}
        size="sm"
        sx={{ 
          fontSize: '11px',
          width: '100%',
          '--Input-minHeight': '28px'
        }}
      />
    </Box>
  );
};

export default PredefinedPtsInput;
