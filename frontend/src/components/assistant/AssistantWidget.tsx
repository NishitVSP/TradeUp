'use client';

import { useRef } from 'react';
import { Popover } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { toggleAssistant, closeAssistant } from '@/store/slices/assistantSlice';
import { AssistantButton } from './AssistantButton';
import { AssistantPanel } from './AssistantPanel';

/**
 * The only thing that renders inline in UserInfo is the small round button.
 * The chat itself renders in a Popover (React portal to document.body), so
 * it floats above the dashboard instead of being squeezed into — or clipped
 * by — the narrow UserInfo column.
 */
export function AssistantWidget() {
  const dispatch = useDispatch<AppDispatch>();
  const isOpen = useSelector((s: RootState) => s.assistant.isOpen);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <AssistantButton ref={anchorRef} active={isOpen} onClick={() => dispatch(toggleAssistant())} />
      <Popover
        open={isOpen}
        anchorEl={anchorRef.current}
        onClose={() => dispatch(closeAssistant())}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
              border: '1px solid #e2e8f0',
            },
          },
        }}
      >
        <AssistantPanel />
      </Popover>
    </>
  );
}