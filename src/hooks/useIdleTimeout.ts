import { useEffect, useRef, useState, useCallback } from 'react';
import { crossTabSync } from '../lib/sessionService';

export interface UseIdleTimeoutOptions {
  /**
   * Tiempo de inactividad permitido antes de cerrar sesión (en milisegundos).
   * Por defecto: 15 minutos (900,000 ms).
   */
  timeoutMs?: number;
  /**
   * Umbral de advertencia previo al cierre de sesión (en milisegundos).
   * Por defecto: 60 segundos (60,000 ms).
   */
  warningThresholdMs?: number;
  /**
   * Si está activo el monitoreo de inactividad (útil para solo activarlo con usuario logueado).
   */
  enabled?: boolean;
  /**
   * Callback invocado al expirar el tiempo de inactividad.
   */
  onTimeout: () => void;
  /**
   * Callback invocado al entrar en el periodo de advertencia.
   */
  onWarning?: (remainingSeconds: number) => void;
}

export interface UseIdleTimeoutReturn {
  isIdle: boolean;
  isWarning: boolean;
  remainingSeconds: number;
  resetTimer: () => void;
  extendSession: () => void;
}

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos
const DEFAULT_WARNING_MS = 60 * 1000; // 1 minuto de advertencia

export function useIdleTimeout({
  timeoutMs = DEFAULT_TIMEOUT_MS,
  warningThresholdMs = DEFAULT_WARNING_MS,
  enabled = true,
  onTimeout,
  onWarning,
}: UseIdleTimeoutOptions): UseIdleTimeoutReturn {
  const [isIdle, setIsIdle] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(Math.floor(timeoutMs / 1000));

  const lastActivityRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<number | null>(null);
  const throttleTimeoutRef = useRef<number | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  const onWarningRef = useRef(onWarning);

  // Mantener referencias actualizadas de los callbacks
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
    onWarningRef.current = onWarning;
  }, [onTimeout, onWarning]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsIdle(false);
    setIsWarning(false);
    setRemainingSeconds(Math.floor(timeoutMs / 1000));
    crossTabSync.notifyActivity();
  }, [timeoutMs]);

  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled) {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    lastActivityRef.current = Date.now();
    setIsIdle(false);
    setIsWarning(false);

    // Manejador throttled para eventos de interacción de usuario (máximo 1 vez cada 1000ms)
    const handleUserActivity = () => {
      if (throttleTimeoutRef.current !== null) return;

      throttleTimeoutRef.current = window.setTimeout(() => {
        throttleTimeoutRef.current = null;
      }, 1000);

      lastActivityRef.current = Date.now();
      setIsIdle(false);
      setIsWarning(false);
      crossTabSync.notifyActivity();
    };

    // Sincronización entre pestañas
    const unsubscribeCrossTab = crossTabSync.onMessage((msg) => {
      if (msg.type === 'USER_ACTIVITY') {
        lastActivityRef.current = msg.timestamp || Date.now();
        setIsIdle(false);
        setIsWarning(false);
      } else if (msg.type === 'FORCE_LOGOUT' && msg.reason === 'idle_timeout') {
        setIsIdle(true);
        onTimeoutRef.current();
      }
    });

    // Eventos globales a monitorear en window
    const windowEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'wheel',
    ];

    windowEvents.forEach((eventType) => {
      window.addEventListener(eventType, handleUserActivity, { passive: true });
    });

    // Evento de visibilidad en document
    document.addEventListener('visibilitychange', handleUserActivity, { passive: true });

    // Intervalo de evaluación de tiempo transcurrido (cada 1 segundo)
    timerIntervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const remaining = Math.max(0, timeoutMs - elapsed);
      const remainingSec = Math.ceil(remaining / 1000);

      setRemainingSeconds(remainingSec);

      // Evaluar advertencia
      if (remaining <= warningThresholdMs && remaining > 0) {
        setIsWarning(true);
        onWarningRef.current?.(remainingSec);
      } else if (remaining > warningThresholdMs) {
        setIsWarning(false);
      }

      // Evaluar timeout
      if (remaining <= 0) {
        if (timerIntervalRef.current) {
          window.clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setIsIdle(true);
        crossTabSync.notifyLogout('idle_timeout');
        onTimeoutRef.current();
      }
    }, 1000);

    // Limpieza de todos los listeners e intervalos al desmontar el hook
    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (throttleTimeoutRef.current) {
        window.clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
      }
      windowEvents.forEach((eventType) => {
        window.removeEventListener(eventType, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleUserActivity);
      unsubscribeCrossTab();
    };
  }, [enabled, timeoutMs, warningThresholdMs]);

  return {
    isIdle,
    isWarning,
    remainingSeconds,
    resetTimer,
    extendSession,
  };
}
