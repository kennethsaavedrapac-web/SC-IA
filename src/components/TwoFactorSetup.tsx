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
  ExternalLink,
  UserCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  enrollMFA,
  verifyAndActivateMFA,
  getMFAFactors,
  unenrollMFA,
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
 * TwoFactorSetup — Componente para activar/desactivar 2FA desde el perfil.
 * Gestiona estados condicionales según el proveedor (Google OAuth vs Local)
 * y garantiza feedback visual constante ante cualquier acción asíncrona.
 */
export default function TwoFactorSetup({
  userId,
  userProfile,
  onStatusChange,
  onNavigateToPersonalInfo,
  onShowToast,
}: TwoFactorSetupProps) {
  const { t } = useLanguage();
  const { user: authUser } = useAuth();

  // Estados de carga y flujo
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'enrolling' | 'verifying' | 'disabling'>('idle');

  // Estados de enrolamiento
  const [qrUri, setQrUri] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [secretCopied, setSecretCopied] = useState(false);
  const [showMissingInfoWarning, setShowMissingInfoWarning] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // ─── Detección del Proveedor de Autenticación ──────────────────────────────
  const isGoogleProvider = useMemo(() => {
    // 1. Verificación por prop
    if (userProfile?.provider === 'google' || userProfile?.provider === 'google.com') {
      return true;
    }

    // 2. Verificación por usuario de Supabase / Firebase en AuthContext
    const appMetadata = (authUser as any)?.app_metadata;
    const providerData = (authUser as any)?.providerData;
    const identities = (authUser as any)?.identities;

    if (appMetadata?.provider === 'google' || appMetadata?.providers?.includes('google')) {
      return true;
    }
    if (Array.isArray(identities) && identities.some((i: any) => i.provider === 'google')) {
      return true;
    }
    if (Array.isArray(providerData) && providerData.some((p: any) => p.providerId === 'google.com' || p.providerId === 'google')) {
      return true;
    }

    return false;
  }, [userProfile, authUser]);

  // ─── Factores Activos ──────────────────────────────────────────────────────
  const verifiedFactor = useMemo(() => {
    return factors.find((f) => f.status === 'verified');
  }, [factors]);

  const is2FAEnabled = !!verifiedFactor;

  // Helper para feedback unificado
  const notify = useCallback((text: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setFeedbackMessage({ type: type === 'warning' ? 'error' : type, text });
    onShowToast?.(text, type);
  }, [onShowToast]);

  // ─── Cargar factores al montar ─────────────────────────────────────────────
  const loadFactors = useCallback(async () => {
    if (isGoogleProvider) {
      setIsInitialLoading(false);
      return;
    }

    setIsInitialLoading(true);
    try {
      const factorsList = await getMFAFactors();
      setFactors(Array.isArray(factorsList) ? factorsList : []);
    } catch {
      // Fallback silencioso en carga inicial
    } finally {
      setIsInitialLoading(false);
    }
  }, [isGoogleProvider]);

  useEffect(() => {
    if (userId && userId !== 'guest') {
      loadFactors();
    } else {
      setIsInitialLoading(false);
    }
  }, [userId, loadFactors]);

  // ─── Validación previa de Datos de Contacto ───────────────────────────────
  const validatePrerequisites = (): boolean => {
    const hasEmail = Boolean(userProfile?.email || authUser?.email);
    const hasPhone = Boolean(userProfile?.phone && userProfile.phone.trim().length > 4);

    if (!hasEmail && !hasPhone) {
      setShowMissingInfoWarning(true);
      notify('Completa tu información personal (correo o teléfono) antes de habilitar 2FA.', 'warning');
      return false;
    }
    return true;
  };

  // ─── Iniciar Enrolamiento con Feedback Visual ───────────────────────────────
  const handleStartEnroll = async () => {
    if (!validatePrerequisites()) return;

    setIsActionLoading(true);
    setCode('');
    setCodeError('');
    setShowMissingInfoWarning(false);
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

  // ─── Verificar Código TOTP ─────────────────────────────────────────────────
  const handleVerifyCode = async () => {
    if (!validateTOTPCode(code)) {
      setCodeError(t('mfaCodeInvalid') || 'El código debe ser de 6 dígitos numéricos.');
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
        notify('¡Autenticación en Dos Pasos (2FA) activada correctamente!', 'success');
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

  // ─── Desactivar 2FA ────────────────────────────────────────────────────────
  const handleDisable = async () => {
    if (!verifiedFactor) return;

    setIsActionLoading(true);
    setCodeError('');

    try {
      const result = await unenrollMFA(verifiedFactor.id);
      if (result.success) {
        await loadFactors();
        setStep('idle');
        onStatusChange?.(false);
        notify('2FA desactivado correctamente.', 'info');
      } else {
        const errorMsg = result.error || t('mfaDisableError') || 'Error al desactivar el factor 2FA.';
        setCodeError(errorMsg);
        notify(errorMsg, 'error');
        setStep('idle');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Error al comunicarse con el servidor.';
      setCodeError(errorMsg);
      notify(errorMsg, 'error');
      setStep('idle');
    } finally {
      setIsActionLoading(false);
    }
  };

  // ─── Copiar Secreto ────────────────────────────────────────────────────────
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
    setShowMissingInfoWarning(false);
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

  // ─── Render: CASO GOOGLE OAUTH ─────────────────────────────────────────────
  if (isGoogleProvider) {
    return (
      <div className="space-y-3">
        {/* Banner Informativo Google */}
        <div className="p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white dark:from-blue-950/20 dark:via-slate-800 dark:to-slate-800/80">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-blue-100 dark:border-slate-600 flex items-center justify-center shrink-0 p-2">
              <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('googleAccount') || 'Cuenta de Google'}
                </h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  Seguridad Delegada
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Tu cuenta está protegida a través de la seguridad de Google. La verificación en dos pasos (2FA) y llaves de acceso están administradas directamente en tu panel de Google.
              </p>
            </div>
          </div>
        </div>

        {/* Botón Redirección a Google Security */}
        <a
          href="https://myaccount.google.com/security"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-all shadow-sm group active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Gestionar seguridad en Google</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
        </a>
      </div>
    );
  }

  // ─── Render: CASO LOCAL (EMAIL / PASSWORD) ─────────────────────────────────
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

      {/* Advertencia de Prerrequisitos Faltantes */}
      {showMissingInfoWarning && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              Información de contacto requerida
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
              Por tu seguridad, agrega y verifica un correo o teléfono en tu perfil antes de habilitar el segundo factor.
            </p>
            {onNavigateToPersonalInfo && (
              <button
                type="button"
                onClick={onNavigateToPersonalInfo}
                className="mt-2 text-xs font-bold text-amber-900 dark:text-amber-200 underline inline-flex items-center gap-1 hover:opacity-80"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Ir a Información personal
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Acción: Activar o Desactivar (Idle) */}
      {step === 'idle' && (
        <>
          {is2FAEnabled ? (
            <button
              type="button"
              onClick={() => { setStep('disabling'); setCodeError(''); }}
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
                  <span>Configurando 2FA...</span>
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
        <div className="space-y-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
          <div className="text-center">
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

          {/* Clave manual */}
          {secret && (
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
              <code className="flex-1 text-[10px] font-mono text-slate-600 dark:text-slate-300 break-all select-all">
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
          )}

          {/* Input de código */}
          <div className="space-y-2">
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
              className={`w-full text-center text-2xl font-mono tracking-[0.4em] py-3 px-4 rounded-xl border ${
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
          <div className="flex gap-2">
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

      {/* Paso: Confirmación de desactivación */}
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

          {codeError && (
            <p className="text-red-500 text-[11px] font-semibold">{codeError}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setStep('idle'); setCodeError(''); }}
              disabled={isActionLoading}
              className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-600 transition-all"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleDisable}
              disabled={isActionLoading}
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
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

