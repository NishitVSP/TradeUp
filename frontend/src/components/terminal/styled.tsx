import { Box, styled } from '@mui/joy';

export const TerminalRow = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  padding: '4px 8px',
  gap: '6px',
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #f0f0f0',
  minHeight: '36px',
}));

export const TerminalContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#ffffff',
  overflow: 'hidden',
}));

export const TerminalSection = styled(Box)(() => ({
  padding: '6px 8px',
  borderBottom: '1px solid #f0f0f0',
}));

export const TerminalButton = styled(Box)<{ variant?: 'buy' | 'sell' | 'warning' }>(
  ({ variant = 'buy' }) => ({
    backgroundColor:
      variant === 'buy' ? '#10b981' : variant === 'sell' ? '#ef4444' : '#f59e0b',
    color: 'white',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    textAlign: 'center',
    cursor: 'pointer',
    border: 'none',
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    transition: 'background-color 0.15s ease',
    '&:hover': {
      backgroundColor:
        variant === 'buy' ? '#059669' : variant === 'sell' ? '#dc2626' : '#d97706',
    },
    '&:active': {
      transform: 'scale(0.97)',
    },
  })
);

export const TerminalLabel = styled(Box)(() => ({
  fontSize: '10px',
  fontWeight: 600,
  color: '#9ca3af',
  marginBottom: '2px',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
}));