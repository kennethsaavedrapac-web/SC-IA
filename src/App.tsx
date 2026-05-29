import React, { useState, useEffect, useCallback } from "react";
import HomeView from "./components/HomeView";
import ConsultaView from "./components/ConsultaView";
import CentrosView from "./components/CentrosView";
import BuscarView from "./components/BuscarView";
import PremiumView from "./components/PremiumView";
import PerfilView from "./components/PerfilView";
import LoginView from "./components/LoginView";
import RegisterView from "./components/RegisterView";
import { ToastContainer, createToast, type ToastData } from "./components/Toast";
import { useAuth } from "./contexts/AuthContext";
import { DEFAULT_USER, INITIAL_APPOINTMENTS } from "./data/medicalData";
import { UserProfile, Appointment } from "./types";
import { MessageSquare, MapPin, Search, Sparkles, X, Settings, RefreshCw, Eye, Star, Info, ShieldAlert, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const { user, profile, session, loading: authLoading, initialized, logout } = useAuth();

  const [currentView, setCurrentView] = useState<"login" | "register" | "home" | "consulta" | "centros" | "buscar" | "premium" | "perfil">("login");
  const [localUser, setLocalUser] = useState<UserProfile>(DEFAULT_USER);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [isPremium, setIsPremium] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Global dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        return savedTheme === "dark";
      }
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (e) {
      console.warn("localStorage is blocked or window.matchMedia is unavailable:", e);
      return false;
    }
  });

  // Synchronize dark mode class on document element
  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    } catch (e) {
      console.warn("Failed to set theme in localStorage:", e);
    }
  }, [darkMode]);

  // Auto scroll to top on page switches to mimic page routing
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  // ─── Session-based navigation ─────────────────────────────
  // Redirect to home if user is authenticated, or to login if not
  useEffect(() => {
    if (!initialized) return;

    if (session && user) {
      // User is authenticated — if on login/register, redirect to home
      if (currentView === "login" || currentView === "register") {
        setCurrentView("home");
      }
    } else {
      // No session — force login screen
      if (currentView !== "login" && currentView !== "register") {
        setCurrentView("login");
      }
    }
  }, [session, user, initialized]);

  // Sync profile data from Supabase to local state
  useEffect(() => {
    if (profile) {
      setLocalUser((prev) => ({
        ...prev,
        name: profile.nombre || prev.name,
        email: profile.email || prev.email,
        city: profile.ciudad || prev.city,
        country: profile.pais || prev.country,
        avatarUrl: profile.avatar_url || prev.avatarUrl,
      }));
    }
  }, [profile]);

  // ─── Toast Management ──────────────────────────────────────
  const addToast = useCallback((toast: ToastData) => {
    setToasts((prev) => [...prev, toast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Handlers ──────────────────────────────────────────────
  const handleLoginSuccess = (name: string) => {
    // Profile sync happens via useEffect above
    setCurrentView("home");
  };

  const handleRegisterSuccess = (name: string) => {
    // Profile sync happens via useEffect above
    setCurrentView("home");
  };

  const handleAddAppointment = (newApp: Appointment) => {
    setAppointments((prev) => [newApp, ...prev]);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setLocalUser(updatedUser);
  };

  const handleUnlockPremium = () => {
    setIsPremium(true);
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      setLocalUser(DEFAULT_USER);
      setAppointments(INITIAL_APPOINTMENTS);
      setIsPremium(false);
      setCurrentView("login");
      addToast(createToast("Sesión cerrada correctamente.", "info"));
    } else {
      addToast(createToast(result.error || "Error al cerrar sesión.", "error"));
    }
  };

  const handleResetApp = () => {
    setLocalUser(DEFAULT_USER);
    setAppointments(INITIAL_APPOINTMENTS);
    setIsPremium(false);
    setCurrentView("home");
    setIsSettingsOpen(false);
    addToast(createToast("Aplicación reiniciada a sus valores por defecto.", "info"));
  };

  // ─── Loading Screen ────────────────────────────────────────
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <svg className="w-16 h-16 drop-shadow-md" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="26" cy="26" r="14" stroke="url(#splashGrad1)" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="38" cy="38" r="14" stroke="url(#splashGrad2)" strokeWidth="3.5" strokeLinecap="round" />
            <defs>
              <linearGradient id="splashGrad1" x1="12" y1="12" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563eb" />
                <stop offset="1" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="splashGrad2" x1="24" y1="24" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </svg>
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-semibold">Verificando sesión...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none overflow-x-hidden antialiased">
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Dynamic Content Views based on Router State */}
      <div className="flex-1 w-full max-w-lg mx-auto bg-white min-h-screen shadow-2xl shadow-blue-500/5 flex flex-col relative pb-20">
        
        <AnimatePresence mode="wait">
          {currentView === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col"
            >
              <LoginView
                onLogin={handleLoginSuccess}
                onNavigateToRegister={() => setCurrentView("register")}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
                onToast={addToast}
              />
            </motion.div>
          )}

          {currentView === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col"
            >
              <RegisterView
                onRegister={handleRegisterSuccess}
                onNavigateToLogin={() => setCurrentView("login")}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
                onToast={addToast}
              />
            </motion.div>
          )}

          {currentView === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              <HomeView
                user={localUser}
                onNavigate={(tab) => setCurrentView(tab)}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </motion.div>
          )}

          {currentView === "consulta" && (
            <motion.div
              key="consulta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col h-[calc(100vh-80px)]"
            >
              <ConsultaView user={localUser} onNavigate={(tab) => setCurrentView(tab)} isPremium={isPremium} onTriggerEmergency={() => setIsEmergencyModalOpen(true)} />
            </motion.div>
          )}

          {currentView === "centros" && (
            <motion.div
              key="centros"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              <CentrosView onNavigate={(tab) => setCurrentView(tab)} onTriggerEmergency={() => setIsEmergencyModalOpen(true)} />
            </motion.div>
          )}

          {currentView === "buscar" && (
            <motion.div
              key="buscar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              <BuscarView
                appointments={appointments}
                onAddAppointment={handleAddAppointment}
                onNavigate={(tab) => setCurrentView(tab)}
              />
            </motion.div>
          )}

          {currentView === "premium" && (
            <motion.div
              key="premium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              <PremiumView
                isPremium={isPremium}
                onUnlockPremium={handleUnlockPremium}
                onNavigate={(tab) => setCurrentView(tab)}
              />
            </motion.div>
          )}

          {currentView === "perfil" && (
            <motion.div
              key="perfil"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              <PerfilView
                user={localUser}
                isPremium={isPremium}
                onGoBack={() => setCurrentView("home")}
                onUpdateUser={handleUpdateUser}
                onLogout={handleLogout}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* PERSISTENT 4-TAB NAVIGATION BAR IN PAGE FOOTERS */}
        {currentView !== "perfil" && currentView !== "login" && currentView !== "register" && (
          <nav className="fixed bottom-0 inset-x-0 bg-white z-40 max-w-lg mx-auto w-full border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.03)] pb-safe-bottom">
            <div className="grid grid-cols-4 p-2.5 pt-3 pb-5 relative font-sans">
              
              {/* Tab 1: Consulta */}
              <button
                id="btn-nav-consulta"
                onClick={() => setCurrentView("consulta")}
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                  currentView === "consulta" ? "text-[#1d4ed8]" : "text-[#94a3b8] hover:text-[#475569]"
                }`}
              >
                <div className="p-1 mb-0.5">
                  <svg className={`w-[25px] h-[25px] ${currentView === "consulta" ? "fill-current" : ""}`} viewBox="0 0 24 24" fill={currentView === "consulta" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span className={`text-[11.5px] tracking-tight font-medium ${currentView === "consulta" ? "font-semibold text-[#1d4ed8]" : "text-[#94a3b8]"}`}>
                  Consulta
                </span>
                {/* Active indicator dot/lines */}
                {currentView === "consulta" && (
                  <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-[#1d4ed8] font-bold text-xs tracking-[1.5px] leading-none">...</span>
                )}
              </button>

              {/* Tab 2: Centros */}
              <button
                id="btn-nav-centros"
                onClick={() => setCurrentView("centros")}
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                  currentView === "centros" ? "text-[#1d4ed8]" : "text-[#94a3b8] hover:text-[#475569]"
                }`}
              >
                <div className="p-1 mb-0.5">
                  <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <span className={`text-[11.5px] tracking-tight font-medium ${currentView === "centros" ? "font-semibold text-[#1d4ed8]" : "text-[#94a3b8]"}`}>
                  Centros
                </span>
                {currentView === "centros" && (
                  <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-[#1d4ed8] font-bold text-xs tracking-[1.5px] leading-none">...</span>
                )}
              </button>

              {/* Tab 3: Buscar */}
              <button
                id="btn-nav-buscar"
                onClick={() => setCurrentView("buscar")}
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                  currentView === "buscar" ? "text-[#1d4ed8]" : "text-[#94a3b8] hover:text-[#475569]"
                }`}
              >
                <div className="p-1 mb-0.5">
                  <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <span className={`text-[11.5px] tracking-tight font-medium ${currentView === "buscar" ? "font-semibold text-[#1d4ed8]" : "text-[#94a3b8]"}`}>
                  Buscar
                </span>
                {currentView === "buscar" && (
                  <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-[#1d4ed8] font-bold text-xs tracking-[1.5px] leading-none">...</span>
                )}
              </button>

              {/* Tab 4: Premium */}
              <button
                id="btn-nav-premium"
                onClick={() => setCurrentView("premium")}
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                  currentView === "premium" ? "text-[#1d4ed8]" : "text-[#94a3b8] hover:text-[#475569]"
                }`}
              >
                <div className="p-1 mb-0.5">
                  <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 12l10 10 10-10z" />
                  </svg>
                </div>
                <span className={`text-[11.5px] tracking-tight font-medium ${currentView === "premium" ? "font-semibold text-[#1d4ed8]" : "text-[#94a3b8]"}`}>
                  Premium
                </span>
                {currentView === "premium" && (
                  <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-[#1d4ed8] font-bold text-xs tracking-[1.5px] leading-none">...</span>
                )}
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* DYNAMIC SYSTEM / TESTING UTILITIES DIALOG MODAL (GIVES ASSESSOR GREAT CONTROL) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl border border-slate-100 text-slate-800"
            >
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-1.5">
                    <Settings className="w-5 h-5 text-blue-600 animate-spin" />
                    <span>Ajustes del Sistema</span>
                  </h3>
                  <p className="text-xs text-slate-400">Panel de evaluación para Salud-Conecta IA</p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="py-4 space-y-4">
                {/* Simulated Diagnostic report of scheduled appointments */}
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-xs">
                  <span className="font-bold text-blue-800 block mb-1">Citas agendadas por {localUser.name}:</span>
                  <p className="text-slate-600">{appointments.length} citas registradas.</p>
                  <ul className="list-disc leading-normal list-inside pl-1 mt-1 text-slate-500 text-[11px]">
                    {appointments.map((a, i) => (
                      <li key={i}>{a.doctorName} - {a.specialty} ({a.date})</li>
                    ))}
                  </ul>
                </div>

                {/* Supabase Auth Status */}
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-[11px] text-emerald-800 leading-normal flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Estado de Autenticación Supabase:</span>
                    <p className="mt-0.5">
                      {session ? (
                        <>✅ Sesión activa — {user?.email}</>
                      ) : (
                        <>⚠️ Sin sesión activa (modo invitado)</>
                      )}
                    </p>
                  </div>
                </div>

                {/* API Info key safety */}
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-[11px] text-amber-800 leading-normal flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Servicios Gemini AI Activos:</span>
                    <p className="mt-0.5">La app enruta las consultas de triaje mediante una llamada server-side a `gemini-3.5-flash`.</p>
                  </div>
                </div>

                {/* Reset system */}
                <button
                  onClick={handleResetApp}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reiniciar base de datos local</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-400 text-center pt-3 border-t border-slate-100">
                Salud-Conecta IA • v1.0.0 PWA • 2026
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EMERGENCY INFORMATIVE AND CONFIRMATION MODAL */}
      <AnimatePresence>
        {isEmergencyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-5 select-none"
          >
            <motion.div
              initial={{ scale: 0.93, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white rounded-[32px] w-full max-w-[380px] p-6 shadow-[0_20px_50px_rgba(239,68,68,0.15)] border border-red-50 relative overflow-hidden"
            >
              {/* Subtle top decoration */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />
              
              {/* Pulse alert icon container */}
              <div className="flex flex-col items-center text-center mt-3 mb-5">
                <div className="w-[74px] h-[74px] rounded-full bg-red-50 flex items-center justify-center relative mb-4">
                  {/* Ping effect */}
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-100 animate-ping opacity-75" />
                  
                  {/* Inner dark red icon container */}
                  <div className="w-[56px] h-[56px] rounded-full bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white shadow-[0_4px_16px_rgba(239,68,68,0.3)] relative z-10">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[28px] h-[28px] animate-pulse">
                      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v10H2" />
                      <circle cx="16.5" cy="17.5" r="2.5" />
                      <circle cx="7.5" cy="17.5" r="2.5" />
                      <path d="M10 10v4" />
                      <path d="M8 12h4" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Llamada de Emergencia
                </h3>
                <p className="text-xs text-red-500 font-bold uppercase tracking-wider mt-1 font-mono">
                  Cruz Roja • Línea 128
                </p>
              </div>

              {/* Informative Guidance Content */}
              <div className="space-y-4 mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
                
                {/* When to call */}
                <div className="bg-emerald-50/60 rounded-[20px] p-3.5 border border-emerald-100/50">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    ¿Cuándo sí debes llamar?
                  </span>
                  <ul className="text-[11px] text-slate-600 space-y-1 pl-1 leading-relaxed">
                    <li className="flex items-start gap-1">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Dificultad respiratoria severa o asfixia.</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Dolor opresivo en el pecho (sospecha de infarto).</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Pérdida de conocimiento o convulsiones.</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Accidentes graves o sangrado incontrolable.</span>
                    </li>
                  </ul>
                </div>

                {/* When NOT to call */}
                <div className="bg-slate-50 rounded-[20px] p-3.5 border border-slate-200/50">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                    ¿Cuándo usar la Consulta IA en su lugar?
                  </span>
                  <ul className="text-[11px] text-slate-600 space-y-1 pl-1 leading-relaxed">
                    <li className="flex items-start gap-1">
                      <span className="text-slate-400 font-bold">•</span>
                      <span>Fiebre moderada o síntomas de gripe.</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-slate-400 font-bold">•</span>
                      <span>Dolores corporales leves o de garganta.</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-slate-400 font-bold">•</span>
                      <span>Consultas sobre dosis de medicamentos o triaje.</span>
                    </li>
                  </ul>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    setIsEmergencyModalOpen(false);
                    window.location.href = "tel:128";
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm tracking-wide rounded-2xl shadow-[0_6px_20px_rgba(239,68,68,0.28)] hover:brightness-105 transition-all flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>Llamar al 128 ahora</span>
                </motion.button>
                
                <button
                  onClick={() => setIsEmergencyModalOpen(false)}
                  className="w-full py-3 text-slate-500 hover:text-slate-800 font-bold text-[13px] tracking-wide transition-colors active:scale-95"
                >
                  Cancelar
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
