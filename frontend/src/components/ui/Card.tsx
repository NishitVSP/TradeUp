import { Card as MuiCard, CardProps } from '@mui/material';
import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface CustomCardProps extends CardProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

export function Card({ title, subtitle, children, sx, ...props }: CustomCardProps) {
  return (
    <MuiCard
      {...props}
      sx={{
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(0, 0, 0, 0.12)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
        },
        ...sx,
      }}
    >
      {title && (
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <Typography variant="h6" component="h3" sx={{ mb: 1, fontWeight: 600 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    </MuiCard>
  );
}