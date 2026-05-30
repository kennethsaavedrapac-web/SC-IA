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
import { MessageSquare, MapPin, Search, Sparkles, X, Settings, RefreshCw, Eye, Star, Info, ShieldAlert, Loader2, Moon, Sun, Type, Languages, FileText, Shield, BookOpen, ChevronRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const { user, profile, session, loading: authLoading, initialized, logout } = useAuth();

  const [currentView, setCurrentView] = useState<"login" | "register" | "home" | "consulta" | "centros" | "buscar" | "premium" | "perfil">("login");
  const [localUser, setLocalUser] = useState<UserProfile>(DEFAULT_USER);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [isPremium, setIsPremium] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<"menu" | "terms" | "privacy" | "guide">("menu");
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Font Size state
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">(() => {
    try {
      return (localStorage.getItem("fontSize") as "sm" | "base" | "lg") || "base";
    } catch (e) {
      return "base";
    }
  });

  // Language state
  const [language, setLanguage] = useState<"es" | "en">(() => {
    try {
      return (localStorage.getItem("language") as "es" | "en") || "es";
    } catch (e) {
      return "es";
    }
  });

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

  // Synchronize font size
  useEffect(() => {
    try {
      const root = document.documentElement;
      root.classList.remove("text-sm", "text-base", "text-lg");
      root.classList.add(`text-${fontSize}`);
      localStorage.setItem("fontSize", fontSize);
    } catch (e) {
      console.warn("Failed to set font size:", e);
    }
  }, [fontSize]);

  // Synchronize language
  useEffect(() => {
    try {
      localStorage.setItem("language", language);
    } catch (e) {
      console.warn("Failed to set language:", e);
    }
  }, [language]);

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
    setSettingsView("menu");
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

      {/* DESKTOP SIDEBAR NAVIGATION (Solo visible en Laptop/PC) */}
      {currentView !== "login" && currentView !== "register" && (
        <aside className="hidden md:flex flex-col w-[260px] bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView("home")}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-base">S</span>
            </div>
            <span className="font-display font-bold text-xl text-slate-800 tracking-tight">
              Salud <span className="text-blue-600">IA</span>
            </span>
          </div>

          <div className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto mt-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 pl-3">Menú Principal</div>

            {[
              { id: "home", label: "Inicio", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
              { id: "consulta", label: "Consulta IA", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
              { id: "centros", label: "Centros Médicos", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg> },
              { id: "buscar", label: "Buscador / Citas", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> },
              { id: "premium", label: "Premium", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 12l10 10 10-10z" /></svg> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as any)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all ${currentView === tab.id
                  ? "bg-blue-50 text-blue-700 font-bold shadow-sm border border-blue-100/50"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium border border-transparent"
                  }`}
              >
                <div className={`w-5 h-5 ${currentView === tab.id ? "fill-current/20" : ""}`}>{tab.icon}</div>
                <span className="text-[13.5px]">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Bottom Profile Section */}
          <div className="p-4 border-t border-slate-100">
            <button onClick={() => setCurrentView("perfil")} className={`flex items-center gap-3 w-full p-2.5 rounded-2xl transition-all border ${currentView === "perfil" ? "bg-slate-50 border-slate-200" : "hover:bg-slate-50 border-transparent"} text-left`}>
              <img src={localUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} alt={localUser.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{localUser.name}</p>
                <p className="text-[10px] text-slate-500 truncate font-mono">{localUser.email}</p>
              </div>
            </button>
          </div>
        </aside>
      )}

      {/* Dynamic Content Views based on Router State (Con padding lateral en Laptop para centrado perfecto) */}
      <div className={`flex-1 w-full bg-white min-h-screen flex flex-col relative pb-20 md:pb-0 ${currentView !== "login" && currentView !== "register" ? "md:pl-[260px]" : ""}`}>

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
          <nav className="fixed bottom-0 inset-x-0 bg-white z-40 w-full border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.03)] pb-safe-bottom md:hidden">
            <div className="grid grid-cols-4 p-2.5 pt-3 pb-5 relative font-sans">

              {/* Tab 1: Consulta */}
              <button
                id="btn-nav-consulta"
                onClick={() => setCurrentView("consulta")}
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${currentView === "consulta" ? "text-[#1d4ed8]" : "text-[#94a3b8] hover:text-[#475569]"
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
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${currentView === "centros" ? "text-[#1d4ed8]" : "text-[#94a3b8] hover:text-[#475569]"
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
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${currentView === "buscar" ? "text-[#1d4ed8]" : "text-[#94a3b8] hover:text-[#475569]"
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
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${currentView === "premium" ? "text-[#1d4ed8]" : "text-[#94a3b8] hover:text-[#475569]"
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

      {/* REDESIGNED SETTINGS MODAL */}
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
              className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  {settingsView !== "menu" && (
                    <button
                      onClick={() => setSettingsView("menu")}
                      className="p-1.5 -ml-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings className={`w-5 h-5 text-blue-600 ${settingsView === "menu" ? "animate-spin-slow" : ""}`} />
                    <span>
                      {settingsView === "menu" && "Configuración"}
                      {settingsView === "terms" && "Términos"}
                      {settingsView === "privacy" && "Privacidad"}
                      {settingsView === "guide" && "Guía de Uso"}
                    </span>
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setTimeout(() => setSettingsView("menu"), 300);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                <AnimatePresence mode="wait">
                  {settingsView === "menu" && (
                    <motion.div
                      key="menu"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-6"
                    >
                      {/* Appearance Section */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Apariencia</h4>

                        {/* Dark Mode Toggle */}
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${darkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-amber-500/10 text-amber-500"}`}>
                              {darkMode ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Modo oscuro</span>
                          </div>
                          <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${darkMode ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`}
                          >
                            <motion.div
                              animate={{ x: darkMode ? 22 : 2 }}
                              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                            />
                          </button>
                        </div>

                        {/* Font Size Selector */}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                              <Type className="w-4.5 h-4.5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tamaño de fuente</span>
                          </div>
                          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                            {(["sm", "base", "lg"] as const).map((size) => (
                              <button
                                key={size}
                                onClick={() => setFontSize(size)}
                                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${fontSize === size ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                              >
                                {size === "sm" && "Pequeño"}
                                {size === "base" && "Normal"}
                                {size === "lg" && "Grande"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Region Section */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Regional</h4>
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                              <Languages className="w-4.5 h-4.5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Idioma</span>
                          </div>
                          <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as "es" | "en")}
                            className="bg-transparent text-sm font-bold text-blue-600 outline-none cursor-pointer"
                          >
                            <option value="es">Español</option>
                            <option value="en">English</option>
                          </select>
                        </div>
                      </div>

                      {/* Information Section */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Legal e Información</h4>
                        <div className="space-y-2">
                          {[
                            { id: "terms", label: "Términos y condiciones", icon: FileText, color: "text-slate-500" },
                            { id: "privacy", label: "Privacidad", icon: Shield, color: "text-slate-500" },
                            { id: "guide", label: "Guía de uso", icon: BookOpen, color: "text-slate-500" },
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setSettingsView(item.id as any)}
                              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <item.icon className={`w-4.5 h-4.5 ${item.color} group-hover:text-blue-500 transition-colors`} />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.label}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-all group-hover:translate-x-0.5" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Advanced / Debug Section */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={handleResetApp}
                          className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-white py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Reiniciar base de datos local</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {settingsView === "terms" && (
                    <motion.div
                      key="terms"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400"
                    >
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Términos de Servicio</h4>
                      <p>Bienvenido a Salud-Conecta IA. Al utilizar nuestra aplicación, usted acepta los siguientes términos:</p>
                      <ul className="list-disc pl-4 space-y-2">
                        <li>La IA proporciona orientación informativa, no un diagnóstico médico profesional.</li>
                        <li>En caso de emergencia real, siempre debe contactar con los servicios de emergencia (128).</li>
                        <li>Usted es responsable de la veracidad de la información proporcionada.</li>
                        <li>Nos reservamos el derecho de actualizar estos términos en cualquier momento.</li>
                      </ul>
                      <p className="pt-2">Última actualización: Mayo 2026</p>
                    </motion.div>
                  )}

                  {settingsView === "privacy" && (
                    <motion.div
                      key="privacy"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400"
                    >
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Política de Privacidad</h4>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 flex gap-3">
                        <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <p className="text-emerald-800 dark:text-emerald-400 font-medium">Tus datos están protegidos con encriptación AES-256 de grado médico.</p>
                      </div>
                      <p>Respetamos su privacidad:</p>
                      <ul className="list-disc pl-4 space-y-2">
                        <li>No vendemos sus datos personales a terceros.</li>
                        <li>Sus consultas con la IA son privadas y se utilizan únicamente para mejorar su experiencia.</li>
                        <li>Usted tiene derecho a solicitar la eliminación de sus datos en cualquier momento.</li>
                        <li>Cumplimos con las normativas internacionales de protección de datos médicos.</li>
                      </ul>
                    </motion.div>
                  )}

                  {settingsView === "guide" && (
                    <motion.div
                      key="guide"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">¿Cómo usar Salud-Conecta IA?</h4>
                      <div className="space-y-3">
                        {[
                          { step: "1", title: "Consulta IA", desc: "Describe tus síntomas detalladamente para recibir una orientación inicial." },
                          { step: "2", title: "Centros Médicos", desc: "Encuentra el hospital o clínica más cercana a tu ubicación." },
                          { step: "3", title: "Mis Citas", desc: "Gestiona y programa tus visitas al médico de forma organizada." },
                          { step: "4", title: "Perfil de Emergencia", desc: "Mantén actualizado tu QR para casos de necesidad crítica." },
                        ].map((item) => (
                          <div key={item.step} className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {item.step}
                            </div>
                            <div>
                              <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{item.title}</h5>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 text-center">
                Salud-Conecta IA • v1.2.0 • 2026
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
                <motion.a
                  href="tel:128"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    // El ligero retraso evita que React cancele la llamada en el SO al desmontar el componente
                    setTimeout(() => setIsEmergencyModalOpen(false), 500);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm tracking-wide rounded-2xl shadow-[0_6px_20px_rgba(239,68,68,0.28)] hover:brightness-105 transition-all flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>Llamar al 128 ahora</span>
                </motion.a>

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
