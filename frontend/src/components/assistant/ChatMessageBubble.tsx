'use client';

import { Box } from '@mui/material';
import type { ChatMessage } from '@/types/assistant';
import { OrderProposalCard } from './OrderProposalCard';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <Box sx={{ maxWidth: '85%' }}>
        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontFamily: '"DM Sans", sans-serif',
            lineHeight: 1.4,
            bgcolor: isUser ? '#10b981' : '#f1f5f9',
            color: isUser ? '#ffffff' : '#1e293b',
          }}
        >
          {message.content}
        </Box>

        {message.orderProposal && (
          <OrderProposalCard
            messageId={message.id}
            proposal={message.orderProposal}
            status={message.orderStatus ?? 'pending'}
          />
        )}
      </Box>
    </Box>
  );
}