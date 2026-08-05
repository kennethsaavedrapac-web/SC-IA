import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  enrollMFA,
  verifyAndActivateMFA,
  getMFAFactors,
  unenrollMFA,
  type MFAFactor,
} from '../lib/mfaService';
import { validateTOTPCode } from '../lib/security';

interface TwoFactorSetupProps {
  userId: string;
  onStatusChange?: (enabled: boolean) => void;
}

/**
 * TwoFactorSetup — Componente para activar/desactivar 2FA desde el perfil.
 * Se integra dentro de la sección "seguridad" del PerfilView.
 */
export default function TwoFactorSetup({ userId, onStatusChange }: TwoFactorSetupProps) {
  const { t } = useLanguage();

  // Estado
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'idle' | 'enrolling' | 'verifying' | 'disabling'>('idle');

  // Enrolamiento
  const [qrUri, setQrUri] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');

  // Verificación
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  // Estado derivado
  const verifiedFactor = factors.find((f) => f.status === 'verified');
  const isEnabled = !!verifiedFactor;

  // ─── Cargar factores al montar ─────────────────────────────────
  const loadFactors = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMFAFactors();
      setFactors(result.factors);
    } catch {
      // Silently fail — UI will show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId && userId !== 'guest') {
      loadFactors();
    } else {
      setLoading(false);
    }
  }, [userId, loadFactors]);

  // ─── Iniciar enrolamiento ──────────────────────────────────────
  const handleStartEnroll = async () => {
    setStep('enrolling');
    setCode('');
    setCodeError('');

    const result = await enrollMFA('Salud-Conecta IA');
    if (result.success && result.qrUri && result.factorId) {
      setQrUri(result.qrUri);
      setSecret(result.secret || '');
      setFactorId(result.factorId);
      setStep('verifying');
    } else {
      setCodeError(result.error || t('mfaEnrollError'));
      setStep('idle');
    }
  };

  // ─── Verificar código TOTP ─────────────────────────────────────
  const handleVerifyCode = async () => {
    if (!validateTOTPCode(code)) {
      setCodeError(t('mfaCodeInvalid'));
      return;
    }

    setIsVerifying(true);
    setCodeError('');

    const result = await verifyAndActivateMFA(factorId, code);
    setIsVerifying(false);

    if (result.success) {
      await loadFactors();
      setStep('idle');
      setQrUri('');
      setSecret('');
      setCode('');
      onStatusChange?.(true);
    } else {
      setCodeError(result.error || t('mfaVerifyError'));
    }
  };

  // ─── Desactivar MFA ────────────────────────────────────────────
  const handleDisable = async () => {
    if (!verifiedFactor) return;
    setStep('disabling');

    const result = await unenrollMFA(verifiedFactor.id);
    if (result.success) {
      await loadFactors();
      setStep('idle');
      onStatusChange?.(false);
    } else {
      setCodeError(result.error || t('mfaDisableError'));
      setStep('idle');
    }
  };

  // ─── Copiar secreto ────────────────────────────────────────────
  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      // Fallback silencioso
    }
  };

  // ─── Cancelar enrolamiento ─────────────────────────────────────
  const handleCancel = () => {
    setStep('idle');
    setQrUri('');
    setSecret('');
    setCode('');
    setCodeError('');
  };

  // ─── Renderizado ───────────────────────────────────────────────

  if (userId === 'guest' || !userId) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          {t('mfaGuestNotice')}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estado actual */}
      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
        isEnabled
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
      }`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isEnabled
            ? 'bg-emerald-100 dark:bg-emerald-800/40'
            : 'bg-slate-100 dark:bg-slate-700/50'
        }`}>
          {isEnabled ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Shield className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">
            {t('mfaTitle')}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {isEnabled ? t('mfaEnabled') : t('mfaDisabled')}
          </p>
        </div>
      </div>

      {/* Acción: Activar o Desactivar */}
      {step === 'idle' && (
        <>
          {isEnabled ? (
            <button
              onClick={() => setStep('disabling')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-800 font-bold text-xs transition-all active:scale-[0.98]"
            >
              <ShieldOff className="w-4 h-4" />
              {t('mfaDeactivate')}
            </button>
          ) : (
            <button
              onClick={handleStartEnroll}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs transition-all active:scale-[0.98] shadow-sm"
            >
              <Shield className="w-4 h-4" />
              {t('mfaActivate')}
            </button>
          )}
        </>
      )}

      {/* Paso: Verificación del QR */}
      {step === 'verifying' && qrUri && (
        <div className="space-y-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="text-center">
            <h5 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
              {t('mfaScanQR')}
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              {t('mfaScanQRDesc')}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <QRCodeSVG value={qrUri} size={180} level="M" />
            </div>
          </div>

          {/* Clave manual */}
          {secret && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
              <code className="flex-1 text-[10px] font-mono text-slate-600 dark:text-slate-300 break-all select-all">
                {secret}
              </code>
              <button
                onClick={handleCopySecret}
                className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors shrink-0"
                title={t('mfaCopySecret')}
              >
                {secretCopied ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {/* Input de código */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {t('mfaEnterCode')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(val);
                if (val) setCodeError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && code.length === 6) {
                  handleVerifyCode();
                }
              }}
              placeholder="000000"
              className={`w-full text-center text-2xl font-mono tracking-[0.5em] py-3 px-4 rounded-xl border ${
                codeError
                  ? 'border-red-500 dark:border-red-500/70 focus:ring-red-500'
                  : 'border-slate-200 dark:border-slate-600 focus:border-brand-600 focus:ring-brand-100/50 dark:focus:ring-brand-600/30'
              } bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-[4px] transition-all`}
              autoFocus
            />
            {codeError && (
              <p className="text-red-500 text-[11px] font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {codeError}
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-bold text-xs transition-all"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleVerifyCode}
              disabled={code.length !== 6 || isVerifying}
              className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              {t('mfaVerify')}
            </button>
          </div>
        </div>
      )}

      {/* Paso: Confirmación de desactivación */}
      {step === 'disabling' && (
        <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-bold text-red-800 dark:text-red-300">
                {t('mfaConfirmDisable')}
              </h5>
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 leading-normal">
                {t('mfaConfirmDisableDesc')}
              </p>
            </div>
          </div>

          {codeError && (
            <p className="text-red-500 text-[11px] font-semibold">{codeError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setStep('idle'); setCodeError(''); }}
              className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-600 transition-all"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleDisable}
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <ShieldOff className="w-4 h-4" />
              {t('mfaConfirmDisableBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
