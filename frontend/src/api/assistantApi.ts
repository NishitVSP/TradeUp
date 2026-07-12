import type { AssistantReply, ConfirmOrderResult, OrderProposal } from '@/types/assistant';

const API_BASE = 'http://localhost:3001';

function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

/**
 * POST /api/assistant/chat
 * history = prior turns only (text-only role/content pairs), NOT including
 * the message currently being sent.
 */
export async function sendAssistantMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<AssistantReply> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message, history }),
    });
    const data = await res.json();

    if (!data.success) {
      return { type: 'text', text: data.message || 'Something went wrong.' };
    }
    return data.data as AssistantReply;
  } catch {
    return { type: 'text', text: 'Network error. Please try again.' };
  }
}

/**
 * POST /api/assistant/confirm-order
 * Only place where an assistant-originated order actually executes.
 */
export async function confirmAssistantOrder(proposal: OrderProposal): Promise<ConfirmOrderResult> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/assistant/confirm-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(proposal),
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Network error placing the order.' };
  }
}