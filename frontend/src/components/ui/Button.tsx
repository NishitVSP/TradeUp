import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { ReactNode } from 'react';

interface CustomButtonProps extends Omit<MuiButtonProps, 'variant' | 'color'> {
  variant?: 'primary' | 'secondary' | 'outlined';
  fullWidth?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  children,
  sx,
  ...props
}: CustomButtonProps) {
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #ef4444 100%)',
          color: 'white',
          border: 'none',
          '&:hover': {
            background: 'linear-gradient(135deg, #059669 0%, #dc2626 100%)',
          },
        };
      case 'secondary':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #10b981 100%)',
          color: 'white',
          border: 'none',
          '&:hover': {
            background: 'linear-gradient(135deg, #dc2626 0%, #059669 100%)',
          },
        };
      case 'outlined':
        return {
          background: 'transparent',
          color: '#10b981',
          border: '2px solid #10b981',
          '&:hover': {
            background: '#10b981',
            color: 'white',
          },
        };
      default:
        return {};
    }
  };

  return (
    <MuiButton
      {...props}
      fullWidth={fullWidth}
      sx={{
        py: 1.5,
        px: 3,
        fontWeight: 600,
        borderRadius: 2,
        textTransform: 'none',
        ...getButtonStyles(),
        ...sx,
      }}
    >
      {children}
    </MuiButton>
  );
}