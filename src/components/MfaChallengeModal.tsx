import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, AlertTriangle, ArrowRight, Loader2, X, Mail, Smartphone, CheckCircle, RefreshCw } from 'lucide-react';
import { createToast, type ToastData } from './Toast';

interface MfaChallengeModalProps {
  isOpen: boolean;
  tempToken: string;
  onClose: () => void;
  onSuccess: (sessionData: any) => void;
  onToast?: (toast: ToastData) => void;
}

export default function MfaChallengeModal({
  isOpen,
  tempToken,
  onClose,
  onSuccess,
  onToast,
}: MfaChallengeModalProps) {
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let timer: any;
    if (cooldownTimer > 0) {
      timer = setInterval(() => {
        setCooldownTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownTimer]);

  const handleSendEmailCode = async () => {
    if (cooldownTimer > 0 || sendingEmail) return;

    setSendingEmail(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/2fa/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar código');
      }

      setEmailSent(true);
      setCooldownTimer(60);
      onToast?.(createToast(data.message || 'Código enviado a tu correo', 'success'));
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo enviar el correo. Intenta de nuevo.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.trim().length !== 6) {
      setErrorMsg('Ingresa el código numérico de 6 dígitos.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/2fa/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken,
          totpCode: totpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Código 2FA incorrecto o expirado.');
      }

      onToast?.(createToast('Autenticación de dos factores confirmada', 'success'));
      onSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Código de verificación 2FA no válido.');
      onToast?.(createToast(err.message || 'Error en código 2FA', 'error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 relative"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Verificación de 2 Factores</h3>
                <p className="text-[11px] text-slate-500">Paso de seguridad adicional</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
              <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Smartphone className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Google Authenticator / App:</strong> Abre tu app en el teléfono para ver tu código de 6 dígitos (cambia cada 30 seg).
                </p>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700">
                <span className="text-[11px] text-slate-500">
                  {cooldownTimer > 0 ? `Reenviar en ${cooldownTimer}s` : '¿No tienes acceso a la app?'}
                </span>
                <button
                  type="button"
                  onClick={handleSendEmailCode}
                  disabled={sendingEmail || cooldownTimer > 0}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 disabled:opacity-50 disabled:no-underline"
                >
                  {sendingEmail ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : cooldownTimer > 0 ? (
                    <RefreshCw className="w-3 h-3 text-slate-400 animate-pulse" />
                  ) : emailSent ? (
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Mail className="w-3 h-3" />
                  )}
                  {cooldownTimer > 0
                    ? `Reenviar código (${cooldownTimer}s)`
                    : emailSent
                    ? 'Reenviar a mi correo'
                    : 'Enviar a mi correo'}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="0 0 0 0 0 0"
                className="w-full py-3 px-4 text-center font-mono text-2xl tracking-[0.3em] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                autoFocus
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Validar y Acceder
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
