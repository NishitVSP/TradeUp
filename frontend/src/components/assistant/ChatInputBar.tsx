'use client';

import { useState } from 'react';
import { Box, IconButton, TextField } from '@mui/material';
import { Send } from 'lucide-react';

interface ChatInputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <Box sx={{ p: 1, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 0.75 }}>
      <TextField
        size="small"
        fullWidth
        placeholder="Ask or place a trade…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSend();
        }}
        sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
      />
      <IconButton
        onClick={handleSend}
        disabled={disabled}
        sx={{ bgcolor: '#10b981', color: '#fff', '&:hover': { bgcolor: '#059669' }, width: 34, height: 34 }}
      >
        <Send size={15} />
      </IconButton>
    </Box>
  );
}