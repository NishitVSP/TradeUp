import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/store';
import { sendAssistantMessage, confirmAssistantOrder } from '@/api/assistantApi';
import { addExternalPosition } from './terminalSlice';
import type { ChatMessage, OrderProposal, OrderProposalStatus } from '@/types/assistant';

interface AssistantState {
  isOpen: boolean;
  messages: ChatMessage[];
  sending: boolean;
}

function generateId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hi! Ask me about options concepts, or tell me a trade — e.g. "buy 2 lots NIFTY ATM CE".',
};

const initialState: AssistantState = {
  isOpen: false,
  messages: [WELCOME_MESSAGE],
  sending: false,
};

// ── Slice ────────────────────────────────────────────────────────────────────

const assistantSlice = createSlice({
  name: 'assistant',
  initialState,
  reducers: {
    toggleAssistant: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeAssistant: (state) => {
      state.isOpen = false;
    },
    pushUserMessage: (state, action: PayloadAction<string>) => {
      state.messages.push({ id: generateId(), role: 'user', content: action.payload });
    },
    pushAssistantText: (state, action: PayloadAction<string>) => {
      state.messages.push({ id: generateId(), role: 'assistant', content: action.payload });
    },
    pushOrderProposal: (state, action: PayloadAction<{ text: string; proposal: OrderProposal }>) => {
      state.messages.push({
        id: generateId(),
        role: 'assistant',
        content: action.payload.text,
        orderProposal: action.payload.proposal,
        orderStatus: 'pending',
      });
    },
    setOrderStatus: (state, action: PayloadAction<{ id: string; status: OrderProposalStatus }>) => {
      const msg = state.messages.find((m) => m.id === action.payload.id);
      if (msg) msg.orderStatus = action.payload.status;
    },
    cancelOrderProposal: (state, action: PayloadAction<string>) => {
      const msg = state.messages.find((m) => m.id === action.payload);
      if (msg) msg.orderStatus = 'cancelled';
    },
    setSending: (state, action: PayloadAction<boolean>) => {
      state.sending = action.payload;
    },
  },
});

export const {
  toggleAssistant,
  closeAssistant,
  pushUserMessage,
  pushAssistantText,
  pushOrderProposal,
  setOrderStatus,
  cancelOrderProposal,
  setSending,
} = assistantSlice.actions;

export default assistantSlice.reducer;

// ── Thunks ───────────────────────────────────────────────────────────────────

/**
 * Sends a user message to the assistant and pushes back either a text reply
 * or an order proposal. History sent to the backend excludes the welcome
 * message and the message being sent right now.
 */
export const sendMessage = createAsyncThunk<void, string, { state: RootState }>(
  'assistant/sendMessage',
  async (userText, { dispatch, getState }) => {
    const history = getState()
      .assistant.messages.filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    dispatch(pushUserMessage(userText));
    dispatch(setSending(true));

    try {
      const reply = await sendAssistantMessage(userText, history);

      if (reply.type === 'order_proposal' && reply.orderProposal) {
        dispatch(
          pushOrderProposal({
            text: reply.text || reply.orderProposal.summary,
            proposal: reply.orderProposal,
          })
        );
      } else {
        dispatch(pushAssistantText(reply.text || "Sorry, I couldn't process that."));
      }
    } finally {
      dispatch(setSending(false));
    }
  }
);

/**
 * Confirms a proposed order — the ONLY path where an assistant-originated
 * order actually touches money. On success, broadcasts the same
 * 'tradeup:balance-updated' event the rest of the app already listens for,
 * so the UserInfo balance updates immediately without a page refresh.
 */
export const confirmOrder = createAsyncThunk<
  void,
  { messageId: string; proposal: OrderProposal },
  { state: RootState }
>('assistant/confirmOrder', async ({ messageId, proposal }, { dispatch }) => {
  dispatch(setOrderStatus({ id: messageId, status: 'confirmed' }));

  const result = await confirmAssistantOrder(proposal);

  if (result.success) {
    dispatch(pushAssistantText(result.message));
    const balanceAfter = result.data?.balanceAfter;
    if (typeof balanceAfter === 'number' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tradeup:balance-updated', { detail: { balance: balanceAfter } }));
    }

    // Mirror the executed trade into terminal.positions — the ONLY state
    // <Positions /> renders from. orderService.executeOrder() (confirmed via
    // orderService.ts) returns executionPrice/quantity/status for MKT orders;
    // LMT orders come back with status 'PENDING' and no executionPrice since
    // they haven't filled yet — so we only add a position once it's actually
    // EXECUTED. proposal.lotSize/lots are used as-is (not re-derived from a
    // frontend lot-size table) since they're exactly what orderService used
    // server-side to compute quantity and debit the balance.
    if (result.data?.status === 'EXECUTED' && typeof result.data?.executionPrice === 'number') {
      const quantity =
        typeof result.data.quantity === 'number' ? result.data.quantity : proposal.lots * proposal.lotSize;

      dispatch(
        addExternalPosition({
          indexName: proposal.indexName,
          strikePrice: proposal.strikePrice,
          expiryDate: proposal.expiryDate,
          optionType: proposal.optionType,
          side: proposal.action,
          lots: proposal.lots,
          quantity,
          lotSize: proposal.lotSize,
          executedPrice: result.data.executionPrice,
        })
      );
    }
  } else {
    dispatch(setOrderStatus({ id: messageId, status: 'failed' }));
    dispatch(pushAssistantText(`Order failed: ${result.message}`));
  }
});