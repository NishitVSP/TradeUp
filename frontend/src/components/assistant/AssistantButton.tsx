'use client';

import { forwardRef } from 'react';
import { Box } from '@mui/material';
import { MessageCircle } from 'lucide-react';

interface AssistantButtonProps {
  onClick: () => void;
  active?: boolean;
}

/**
 * Small square trigger for the assistant — icon + "AI" label, sized to sit
 * beside the TradeUp logo in UserInfo's header without adding bulk. Colors
 * match the "secondary" Button variant used elsewhere (e.g. "Add to
 * Terminal" in OptionSelector) for visual consistency across the app.
 */
export const AssistantButton = forwardRef<HTMLButtonElement, AssistantButtonProps>(
  ({ onClick, active }, ref) => (
    <Box
      component="button"
      ref={ref}
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        width: 40,
        height: 40,
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        flexShrink: 0,
        color: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        transition: 'background 0.15s ease',
        background: active
          ? 'linear-gradient(135deg, #dc2626 0%, #059669 100%)'
          : 'linear-gradient(135deg, #ef4444 0%, #10b981 100%)',
        '&:hover': {
          background: 'linear-gradient(135deg, #dc2626 0%, #059669 100%)',
        },
      }}
    >
      <MessageCircle size={14} />
      <Box
        component="span"
        sx={{
          fontSize: '7px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          fontFamily: '"DM Sans", sans-serif',
          lineHeight: 1,
        }}
      >
        AI
      </Box>
    </Box>
  )
);

AssistantButton.displayName = 'AssistantButton';