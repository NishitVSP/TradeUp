'use client';

import { Box, IconButton, Typography } from '@mui/material';
import { Check, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store/store';
import { confirmOrder, cancelOrderProposal } from '@/store/slices/assistantSlice';
import type { OrderProposal, OrderProposalStatus } from '@/types/assistant';

interface OrderProposalCardProps {
  messageId: string;
  proposal: OrderProposal;
  status: OrderProposalStatus;
}

const STATUS_LABEL: Record<Exclude<OrderProposalStatus, 'pending'>, string> = {
  confirmed: 'Placing order…',
  cancelled: 'Cancelled',
  failed: 'Failed — see message above',
};

const STATUS_COLOR: Record<Exclude<OrderProposalStatus, 'pending'>, string> = {
  confirmed: '#10b981',
  cancelled: '#94a3b8',
  failed: '#ef4444',
};

export function OrderProposalCard({ messageId, proposal, status }: OrderProposalCardProps) {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <Box sx={{ mt: 0.75, p: 1.1, borderRadius: '10px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
      <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mb: 0.6, fontFamily: '"DM Sans", sans-serif' }}>
        {proposal.action} {proposal.lots} lot(s) · {proposal.indexName} {proposal.strikePrice} {proposal.optionType} ·{' '}
        {proposal.expiryDate} · {proposal.orderType}
        {proposal.limitPrice ? ` @ ₹${proposal.limitPrice}` : ''}
      </Typography>

      {status === 'pending' ? (
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          <IconButton
            size="small"
            onClick={() => dispatch(confirmOrder({ messageId, proposal }))}
            sx={{ width: 26, height: 26, bgcolor: '#10b981', color: '#fff', '&:hover': { bgcolor: '#059669' } }}
          >
            <Check size={13} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => dispatch(cancelOrderProposal(messageId))}
            sx={{ width: 26, height: 26, bgcolor: '#f1f5f9', color: '#64748b', '&:hover': { bgcolor: '#e2e8f0' } }}
          >
            <X size={13} />
          </IconButton>
        </Box>
      ) : (
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: STATUS_COLOR[status] }}>
          {STATUS_LABEL[status]}
        </Typography>
      )}
    </Box>
  );
}