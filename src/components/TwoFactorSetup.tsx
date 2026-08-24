import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Loader2,
  Copy,
  CheckCircle,
  AlertTriangle,
  Mail,
  Smartphone,
  RefreshCw,
  QrCode,
  Key,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  enrollMFA,
  verifyAndActivateMFA,
  getMFAFactors,
  unenrollMFA,
  unenrollMFAWithVerification,
  cleanUnverifiedFactors,
  type MFAFactor,
} from '../lib/mfaService';
import { validateTOTPCode } from '../lib/security';

export type AuthProviderType = 'google' | 'google.com' | 'password' | 'email' | string;

export interface UserSecurityProfile {
  id: string;
  email?: string;
  isEmailVerified?: boolean;
  phone?: string;
  isPhoneVerified?: boolean;
  provider?: AuthProviderType;
}

interface TwoFactorSetupProps {
  userId: string;
  userProfile?: UserSecurityProfile;
  onStatusChange?: (enabled: boolean) => void;
  onNavigateToPersonalInfo?: () => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

/**
 * TwoFactorSetup — Componente universal de activación y administración de 2FA (TOTP).
 * Permite a todos los usuarios (Google OAuth y Correo/Contraseña) configurar
 * una capa extra de seguridad con aplicaciones de autenticación (Google Authenticator, Authy, etc.).
 */
export default function TwoFactorSetup({
  userId,
  userProfile,
  onStatusChange,
  onShowToast,
}: TwoFactorSetupProps) {
  const { t } = useLanguage();
  const { user: authUser } = useAuth();

  // Estados de carga y flujo
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'enrolling' | 'verifying' | 'disabling'>('idle');

  // Estados de enrolamiento y verificación
  const [qrUri, setQrUri] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [secretCopied, setSecretCopied] = useState(false);

  // Estados de código por email (fallback opcional)
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(0);

  // Feedback y mensajes inline
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Temporizador para reenvío de código por correo
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (cooldownTimer > 0) {
      timer = setInterval(() => {
        setCooldownTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownTimer]);

  // ─── Factores Activos ──────────────────────────────────────────────────────
  const verifiedFactor = useMemo(() => {
    return factors.find((f) => f.status === 'verified');
  }, [factors]);

  const is2FAEnabled = Boolean(verifiedFactor);

  // Helper para feedback unificado
  const notify = useCallback((text: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setFeedbackMessage({ type: type === 'warning' ? 'error' : type, text });
    onShowToast?.(text, type);
  }, [onShowToast]);

  // ─── Cargar factores al montar y limpiar huérfanos ──────────────────────────
  const loadFactors = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      // 1. Limpieza preventiva de factores huérfanos/no verificados
      await cleanUnverifiedFactors();

      // 2. Consulta de factores registrados
      const factorsList = await getMFAFactors();
      setFactors(Array.isArray(factorsList) ? factorsList : []);
    } catch {
      // Silencioso en carga inicial
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId && userId !== 'guest') {
      loadFactors();
    } else {
      setIsInitialLoading(false);
    }
  }, [userId, loadFactors]);

  // ─── Enviar código por correo (Opción de Respaldo) ───────────────────────────
  const handleSendEmailCode = async () => {
    if (cooldownTimer > 0 || sendingEmail) return;

    setSendingEmail(true);
    setCodeError('');
    try {
      const res = await fetch('/api/auth/2fa/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar el código por correo.');
      }

      setEmailSent(true);
      setCooldownTimer(60);
      notify('Código enviado a tu dirección de correo electrónico.', 'info');
    } catch (err: any) {
      const errorText = err.message || 'No se pudo enviar el correo de verificación.';
      setCodeError(errorText);
      notify(errorText, 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // ─── Iniciar Enrolamiento con Código QR ─────────────────────────────────────
  const handleStartEnroll = async () => {
    setIsActionLoading(true);
    setCode('');
    setCodeError('');
    setFeedbackMessage(null);

    try {
      const result = await enrollMFA('Salud-Conecta IA');

      if (result.success && result.qrUri && result.factorId) {
        setQrUri(result.qrUri);
        setSecret(result.secret || '');
        setFactorId(result.factorId);
        setStep('verifying');
      } else {
        const errorText = result.error || t('mfaEnrollError') || 'Error al iniciar la configuración de 2FA.';
        setCodeError(errorText);
        notify(errorText, 'error');
        // Si el error indica que ya existe un factor, refrescar la lista para sincronizar la UI
        await loadFactors();
        setStep('idle');
      }
    } catch (err: any) {
      const msg = err.message || 'Error de conexión al generar credenciales 2FA.';
      setCodeError(msg);
      notify(msg, 'error');
      setStep('idle');
    } finally {
      setIsActionLoading(false);
    }
  };

  // ─── Verificar y Activar Código TOTP de 6 Dígitos ───────────────────────────
  const handleVerifyCode = async () => {
    if (!validateTOTPCode(code)) {
      setCodeError(t('mfaCodeInvalid') || 'El código debe tener exactamente 6 dígitos numéricos.');
      return;
    }

    setIsActionLoading(true);
    setCodeError('');

    try {
      const result = await verifyAndActivateMFA(factorId, code);

      if (result.success) {
        await loadFactors();
        setStep('idle');
        setQrUri('');
        setSecret('');
        setCode('');
        onStatusChange?.(true);
        notify('¡Autenticación de Dos Factores (2FA) activada correctamente!', 'success');
      } else {
        const errorMsg = result.error || t('mfaVerifyError') || 'Código de seguridad incorrecto o expirado.';
        setCodeError(errorMsg);
        notify(errorMsg, 'error');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Error de comunicación al validar el código.';
      setCodeError(errorMsg);
      notify(errorMsg, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // ─── Iniciar Desactivación ─────────────────────────────────────────────────
  const handleStartDisable = () => {
    setStep('disabling');
    setCode('');
    setCodeError('');
    setFeedbackMessage(null);
  };

  // ─── Confirmar Desactivación de 2FA ────────────────────────────────────────
  const handleDisable = async (codeToVerify?: string) => {
    const targetFactor = verifiedFactor || factors[0];
    if (!targetFactor) return;

    setIsActionLoading(true);
    setCodeError('');

    try {
      // Desactivar factor elevando la sesión con código TOTP si se ingresó
      const result = await unenrollMFAWithVerification(targetFactor.id, codeToVerify || code);

      if (result.success) {
        await loadFactors();
        setStep('idle');
        setCode('');
        onStatusChange?.(false);
        notify('2FA desactivado correctamente.', 'info');
      } else {
        // Si falló y no se había ingresado código, solicitar código de confirmación
        const errorMsg = result.error || t('mfaDisableError') || 'Error al desactivar el factor.';
        setCodeError(errorMsg);
        notify(errorMsg, 'error');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Error de comunicación al desactivar 2FA.';
      setCodeError(errorMsg);
      notify(errorMsg, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // ─── Copiar Secreto al Portapapeles ────────────────────────────────────────
  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setSecretCopied(true);
      notify('Clave secreta copiada al portapapeles.', 'success');
      setTimeout(() => setSecretCopied(false), 2500);
    } catch {
      notify('No se pudo copiar automáticamente la clave.', 'warning');
    }
  };

  const handleCancel = () => {
    setStep('idle');
    setQrUri('');
    setSecret('');
    setCode('');
    setCodeError('');
  };

  // ─── Render: Usuario Invitado ──────────────────────────────────────────────
  if (userId === 'guest' || !userId) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          {t('mfaGuestNotice')}
        </p>
      </div>
    );
  }

  // ─── Render: Cargando Factores Iniciales ────────────────────────────────────
  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
        <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
        <span className="text-xs text-slate-400">Verificando configuración de seguridad...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tarjeta de Estado Actual */}
      <div
        className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all ${
          is2FAEnabled
            ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            is2FAEnabled
              ? 'bg-emerald-100 dark:bg-emerald-900/50'
              : 'bg-slate-100 dark:bg-slate-700/50'
          }`}
        >
          {is2FAEnabled ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Shield className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              {t('mfaTitle')}
            </h4>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                is2FAEnabled
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {is2FAEnabled ? 'Activado' : 'Desactivado'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
            {is2FAEnabled ? t('mfaEnabled') : t('mfaDisabled')}
          </p>
        </div>
      </div>

      {/* Alerta de Feedback Inline */}
      {feedbackMessage && step === 'idle' && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Acción: Activar o Desactivar (Idle) */}
      {step === 'idle' && (
        <>
          {is2FAEnabled ? (
            <button
              type="button"
              onClick={handleStartDisable}
              disabled={isActionLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-800 font-bold text-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldOff className="w-4 h-4" />
              {t('mfaDeactivate')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartEnroll}
              disabled={isActionLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs transition-all active:scale-[0.98] shadow-sm disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando código QR seguro...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>{t('mfaActivate')}</span>
                </>
              )}
            </button>
          )}
        </>
      )}

      {/* Paso: Verificación del QR */}
      {step === 'verifying' && qrUri && (
        <div className="space-y-4 p-4.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in zoom-in-95 duration-150">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-2 text-brand-600 dark:text-brand-400">
              <QrCode className="w-5 h-5" />
            </div>
            <h5 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
              {t('mfaScanQR')}
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              {t('mfaScanQRDesc')}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-2">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
              <QRCodeSVG value={qrUri} size={170} level="M" />
            </div>
          </div>

          {/* Clave manual de respaldo */}
          {secret && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Key className="w-3 h-3" /> Clave de configuración manual:
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                <code className="flex-1 text-[11px] font-mono text-slate-600 dark:text-slate-300 break-all select-all">
                  {secret}
                </code>
                <button
                  type="button"
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
            </div>
          )}

          {/* Input de código de 6 dígitos */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {t('mfaEnterCode')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              disabled={isActionLoading}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(val);
                if (val) setCodeError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && code.length === 6 && !isActionLoading) {
                  handleVerifyCode();
                }
              }}
              placeholder="000000"
              className={`w-full text-center text-2xl font-mono tracking-[0.4em] py-2.5 px-4 rounded-xl border ${
                codeError
                  ? 'border-red-500 dark:border-red-500/70 focus:ring-red-500'
                  : 'border-slate-200 dark:border-slate-600 focus:border-brand-600 focus:ring-brand-100/50 dark:focus:ring-brand-600/30'
              } bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-[4px] transition-all`}
              autoFocus
            />
            {codeError && (
              <p className="text-red-500 text-[11px] font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {codeError}
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isActionLoading}
              className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-bold text-xs transition-all disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={code.length !== 6 || isActionLoading}
              className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isActionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              {t('mfaVerify')}
            </button>
          </div>
        </div>
      )}

      {/* Paso: Confirmación de desactivación con código AAL2 o desvinculación directa */}
      {step === 'disabling' && (
        <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800 animate-in fade-in zoom-in-95 duration-150">
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

          {/* Guía de fuentes del código */}
          <div className="p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-red-100 dark:border-slate-700 space-y-2">
            <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
              <Smartphone className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <p>
                <strong>Aplicación de autenticación:</strong> Abre tu app de autenticación (Google Authenticator, Authy, etc.) e ingresa el código de 6 dígitos generado.
              </p>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
              <span className="text-[11px] text-slate-500">
                {cooldownTimer > 0 ? `Reenviar correo en ${cooldownTimer}s` : '¿No tienes acceso a tu app?'}
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
                  ? `Reenviar en ${cooldownTimer}s`
                  : emailSent
                  ? 'Reenviar a mi correo'
                  : 'Enviar a mi correo'}
              </button>
            </div>
          </div>

          {/* Input de código 2FA para confirmación */}
          <div className="space-y-1 pt-1">
            <label className="text-[10px] uppercase font-bold text-red-700 dark:text-red-400 tracking-wider">
              {t('mfaEnterCode')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              disabled={isActionLoading}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(val);
                if (val) setCodeError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && code.length === 6 && !isActionLoading) {
                  handleDisable(code);
                }
              }}
              placeholder="0 0 0 0 0 0"
              className={`w-full text-center text-xl font-mono tracking-[0.4em] py-2 px-3 rounded-xl border ${
                codeError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-red-200 dark:border-red-800 focus:border-red-500 focus:ring-red-200'
              } bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-[3px] transition-all`}
              autoFocus
            />
          </div>

          {codeError && (
            <p className="text-red-500 text-[11px] font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {codeError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setStep('idle'); setCode(''); setCodeError(''); }}
              disabled={isActionLoading}
              className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-600 transition-all"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={() => handleDisable(code)}
              disabled={isActionLoading}
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isActionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldOff className="w-4 h-4" />
              )}
              {t('mfaConfirmDisableBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
