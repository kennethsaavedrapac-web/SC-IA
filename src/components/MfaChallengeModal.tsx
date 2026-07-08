import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, AlertTriangle, ArrowRight, Loader2, X } from 'lucide-react';
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
  const [errorMsg, setErrorMsg] = useState('');

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
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Introduce el código de 6 dígitos generado por tu aplicación autenticadora (Google Authenticator / Authy).
              </p>
            </div>

            <div className="space-y-1">
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
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
