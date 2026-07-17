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
import { MessageSquare, MapPin, Search, Sparkles, X, Settings, RefreshCw, Eye, Star, Info, ShieldAlert, Loader2, Sun, Moon, Globe, Type, FileText, ShieldCheck, HelpCircle, ChevronRight, ChevronLeft, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "./contexts/LanguageContext";

export default function App() {
  const { user, profile, session, loading: authLoading, initialized, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [currentView, setCurrentView] = useState<"login" | "register" | "home" | "consulta" | "centros" | "buscar" | "premium" | "perfil">("login");
  const [localUser, setLocalUser] = useState<UserProfile>(DEFAULT_USER);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [isPremium, setIsPremium] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsSubView, setSettingsSubView] = useState<"main" | "guide" | "terms" | "privacy">("main");
  const [guideStep, setGuideStep] = useState(1);
  const [isDevToolsExpanded, setIsDevToolsExpanded] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">(() => {
    try {
      const savedSize = localStorage.getItem("fontSize");
      if (savedSize === "sm" || savedSize === "md" || savedSize === "lg") {
        return savedSize;
      }
    } catch (e) {
      console.warn("localStorage reading is blocked:", e);
    }
    return "md";
  });

  // Synchronize font size
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (fontSize === "sm") {
        root.style.fontSize = "14px";
      } else if (fontSize === "lg") {
        root.style.fontSize = "18px";
      } else {
        root.style.fontSize = "16px";
      }
      localStorage.setItem("fontSize", fontSize);
    } catch (e) {
      console.warn("Failed to set font size in localStorage:", e);
    }
  }, [fontSize]);

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
      addToast(createToast(language === "es" ? "Sesión cerrada correctamente." : "Logged out successfully.", "info"));
    } else {
      addToast(createToast(result.error || (language === "es" ? "Error al cerrar sesión." : "Error logging out."), "error"));
    }
  };

  const handleResetApp = () => {
    setLocalUser(DEFAULT_USER);
    setAppointments(INITIAL_APPOINTMENTS);
    setIsPremium(false);
    setCurrentView("home");
    setIsSettingsOpen(false);
    addToast(createToast(language === "es" ? "Aplicación reiniciada a sus valores por defecto." : "Application reset to default values.", "info"));
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
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 pl-3">
              {language === "es" ? "Menú Principal" : "Main Menu"}
            </div>

            {[
              { id: "home", label: t("navHome"), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
              { id: "consulta", label: t("navConsulta"), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
              { id: "centros", label: t("navCentros"), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg> },
              { id: "buscar", label: t("navBuscar"), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> },
              { id: "premium", label: t("navPremium"), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 12l10 10 10-10z" /></svg> },
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
                  {t("navConsulta")}
                </span>
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
                  {t("navCentros")}
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
                  {t("navBuscar")}
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
                  {t("navPremium")}
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
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 transition-colors duration-300 max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                    <span>{t("settingsTitle")}</span>
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t("settingsSubtitle")}</p>
                </div>
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setSettingsSubView("main");
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body with views switching */}
              {settingsSubView === "main" ? (
                // --- MAIN SETTINGS INDEX VIEW ---
                <div className="space-y-5">
                  {/* Preferences Section */}
                  <div className="space-y-4">
                    {/* Dark Mode Preference */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100/50 dark:border-slate-700/30">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </div>
                        <div>
                          <span className="text-[13px] font-bold block">{t("darkMode")}</span>
                          <span className="text-[10px] text-slate-400">{t("darkModeDesc")}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`w-12 h-6.5 rounded-full p-1 transition-all duration-350 cursor-pointer ${darkMode ? "bg-blue-600 flex justify-end" : "bg-slate-200 dark:bg-slate-750 flex justify-start"
                          }`}
                      >
                        <motion.div
                          layout
                          className="w-4.5 h-4.5 rounded-full bg-white shadow-sm"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>

                    {/* Font Size Preference */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100/50 dark:border-slate-700/30 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#eff6ff] dark:bg-blue-950/20 text-[#2563eb] dark:text-[#60a5fa] flex items-center justify-center">
                          <Type className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[13px] font-bold block">{t("fontSize")}</span>
                          <span className="text-[10px] text-slate-400">{t("fontSizeDesc")}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {[
                          { id: "sm", label: t("fontSizeSmall") },
                          { id: "md", label: t("fontSizeMedium") },
                          { id: "lg", label: t("fontSizeLarge") }
                        ].map((sz) => (
                          <button
                            key={sz.id}
                            onClick={() => setFontSize(sz.id as any)}
                            className={`py-2 px-1 text-[11px] font-bold rounded-xl border text-center transition-all cursor-pointer ${fontSize === sz.id
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                                : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                          >
                            {sz.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language Preference */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100/50 dark:border-slate-700/30 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[13px] font-bold block">{t("language")}</span>
                          <span className="text-[10px] text-slate-400">{t("languageDesc")}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {[
                          { id: "es", label: t("languageEs") },
                          { id: "en", label: t("languageEn") }
                        ].map((lang) => (
                          <button
                            key={lang.id}
                            onClick={() => setLanguage(lang.id as any)}
                            className={`py-2 px-1 text-[11px] font-bold rounded-xl border text-center transition-all cursor-pointer ${language === lang.id
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                                : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Informational Buttons List */}
                  <div className="space-y-2">
                    {[
                      { id: "guide", title: t("userGuide"), desc: t("userGuideDesc"), icon: HelpCircle, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400" },
                      { id: "terms", title: t("terms"), desc: t("termsDesc"), icon: FileText, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400" },
                      { id: "privacy", title: t("privacy"), desc: t("privacyDesc"), icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" }
                    ].map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (opt.id === "guide") setGuideStep(1);
                            setSettingsSubView(opt.id as any);
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent hover:border-slate-100 dark:hover:border-slate-800/80 transition-all text-left outline-none cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${opt.color}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-[13px] font-bold">{opt.title}</h4>
                              <p className="text-[10px] text-slate-400">{opt.desc}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Collapsible Developer/Testing Utilities */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                    <button
                      onClick={() => setIsDevToolsExpanded(!isDevToolsExpanded)}
                      className="w-full flex items-center justify-between text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-1.5 transition-colors cursor-pointer text-xs font-semibold"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" />
                        <span>{t("devTools")}</span>
                      </span>
                      <ChevronDown className={`w-4 h-4 transform transition-transform ${isDevToolsExpanded ? "rotate-180" : ""}`} />
                    </button>

                    {isDevToolsExpanded && (
                      <div className="mt-3 space-y-3.5 pb-2">
                        {/* Appointments diagnosis */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-100/50 dark:border-blue-900/30 text-xs">
                          <span className="font-bold text-blue-800 dark:text-blue-400 block mb-1">
                            {t("appointmentsLength").replace("{name}", localUser.name)} ({appointments.length}):
                          </span>
                          {appointments.length > 0 ? (
                            <ul className="list-disc leading-normal list-inside pl-1 mt-1 text-slate-600 dark:text-slate-400 text-[11px]">
                              {appointments.map((a, i) => (
                                <li key={i}>{a.doctorName} - {a.specialty} ({a.date})</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-slate-500 text-[11px]">No appointments registered.</p>
                          )}
                        </div>

                        {/* Supabase Status */}
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30 text-[11px] text-emerald-800 dark:text-emerald-400 leading-normal flex items-start space-x-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">{t("supabaseStatus")}</span>
                            <p className="mt-0.5">
                              {session ? (
                                <>✅ {t("supabaseActive")} — {user?.email}</>
                              ) : (
                                <>⚠️ {t("supabaseInactive")}</>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Gemini AI Status */}
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100/50 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-400 leading-normal flex items-start space-x-2">
                          <Info className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">{t("geminiActive")}</span>
                            <p className="mt-0.5 text-slate-600 dark:text-slate-400">{t("geminiActiveDesc")}</p>
                          </div>
                        </div>

                        {/* Reset Local DB Button */}
                        <button
                          onClick={handleResetApp}
                          className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-98 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>{t("resetDb")}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 dark:text-slate-600 text-center pt-3 border-t border-slate-100 dark:border-slate-800">
                    {t("appVersion")}
                  </div>
                </div>
              ) : settingsSubView === "guide" ? (
                // --- USER GUIDE VIEW ---
                <div className="space-y-6">
                  {/* Stepper Wizard content */}
                  <div className="flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-150/40 dark:border-slate-800/80 min-h-[220px] justify-center">
                    <div className="mb-4 transform scale-110">
                      {[
                        <MessageSquare className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-pulse" />,
                        <MapPin className="w-12 h-12 text-emerald-600 dark:text-emerald-400 animate-pulse" />,
                        <Search className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-pulse" />,
                        <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-400 animate-pulse" />
                      ][guideStep - 1]}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500 mb-1">
                      {language === "es" ? `Paso ${guideStep} de 4` : `Step ${guideStep} of 4`}
                    </span>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-2 leading-tight">
                      {[
                        t("guideStep1Title"),
                        t("guideStep2Title"),
                        t("guideStep3Title"),
                        t("guideStep4Title")
                      ][guideStep - 1]}
                    </h4>
                    <p className="text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400 max-w-[280px]">
                      {[
                        t("guideStep1Desc"),
                        t("guideStep2Desc"),
                        t("guideStep3Desc"),
                        t("guideStep4Desc")
                      ][guideStep - 1]}
                    </p>
                  </div>

                  {/* Wizard Dots navigation */}
                  <div className="flex justify-center gap-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <button
                        key={step}
                        onClick={() => setGuideStep(step)}
                        className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${guideStep === step ? "w-6 bg-blue-600" : "w-2.5 bg-slate-200 dark:bg-slate-700"
                          }`}
                      />
                    ))}
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setSettingsSubView("main")}
                      className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      {t("back")}
                    </button>
                    <div className="flex gap-2">
                      {guideStep > 1 && (
                        <button
                          onClick={() => setGuideStep((prev) => prev - 1)}
                          className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          {language === "es" ? "Anterior" : "Back"}
                        </button>
                      )}
                      {guideStep < 4 ? (
                        <button
                          onClick={() => setGuideStep((prev) => prev + 1)}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
                        >
                          {language === "es" ? "Siguiente" : "Next"}
                        </button>
                      ) : (
                        <button
                          onClick={() => setSettingsSubView("main")}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
                        >
                          {language === "es" ? "Finalizar" : "Finish"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // --- LEGAL DOCUMENTS VIEW (TERMS & PRIVACY) ---
                <div className="space-y-4">
                  {/* Scrollable content container */}
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-150/50 dark:border-slate-800/80 max-h-[300px] overflow-y-auto">
                    {settingsSubView === "terms" ? (
                      <div className="space-y-3 text-[12px] leading-relaxed text-slate-650 dark:text-slate-350">
                        <h4 className="font-bold text-[13px] text-slate-900 dark:text-white uppercase tracking-wide border-b border-slate-100 dark:border-slate-850 pb-1.5 mb-2">
                          {t("terms")}
                        </h4>
                        {language === "es" ? (
                          <div className="space-y-3">
                            <p><strong>1. Aceptación de los Términos:</strong> Al usar Salud-Conecta IA, usted acepta voluntariamente estos términos de servicio.</p>
                            <p><strong>2. Sin Carácter Clínico Directo:</strong> Este sistema es un triaje automatizado basado en Inteligencia Artificial y no sustituye el criterio, consejo, diagnóstico o tratamiento de un médico profesional.</p>
                            <p><strong>3. Responsabilidad:</strong> No nos hacemos responsables de las decisiones de salud personales tomadas basándose únicamente en las respuestas de la IA.</p>
                            <p><strong>4. Línea de Emergencia:</strong> En caso de sospechar peligro o riesgo vital, debe comunicarse inmediatamente con la Cruz Roja llamando a la línea 128.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p><strong>1. Acceptance of Terms:</strong> By using Salud-Conecta AI, you voluntarily agree to these terms of service.</p>
                            <p><strong>2. No Direct Clinical Value:</strong> This system is an automated triage based on Artificial Intelligence and does not replace the criteria, advice, diagnosis, or treatment of a medical professional.</p>
                            <p><strong>3. Liability:</strong> We are not responsible for any personal health decisions made solely based on the responses provided by the AI.</p>
                            <p><strong>4. Emergency Hotline:</strong> In case of suspected danger or life-threat, you must immediately call the Red Cross at 128.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 text-[12px] leading-relaxed text-slate-650 dark:text-slate-350">
                        <h4 className="font-bold text-[13px] text-slate-900 dark:text-white uppercase tracking-wide border-b border-slate-100 dark:border-slate-850 pb-1.5 mb-2">
                          {t("privacy")}
                        </h4>
                        {language === "es" ? (
                          <div className="space-y-3">
                            <p><strong>1. Cumplimiento de Privacidad:</strong> Cumplimos estrictamente con las directrices HIPAA y GDPR para salvaguardar su información de salud.</p>
                            <p><strong>2. Procesamiento Anónimo:</strong> Las conversaciones médicas y los síntomas ingresados se anonimizan completamente antes de procesarse y nunca se asocian con datos personales identificables.</p>
                            <p><strong>3. Datos de Perfil:</strong> Su información personal de perfil y el historial de citas se almacenan de manera encriptada y segura en su dispositivo local y en servidores seguros Supabase.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p><strong>1. Privacy Compliance:</strong> We strictly comply with HIPAA and GDPR guidelines to safeguard your health information.</p>
                            <p><strong>2. Anonymous Processing:</strong> Medical conversations and symptoms entered are fully anonymized before processing and are never associated with identifiable personal data.</p>
                            <p><strong>3. Profile Data:</strong> Your personal profile details and appointment history are stored securely and encrypted on your local device and secure Supabase servers.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Back button */}
                  <div className="flex justify-start pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setSettingsSubView("main")}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      {t("back")}
                    </button>
                  </div>
                </div>
              )}
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
