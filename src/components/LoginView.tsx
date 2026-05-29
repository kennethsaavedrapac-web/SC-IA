import React, { useState } from "react";
import { Eye, EyeOff, User, Lock, ArrowRight, UserPlus, Moon, Sun } from "lucide-react";

interface LoginViewProps {
  onLogin: (name: string) => void;
  onNavigateToRegister: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function LoginView({
  onLogin,
  onNavigateToRegister,
  darkMode,
  onToggleDarkMode
}: LoginViewProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation states
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!name.trim()) {
      setNameError("Ingresa tu nombre para continuar.");
      hasError = true;
    } else if (name.trim().length < 3) {
      setNameError("El nombre debe tener al menos 3 caracteres.");
      hasError = true;
    } else {
      setNameError("");
    }

    if (!password) {
      setPasswordError("Ingresa tu contraseña.");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (!hasError) {
      onLogin(name.trim());
    }
  };

  const handleGoogleLogin = () => {
    onLogin("Usuario de Google");
  };

  const handleContinueWithoutAccount = () => {
    onLogin("Invitado");
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] dark:from-[#0b0f19] dark:to-[#0f172a] text-slate-800 dark:text-slate-100 relative overflow-hidden transition-colors duration-300">
      
      {/* 3D Glassmorphic Floating Rings (Decorative Elements) */}
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

      {/* Top Header / Action Bar */}
      <header className="w-full px-6 pt-6 flex justify-end items-center z-10">
        <button
          id="btn-toggle-darkmode"
          onClick={onToggleDarkMode}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-yellow-400 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 w-full max-w-md mx-auto px-6 flex flex-col justify-center pb-8 z-10">
        
        {/* Brand Logo & Name */}
        <div className="flex flex-col items-center mb-7">
          <svg className="w-14 h-14 drop-shadow-md" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="26" cy="26" r="14" stroke="url(#logoGrad1)" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="38" cy="38" r="14" stroke="url(#logoGrad2)" strokeWidth="3.5" strokeLinecap="round" />
            <defs>
              <linearGradient id="logoGrad1" x1="12" y1="12" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563eb" />
                <stop offset="1" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="logoGrad2" x1="24" y1="24" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </svg>
          <h1 className="mt-3 text-lg font-bold tracking-tight text-slate-800 dark:text-slate-200">
            Salud-Conecta <span className="text-blue-600 dark:text-blue-500">IA</span>
          </h1>
        </div>

        {/* Title Group */}
        <div className="mb-7 text-left">
          <h2 className="text-[38px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Bienvenido<span className="text-blue-600 dark:text-blue-500">.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium">
            Tu salud, <span className="text-blue-600 dark:text-blue-400 font-semibold">conectada</span> e inteligente.
          </p>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre Input */}
          <div className="space-y-1.5">
            <label className="text-[11.5px] uppercase font-bold text-slate-450 dark:text-slate-500 tracking-wider">
              Nombre
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-blue-650 dark:text-blue-500 transition-colors group-focus-within:text-blue-600" />
              </div>
              <input
                id="input-login-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value) setNameError("");
                }}
                placeholder="Ingresa tu nombre"
                className={`w-full bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 pl-12 pr-4.5 py-4 rounded-[20px] border ${
                  nameError 
                    ? "border-red-500 dark:border-red-500/70 focus:ring-red-500" 
                    : "border-slate-100 dark:border-slate-800/80 focus:border-blue-500 focus:ring-blue-100/50 dark:focus:ring-blue-900/30"
                } focus:outline-none focus:ring-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.015)] dark:shadow-none transition-all duration-200 text-[14.5px] font-medium`}
              />
            </div>
            {nameError && (
              <p className="text-red-500 text-[11.5px] font-semibold pl-1.5 mt-1">{nameError}</p>
            )}
          </div>

          {/* Contraseña Input */}
          <div className="space-y-1.5">
            <label className="text-[11.5px] uppercase font-bold text-slate-455 dark:text-slate-500 tracking-wider">
              Contraseña
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-blue-650 dark:text-blue-500 transition-colors group-focus-within:text-blue-600" />
              </div>
              <input
                id="input-login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value) setPasswordError("");
                }}
                placeholder="Ingresa tu contraseña"
                className={`w-full bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 pl-12 pr-12 py-4 rounded-[20px] border ${
                  passwordError 
                    ? "border-red-500 dark:border-red-500/70 focus:ring-red-500" 
                    : "border-slate-100 dark:border-slate-800/80 focus:border-blue-500 focus:ring-blue-100/50 dark:focus:ring-blue-900/30"
                } focus:outline-none focus:ring-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.015)] dark:shadow-none transition-all duration-200 text-[14.5px] font-medium`}
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
            {passwordError && (
              <p className="text-red-500 text-[11.5px] font-semibold pl-1.5 mt-1">{passwordError}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            id="btn-login-submit"
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-650 active:scale-[0.98] text-white py-4 px-5 rounded-[20px] font-bold text-sm tracking-wide shadow-lg shadow-blue-500/20 dark:shadow-blue-900/10 flex items-center justify-center space-x-1.5 transition-all duration-200 cursor-pointer mt-2"
          >
            <span>Iniciar sesión</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-150 dark:border-slate-800/80"></div>
          </div>
          <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
            <span className="bg-[#f8fafc] dark:bg-[#0b0f19] px-4 text-slate-400 dark:text-slate-500 transition-colors duration-300">
              o continúa con
            </span>
          </div>
        </div>

        {/* Third Party / Secondary Actions */}
        <div className="space-y-3.5">
          {/* Google Button */}
          <button
            id="btn-login-google"
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white dark:bg-slate-900/85 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 py-3.5 px-5 rounded-[20px] border border-slate-100 dark:border-slate-800/80 font-bold text-[13.5px] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.015)] dark:shadow-none hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2.5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Continuar con Google</span>
          </button>

          {/* Continue without account */}
          <button
            id="btn-login-guest"
            type="button"
            onClick={handleContinueWithoutAccount}
            className="w-full bg-transparent hover:bg-blue-50/20 text-blue-600 dark:text-blue-400 py-3.5 px-5 rounded-[20px] border border-blue-600/35 dark:border-blue-400/30 font-bold text-[13.5px] flex items-center justify-center space-x-2 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer"
          >
            <UserPlus className="w-5 h-5 text-blue-650 dark:text-blue-450 shrink-0" />
            <span>Continuar sin cuenta</span>
          </button>
        </div>

      </main>

      {/* Footer & Bottom Decorative Wave */}
      <footer className="w-full pb-8 pt-4 flex flex-col items-center justify-center z-10 relative">
        <p className="text-xs text-slate-500 dark:text-slate-450 font-medium">
          ¿No tienes cuenta?{" "}
          <button
            id="btn-link-to-register"
            onClick={onNavigateToRegister}
            className="text-blue-600 dark:text-blue-455 font-bold hover:underline cursor-pointer ml-1 focus:outline-none"
          >
            Regístrate
          </button>
        </p>

        {/* Wave SVG (Visual enhancement) */}
        <div className="absolute bottom-0 inset-x-0 w-full overflow-hidden leading-none pointer-events-none opacity-40 dark:opacity-20 -z-10">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[55px] text-blue-500 fill-current">
            <path d="M0,0 C300,90 900,10 1200,80 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </footer>

    </div>
  );
}
