import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, AlertTriangle, KeyRound } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { createMFAChallenge, verifyMFAChallenge } from '../lib/mfaService';
import { validateTOTPCode } from '../lib/security';
import { motion } from 'motion/react';

interface TwoFactorVerifyProps {
  factorId: string;
  onVerified: () => void;
  onCancel: () => void;
}

/**
 * TwoFactorVerify — Modal de verificación 2FA post-login.
 * 
 * Aparece después de un login exitoso cuando el usuario tiene MFA activo
 * y su nivel de aseguramiento es AAL1 (necesita elevarse a AAL2).
 */
export default function TwoFactorVerify({ factorId, onVerified, onCancel }: TwoFactorVerifyProps) {
  const { t } = useLanguage();

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(true);

  const MAX_ATTEMPTS = 5;

  // Crear challenge al montar
  useEffect(() => {
    const initChallenge = async () => {
      setIsCreatingChallenge(true);
      const result = await createMFAChallenge(factorId);
      if (result.success && result.challengeId) {
        setChallengeId(result.challengeId);
      } else {
        setCodeError(result.error || t('mfaChallengeError'));
      }
      setIsCreatingChallenge(false);
    };

    initChallenge();
  }, [factorId, t]);

  // Verificar código
  const handleVerify = async () => {
    if (!validateTOTPCode(code)) {
      setCodeError(t('mfaCodeInvalid'));
      return;
    }

    if (attempts >= MAX_ATTEMPTS) {
      setCodeError(t('mfaMaxAttempts'));
      return;
    }

    setIsVerifying(true);
    setCodeError('');

    const result = await verifyMFAChallenge(factorId, challengeId, code);
    setIsVerifying(false);

    if (result.success) {
      onVerified();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setCode('');

      if (newAttempts >= MAX_ATTEMPTS) {
        setCodeError(t('mfaMaxAttempts'));
      } else {
        setCodeError(
          result.error || t('mfaVerifyError')
        );
      }

      // Crear nuevo challenge después de fallo
      const newChallenge = await createMFAChallenge(factorId);
      if (newChallenge.success && newChallenge.challengeId) {
        setChallengeId(newChallenge.challengeId);
      }
    }
  };

  const isBlocked = attempts >= MAX_ATTEMPTS;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6 select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-center">
          <div className="w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-7 h-7 text-brand-600 dark:text-brand-400" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            {t('mfaVerifyTitle')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-normal">
            {t('mfaVerifyDesc')}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {isCreatingChallenge ? (
            <div className="flex flex-col items-center py-6">
              <Loader2 className="w-6 h-6 text-brand-600 animate-spin mb-3" />
              <span className="text-xs text-slate-500">{t('mfaPreparing')}</span>
            </div>
          ) : (
            <>
              {/* Input de código */}
              <div className="space-y-2">
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
                    if (e.key === 'Enter' && code.length === 6 && !isBlocked) {
                      handleVerify();
                    }
                  }}
                  placeholder="000000"
                  disabled={isBlocked || isVerifying}
                  className={`w-full text-center text-3xl font-mono tracking-[0.5em] py-4 px-4 rounded-2xl border-2 ${
                    codeError
                      ? 'border-red-500 dark:border-red-500/70'
                      : 'border-slate-200 dark:border-slate-700 focus:border-brand-600'
                  } bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-[4px] focus:ring-brand-100/50 dark:focus:ring-brand-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  autoFocus
                />

                {codeError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/15 rounded-xl border border-red-100 dark:border-red-900/30">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-600 dark:text-red-400 text-[11px] font-semibold leading-snug">
                      {codeError}
                    </p>
                  </div>
                )}

                {attempts > 0 && !isBlocked && (
                  <p className="text-[10px] text-slate-400 text-center">
                    {t('mfaAttemptsRemaining')}: {MAX_ATTEMPTS - attempts}
                  </p>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
                >
                  {t('mfaCancelLogin')}
                </button>
                <button
                  onClick={handleVerify}
                  disabled={code.length !== 6 || isVerifying || isBlocked}
                  className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  {t('mfaVerifyBtn')}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
