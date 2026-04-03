import { useCallback, useRef } from 'react';

/**
 * Returns a `playBeep()` function.
 * Place beepNotificationSound.mp3 in /public/sounds/beepNotificationSound.mp3
 */
export function useBeepSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playBeep = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('../../public/beepNotificationSound.mp3');
        audioRef.current.volume = 0.5;
      }
      // Rewind and play — handles rapid repeated clicks cleanly
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Autoplay blocked before user interaction — silently ignore
      });
    } catch {
      // Audio API not available (SSR or test env)
    }
  }, []);

  return playBeep;
}