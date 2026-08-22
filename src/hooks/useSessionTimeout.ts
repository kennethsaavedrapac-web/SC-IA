import { useEffect, useRef, useCallback, useState } from 'react';

interface UseSessionTimeoutOptions {
  timeoutMs: number;
  warningThresholdMs: number;
  enabled: boolean;
  onTimeout: () => void;
  onWarning: (remainingSeconds: number) => void;
}

export function useSessionTimeout({
  timeoutMs,
  warningThresholdMs,
  enabled,
  onTimeout,
  onWarning
}: UseSessionTimeoutOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [remainingSeconds, setRemainingSeconds] = useState(warningThresholdMs / 1000);
  
  const onTimeoutRef = useRef(onTimeout);
  const onWarningRef = useRef(onWarning);
  
  onTimeoutRef.current = onTimeout;
  onWarningRef.current = onWarning;

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    warningRef.current = null;
    intervalRef.current = null;
  }, []);

  const extendSession = useCallback(() => {
    clearTimers();
    setRemainingSeconds(warningThresholdMs / 1000);

    const warningDelay = Math.max(timeoutMs - warningThresholdMs, 0);
    warningRef.current = setTimeout(() => {
      onWarningRef.current(warningThresholdMs / 1000);
      
      let secondsLeft = warningThresholdMs / 1000;
      setRemainingSeconds(secondsLeft);
      intervalRef.current = setInterval(() => {
        secondsLeft -= 1;
        setRemainingSeconds(secondsLeft > 0 ? secondsLeft : 0);
        if (secondsLeft <= 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }, 1000);
      
    }, warningDelay);

    timeoutRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, timeoutMs);
  }, [clearTimers, timeoutMs, warningThresholdMs]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    const activityEvents: (keyof WindowEventMap)[] = [
      'mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'
    ];

    const handleActivity = () => {
      // Only extend if we aren't already in warning phase.
      // Wait, extending during warning phase should dismiss it! 
      // But App.tsx manually calls extendSession when dismissing.
      // Let's just always extend on activity if we want, or throttle it.
      // We will throttle activity updates to avoid calling setTimeout constantly.
      if (!intervalRef.current) {
         extendSession();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    extendSession();

    return () => {
      clearTimers();
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, extendSession, clearTimers]);

  return { extendSession, remainingSeconds };
}
