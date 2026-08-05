import React, { useState } from "react";
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, LogIn, Moon, Sun, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { createToast, type ToastData } from "./Toast";
import { useLanguage } from "../contexts/LanguageContext";
import { sanitizeAndTrim, validateEmail, validateName, getPasswordStrength } from "../lib/security";

interface RegisterViewProps {
  onRegister: (name: string) => void;
  onNavigateToLogin: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onToast?: (toast: ToastData) => void;
}

export default function RegisterView({
  onRegister,
  onNavigateToLogin,
  darkMode,
  onToggleDarkMode,
  onToast
}: RegisterViewProps) {
  const { t } = useLanguage();
  const { register, loginWithGoogle, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation states
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [termsError, setTermsError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || loading) return;

    let hasError = false;

    // Validate Name
    const nameVal = validateName(name);
    if (!nameVal.valid) {
      setNameError(nameVal.error === 'tooShort' ? t('nameMin') : t('nameRequired'));
      hasError = true;
    } else {
      setNameError("");
    }

    // Validate Email
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError(t('emailRequired'));
      hasError = true;
    } else if (!validateEmail(cleanEmail)) {
      setEmailError(t('emailInvalid'));
      hasError = true;
    } else {
      setEmailError("");
    }

    // Validate Password
    if (!password) {
      setPasswordError(t('passRequired'));
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError(t('passMin'));
      hasError = true;
    } else {
      setPasswordError("");
    }

    // Validate Confirm Password
    if (!confirmPassword) {
      setConfirmPasswordError(t('confirmPassRequired'));
      hasError = true;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError(t('passMismatch'));
      hasError = true;
    } else {
      setConfirmPasswordError("");
    }

    // Validate Terms Checkbox
    if (!agreeToTerms) {
      setTermsError(t('termsRequired'));
      hasError = true;
    } else {
      setTermsError("");
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      const sanitizedName = sanitizeAndTrim(name);
      const result = await register(cleanEmail, password, sanitizedName);
      if (result.success) {
        onToast?.(createToast(t('registerSuccess'), "success"));
        onRegister(sanitizedName);
      } else {
        onToast?.(createToast(result.error || t('registerError'), "error"));
      }
    } catch {
      onToast?.(createToast(t('connError'), "error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (isSubmitting || loading) return;
    setIsSubmitting(true);
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        onToast?.(createToast(result.error || t('googleError'), "error"));
      }
    } catch {
      onToast?.(createToast(t('googleConnError'), "error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || loading;

  return (
    <div className="min-h-dvh w-full flex flex-col justify-between text-slate-800 dark:text-slate-100 relative overflow-hidden transition-colors duration-300">

      {}
      <div className="absolute top-[6%] right-[-12%] w-64 h-64 pointer-events-none opacity-25 dark:opacity-35 animate-float-slow z-0">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform rotate-12">
          <circle cx="100" cy="100" r="70" stroke="url(#ringGrad1)" strokeWidth="18" strokeLinecap="round" filter="url(#glow)" />
          <defs>
            <linearGradient id="ringGrad1" x1="30" y1="30" x2="170" y2="170" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="0.5" stopColor="#8b5cf6" stopOpacity="0.5" />
              <stop offset="1" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>
      </div>

      <div className="absolute top-[18%] right-[15%] w-40 h-40 pointer-events-none opacity-15 dark:opacity-25 animate-float-reverse z-0">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform -rotate-45">
          <circle cx="100" cy="100" r="75" stroke="url(#ringGrad2)" strokeWidth="12" strokeLinecap="round" />
          <defs>
            <linearGradient id="ringGrad2" x1="25" y1="25" x2="175" y2="175" gradientUnits="userSpaceOnUse">
              <stop stopColor="#06b6d4" stopOpacity="0.7" />
              <stop offset="1" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {}
      <header className="w-full px-6 pt-6 flex justify-end items-center z-10">
        <button
          id="btn-register-toggle-darkmode"
          onClick={onToggleDarkMode}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-yellow-400 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {}
      <main className="flex-1 w-full max-w-md md:max-w-lg mx-auto px-6 md:px-10 py-8 md:my-auto md:bg-white md:dark:bg-slate-900/80 md:backdrop-blur-xl md:shadow-2xl md:shadow-primary/10 md:dark:shadow-primary/20 md:rounded-[32px] md:border md:border-slate-100 md:dark:border-slate-800 flex flex-col justify-center z-10">

        {}
        <div className="flex flex-col items-center mb-5">
          <img
            src="/app-logo-v2.jpg"
            alt="Logo"
            className="w-16 h-16 rounded-2xl shadow-lg object-cover border-2 border-brand-100 dark:border-brand-900/30"
          />
          <h1 className="mt-3 text-lg font-bold tracking-tight text-slate-800 dark:text-slate-200">
            Salud-Conecta <span className="text-brand-600 dark:text-brand-400">IA</span>
          </h1>
        </div>

        {}
        <div className="mb-6 text-left">
          <h2 className="text-[34px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {t('createAccount')}<span className="text-brand-600 dark:text-brand-400">.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-[13.5px] mt-2 font-medium leading-relaxed">
            {t('registerSubtitle')}
          </p>
        </div>

        {}
        <form onSubmit={handleSubmit} className="space-y-4">
          {}
          <div className="space-y-1">
            <label className="text-[11px] uppercase font-bold text-slate-450 dark:text-slate-500 tracking-wider">
              {t('fullName')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-brand-600 dark:text-brand-400 transition-colors group-focus-within:text-brand-600" />
              </div>
              <input
                id="input-register-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value) setNameError("");
                }}
                placeholder="Ingresa tu nombre completo"
                disabled={isLoading}
                autoComplete="name"
                className={`w-full bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 pl-12 pr-4.5 py-3.5 rounded-[20px] border ${nameError
                    ? "border-red-500 dark:border-red-500/70 focus:ring-red-500"
                    : "border-slate-100 dark:border-slate-800/80 focus:border-brand-600 focus:ring-brand-100/50 dark:focus:ring-brand-600/30"
                  } focus:outline-none focus:ring-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.015)] dark:shadow-none transition-all duration-200 text-[14px] font-medium disabled:opacity-60 disabled:cursor-not-allowed`}
              />
            </div>
            {nameError && (
              <p className="text-red-500 text-[11px] font-semibold pl-1.5 mt-0.5">{nameError}</p>
            )}
          </div>

          {}
          <div className="space-y-1">
            <label className="text-[11px] uppercase font-bold text-slate-450 dark:text-slate-500 tracking-wider">
              {t('emailLabel')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-brand-600 dark:text-brand-400 transition-colors group-focus-within:text-brand-600" />
              </div>
              <input
                id="input-register-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (e.target.value) setEmailError("");
                }}
                placeholder="tu@correo.com"
                disabled={isLoading}
                autoComplete="email"
                className={`w-full bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 pl-12 pr-4.5 py-3.5 rounded-[20px] border ${emailError
                    ? "border-red-500 dark:border-red-500/70 focus:ring-red-500"
                    : "border-slate-100 dark:border-slate-800/80 focus:border-brand-600 focus:ring-brand-100/50 dark:focus:ring-brand-600/30"
                  } focus:outline-none focus:ring-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.015)] dark:shadow-none transition-all duration-200 text-[14px] font-medium disabled:opacity-60 disabled:cursor-not-allowed`}
              />
            </div>
            {emailError && (
              <p className="text-red-500 text-[11px] font-semibold pl-1.5 mt-0.5">{emailError}</p>
            )}
          </div>

          {}
          <div className="space-y-1">
            <label className="text-[11px] uppercase font-bold text-slate-450 dark:text-slate-500 tracking-wider">
              {t('passwordLabel')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-brand-600 dark:text-brand-400 transition-colors group-focus-within:text-brand-600" />
              </div>
              <input
                id="input-register-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value) setPasswordError("");
                }}
                placeholder="Crea una contraseña"
                disabled={isLoading}
                autoComplete="new-password"
                className={`w-full bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 pl-12 pr-12 py-3.5 rounded-[20px] border ${passwordError
                    ? "border-red-500 dark:border-red-500/70 focus:ring-red-500"
                    : "border-slate-100 dark:border-slate-800/80 focus:border-brand-600 focus:ring-brand-100/50 dark:focus:ring-brand-600/30"
                  } focus:outline-none focus:ring-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.015)] dark:shadow-none transition-all duration-200 text-[14px] font-medium disabled:opacity-60 disabled:cursor-not-allowed`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-450 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {password && (
              <div className="mt-1 px-1.5 space-y-1">
                <div className="flex gap-1 h-1">
                  {[...Array(4)].map((_, i) => {
                    const strength = getPasswordStrength(password);
                    const colors = [
                      "bg-red-500", // 1 - Weak
                      "bg-amber-500", // 2 - Fair
                      "bg-blue-500", // 3 - Good
                      "bg-emerald-500", // 4 - Strong
                    ];
                    const active = i < strength;
                    const colorClass = active ? colors[strength - 1] : "bg-slate-100 dark:bg-slate-800";
                    return (
                      <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${colorClass}`} />
                    );
                  })}
                </div>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  {getPasswordStrength(password) === 1 && t('passWeak' as any)}
                  {getPasswordStrength(password) === 2 && t('passFair' as any)}
                  {getPasswordStrength(password) === 3 && t('passGood' as any)}
                  {getPasswordStrength(password) === 4 && t('passStrong' as any)}
                </p>
              </div>
            )}
            {passwordError && (
              <p className="text-red-500 text-[11px] font-semibold pl-1.5 mt-0.5">{passwordError}</p>
            )}
          </div>

          {}
          <div className="space-y-1">
            <label className="text-[11px] uppercase font-bold text-slate-455 dark:text-slate-500 tracking-wider">
              {t('confirmPassword')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-brand-600 dark:text-brand-400 transition-colors group-focus-within:text-brand-600" />
              </div>
              <input
                id="input-register-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (e.target.value) setConfirmPasswordError("");
                }}
                placeholder="Confirma tu contraseña"
                disabled={isLoading}
                autoComplete="new-password"
                className={`w-full bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 pl-12 pr-12 py-3.5 rounded-[20px] border ${confirmPasswordError
                    ? "border-red-500 dark:border-red-500/70 focus:ring-red-500"
                    : "border-slate-100 dark:border-slate-800/80 focus:border-brand-600 focus:ring-brand-100/50 dark:focus:ring-brand-600/30"
                  } focus:outline-none focus:ring-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.015)] dark:shadow-none transition-all duration-200 text-[14px] font-medium disabled:opacity-60 disabled:cursor-not-allowed`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-450 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="text-red-500 text-[11px] font-semibold pl-1.5 mt-0.5">{confirmPasswordError}</p>
            )}
          </div>

          {}
          <div className="space-y-1 pt-1">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <input
                id="checkbox-register-terms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  if (e.target.checked) setTermsError("");
                }}
                disabled={isLoading}
                className="mt-0.5 w-[18px] h-[18px] rounded-[6px] text-brand-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-0 cursor-pointer transition-all shrink-0"
              />
              <span className="text-[12.5px] text-slate-500 dark:text-slate-400 leading-snug font-medium select-none">
                {t('agreeToTerms')}
              </span>
            </label>
            {termsError && (
              <p className="text-red-500 text-[11px] font-semibold pl-1.5 mt-0.5">{termsError}</p>
            )}
          </div>

          {}
          <button
            id="btn-register-submit"
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-brand-900 to-brand-600 hover:from-brand-900 hover:to-brand-600 active:scale-[0.98] text-white py-3.5 px-5 rounded-[20px] font-bold text-sm tracking-wide shadow-lg shadow-brand-500/20 dark:shadow-brand-900/10 flex items-center justify-center space-x-1.5 transition-all duration-200 cursor-pointer pt-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>{t('creatingAccount')}</span>
              </>
            ) : (
              <>
                <span>{t('registerButton')}</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </>
            )}
          </button>
        </form>

        {}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-150 dark:border-slate-800/80"></div>
          </div>
          <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
            <span className="bg-[#f8fafc] dark:bg-[#0b0f19] px-4 text-slate-400 dark:text-slate-500 transition-colors duration-300">
              {t('orContinueWith')}
            </span>
          </div>
        </div>

        {}
        <button
          id="btn-register-google"
          type="button"
          onClick={handleGoogleRegister}
          disabled={isLoading}
          className="w-full bg-white dark:bg-slate-900/85 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 py-3.5 px-5 rounded-[20px] border border-slate-100 dark:border-slate-800/80 font-bold text-[13.5px] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.015)] dark:shadow-none hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2.5" />
          ) : (
            <svg className="w-5 h-5 mr-2.5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
          )}
            <span>{t('continueWithGoogle')}</span>
        </button>

        {}
        <button
          id="btn-register-login-back"
          type="button"
          onClick={onNavigateToLogin}
          disabled={isLoading}
          className="w-full bg-transparent hover:bg-brand-50/20 text-brand-600 dark:text-brand-400 py-3.5 px-5 rounded-[20px] border border-brand-600/35 dark:border-brand-400/30 font-bold text-[13.5px] flex items-center justify-center space-x-2 mt-3.5 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <LogIn className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
            <span>{t('alreadyHaveAccount')}</span>
        </button>

      </main>

      {}
      <footer className="w-full pb-8 pt-4 flex flex-col items-center justify-center relative">
        <div className="absolute bottom-0 inset-x-0 w-full overflow-hidden leading-none pointer-events-none opacity-40 dark:opacity-20 -z-10">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[55px] text-brand-400 fill-current">
            <path d="M0,0 C300,90 900,10 1200,80 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </footer>

    </div>
  );
}
