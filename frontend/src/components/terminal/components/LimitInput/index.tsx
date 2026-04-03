import React, { useState } from 'react';
import { Box, Input, Typography } from '@mui/joy';
import { TerminalButton, TerminalLabel } from '../../styled';

interface LimitInputProps {
  buttonKey: string;
  optionType: 'CE' | 'PE';
  transactionType: 'BUY' | 'SELL';
}

const LimitInput: React.FC<LimitInputProps> = ({ buttonKey, optionType, transactionType }) => {
  const [limitPrice, setLimitPrice] = useState('');
  const [isLimit, setIsLimit] = useState(false);

  const getButtonColor = () => {
    if (transactionType === 'BUY') return 'buy';
    return 'sell';
  };

  const getButtonText = () => {
    const action = transactionType === 'BUY' ? 'BUY' : 'SELL';
    return `${optionType} ${action}`;
  };

  const handleButtonClick = () => {
    // TODO: Implement order placement logic
    console.log(`Placing ${transactionType} order for ${optionType} at limit: ${limitPrice}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
      <TerminalButton
        variant={getButtonColor()}
        onClick={handleButtonClick}
        sx={{ flex: 1, minHeight: '40px' }}
      >
        {getButtonText()}
      </TerminalButton>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography
          level="body-xs"
          sx={{ fontSize: '10px', color: '#6b7280', minWidth: '30px' }}
        >
          Limit:
        </Typography>
        <Input
          value={limitPrice}
          onChange={(e) => setLimitPrice(e.target.value)}
          placeholder="Price"
          size="sm"
          sx={{ 
            fontSize: '11px', 
            flex: 1,
            '--Input-minHeight': '24px'
          }}
        />
      </Box>
    </Box>
  );
};

export default LimitInput;
