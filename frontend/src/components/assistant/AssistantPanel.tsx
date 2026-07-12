'use client';

import { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { sendMessage } from '@/store/slices/assistantSlice';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatInputBar } from './ChatInputBar';

export function AssistantPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, sending } = useSelector((s: RootState) => s.assistant);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  return (
    <Box
      sx={{
        width: 340,
        height: 440,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 1.5, py: 1.1, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
          TradeUp Assistant
        </Typography>
      </Box>

      <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', p: 1.25, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {messages.map((m) => (
          <ChatMessageBubble key={m.id} message={m} />
        ))}
        {sending && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', px: 0.5 }}>
            <CircularProgress size={14} sx={{ color: '#10b981' }} />
          </Box>
        )}
      </Box>

      <ChatInputBar disabled={sending} onSend={(text) => dispatch(sendMessage(text))} />
    </Box>
  );
}