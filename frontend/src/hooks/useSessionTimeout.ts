import { useEffect, useRef, useCallback } from 'react';

/**
 * useSessionTimeout — Hook de expiración automática de sesión por inactividad.
 *
 * Detecta actividad del usuario (mouse, teclado, touch, scroll).
 * Tras `timeoutMs` de inactividad, ejecuta `onTimeout`.
 * Muestra un aviso previo `warningMs` milisegundos antes de expirar.
 *
 * @param onTimeout  — Callback al expirar la sesión (ej: logout + redirect)
 * @param onWarning  — Callback de advertencia previa (ej: mostrar toast)
 * @param enabled    — Si es false, el hook se desactiva (ej: usuario invitado)
 * @param timeoutMs  — Tiempo de inactividad total en ms (default: 30 min)
 * @param warningMs  — Tiempo antes de expirar para mostrar aviso (default: 2 min)
 */
export function useSessionTimeout(
  onTimeout: () => void,
  onWarning: () => void,
  enabled: boolean = true,
  timeoutMs: number = 30 * 60 * 1000,
  warningMs: number = 2 * 60 * 1000
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningFiredRef = useRef(false);

  // Refs estables para los callbacks
  const onTimeoutRef = useRef(onTimeout);
  const onWarningRef = useRef(onWarning);
  onTimeoutRef.current = onTimeout;
  onWarningRef.current = onWarning;

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const resetTimers = useCallback(() => {
    clearTimers();
    warningFiredRef.current = false;

    // Timer de advertencia: se dispara (timeoutMs - warningMs) después de la última actividad
    const warningDelay = Math.max(timeoutMs - warningMs, 0);
    warningRef.current = setTimeout(() => {
      warningFiredRef.current = true;
      onWarningRef.current();
    }, warningDelay);

    // Timer de expiración: se dispara después de timeoutMs de inactividad
    timeoutRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, timeoutMs);
  }, [clearTimers, timeoutMs, warningMs]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    // Eventos de actividad del usuario
    const activityEvents: (keyof WindowEventMap)[] = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => {
      resetTimers();
    };

    // Registrar listeners con passive para no bloquear scroll
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Iniciar timers al montar
    resetTimers();

    return () => {
      clearTimers();
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, resetTimers, clearTimers]);
}
