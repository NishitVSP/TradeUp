import React from 'react';
import { Box, Typography } from '@mui/joy';
import { TerminalButton } from '../../styled';

interface CloseAllButtonProps {
  id: string;
  text: string;
  shortcutKey: string;
}

const CloseAllButton: React.FC<CloseAllButtonProps> = ({ id, text, shortcutKey }) => {
  const handleClick = () => {
    // TODO: Implement close all functionality
    console.log(`Closing all ${text.toLowerCase()}...`);
  };

  return (
    <TerminalButton
      variant="sell"
      onClick={handleClick}
      sx={{ 
        flex: 1, 
        minHeight: '32px',
        backgroundColor: '#f59e0b',
        '&:hover': {
          backgroundColor: '#d97706',
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
        <Typography sx={{ fontSize: '11px', fontWeight: 600, lineHeight: 1 }}>
          {text}
        </Typography>
        <Typography sx={{ fontSize: '9px', opacity: 0.8, lineHeight: 1 }}>
          ({shortcutKey})
        </Typography>
      </Box>
    </TerminalButton>
  );
};

export default CloseAllButton;
