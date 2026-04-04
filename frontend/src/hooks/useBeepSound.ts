import { useCallback, useRef } from 'react';

/**
 * Returns a `playBeep()` function.
 * File lives at: frontend/public/beepNotificationSound.mp3
 * Next.js serves public/ at the root, so the URL is just /beepNotificationSound.mp3
 */
export function useBeepSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playBeep = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/beepNotificationSound.mp3');
        audioRef.current.volume = 0.5;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Blocked before first user interaction — silently ignore
      });
    } catch {
      // SSR / test environment — no Audio API
    }
  }, []);

  return playBeep;
}