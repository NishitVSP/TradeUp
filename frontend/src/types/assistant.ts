export interface OrderProposal {
  indexName: string;
  strikePrice: number;
  expiryDate: string;
  optionType: 'CE' | 'PE';
  action: 'BUY' | 'SELL';
  orderType: 'MKT' | 'LMT';
  lots: number;
  lotSize: number;
  limitPrice?: number;
  summary: string;
}

export type OrderProposalStatus = 'pending' | 'confirmed' | 'cancelled' | 'failed';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  orderProposal?: OrderProposal;
  orderStatus?: OrderProposalStatus;
}

/** Shape returned by POST /api/assistant/chat */
export interface AssistantReply {
  type: 'text' | 'order_proposal';
  text?: string;
  orderProposal?: OrderProposal;
}

/** Shape returned by POST /api/assistant/confirm-order */
export interface ConfirmOrderResult {
  success: boolean;
  message: string;
  data?: { balanceAfter?: number; [key: string]: unknown };
}