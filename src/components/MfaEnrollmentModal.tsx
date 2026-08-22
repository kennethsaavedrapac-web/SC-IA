import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Copy, Check, X, AlertTriangle, Key, Download, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createToast, type ToastData } from './Toast';

interface MfaEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onToast?: (toast: ToastData) => void;
}

export default function MfaEnrollmentModal({
  isOpen,
  onClose,
  onSuccess,
  onToast,
}: MfaEnrollmentModalProps) {
  const { session, refreshProfile } = useAuth();

  const [step, setStep] = useState<'generate' | 'verify' | 'backup_codes'>('generate');
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Generar nuevo secreto y QR
  const handleGenerateMfa = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = session?.access_token;
      const res = await fetch('/api/auth/2fa/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error generando credenciales 2FA.');
      }

      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
      setStep('verify');
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo conectar con el servicio 2FA.');
      onToast?.(createToast(err.message || 'Error al generar 2FA', 'error'));
    } finally {
      setLoading(false);
    }
  };

  // 2. Verificar código de 6 dígitos para activar MFA
  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.trim().length !== 6) {
      setErrorMsg('Ingresa un código de 6 dígitos numéricos.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const token = session?.access_token;
      const res = await fetch('/api/auth/2fa/verify-and-enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          token: totpCode.trim(),
          secret,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Código incorrecto o expirado.');
      }

      setBackupCodes(data.backupCodes || []);
      setStep('backup_codes');
      await refreshProfile();
      onToast?.(createToast('¡Autenticación de 2 Factores activada con éxito!', 'success'));
    } catch (err: any) {
      setErrorMsg(err.message || 'Código de verificación inválido.');
      onToast?.(createToast(err.message || 'Código inválido', 'error'));
    } finally {
      setLoading(false);
    }
  };

  // Copiar secreto
  const copyToClipboard = (text: string, type: 'secret' | 'codes') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  // Descargar códigos de respaldo
  const downloadBackupCodes = () => {
    const content = `SALUD-CONECTA IA - CÓDIGOS DE RESPALDO 2FA / MFA\nFecha: ${new Date().toLocaleString()}\n\n` +
      backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
      '\n\nGuarda estos códigos en un lugar seguro. Cada código solo puede usarse una vez.';
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'salud-conecta-codigos-respaldo-2fa.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFinish = () => {
    onSuccess?.();
    onClose();
    setStep('generate');
    setTotpCode('');
    setSecret('');
    setQrCodeUrl('');
    setBackupCodes([]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">Autenticación de 2 Factores (2FA)</h3>
                <p className="text-xs text-slate-500">Protección TOTP para personal de salud y administradores</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Step 1: Initial Intro */}
          {step === 'generate' && (
            <div className="py-6 space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                <Key className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Refuerza la seguridad de tu cuenta</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Vincula tu aplicación autenticadora (Google Authenticator, Authy o Microsoft Authenticator) para solicitar un token de 6 dígitos cada vez que inicies sesión.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 flex items-center gap-2 text-left">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                onClick={handleGenerateMfa}
                disabled={loading}
                className="w-full mt-4 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Comenzar configuración 2FA
              </button>
            </div>
          )}

          {/* Content Step 2: QR Code & Verification */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyMfa} className="py-4 space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[11px] font-bold tracking-wider uppercase text-brand-600">Paso 1: Escanear Código QR</span>
                <p className="text-xs text-slate-500">Abre tu app autenticadora y escanea el código siguiente:</p>
              </div>

              <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR 2FA" className="w-44 h-44 rounded-xl shadow-sm bg-white p-2" />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                  </div>
                )}

                <div className="mt-3 w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="min-w-0 text-left">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Clave manual:</span>
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">{secret}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(secret, 'secret')}
                    className="p-1.5 text-slate-500 hover:text-brand-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Copiar clave"
                  >
                    {copiedSecret ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                  Paso 2: Código de 6 dígitos
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full py-2.5 px-4 text-center font-mono text-xl tracking-widest font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                  autoFocus
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 flex items-center gap-2 text-left">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('generate')}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={loading || totpCode.length !== 6}
                  className="flex-2 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Verificar y Activar
                </button>
              </div>
            </form>
          )}

          {/* Content Step 3: Backup Codes */}
          {step === 'backup_codes' && (
            <div className="py-4 space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">¡2FA activado correctamente!</h4>
                <p className="text-xs text-slate-500">
                  Guarda estos códigos de recuperación en caso de que pierdas acceso a tu app autenticadora.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-center">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(backupCodes.join('\n'), 'codes')}
                  className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCodes ? 'Copiados' : 'Copiar códigos'}
                </button>
                <button
                  type="button"
                  onClick={downloadBackupCodes}
                  className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar .txt
                </button>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md"
              >
                Completar y Cerrar
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
