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
import { updateUserProfile } from "./lib/authService";
import { useLanguage } from "./contexts/LanguageContext";
import { DEFAULT_USER, INITIAL_APPOINTMENTS } from "./data/medicalData";
import { UserProfile, Appointment } from "./types";
import { MessageSquare, MapPin, Search, Sparkles, Siren, X, Settings, RefreshCw, Eye, Star, Info, ShieldAlert, Loader2, Moon, Sun, Type, Languages, FileText, Shield, BookOpen, ChevronRight, ArrowLeft, Download } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const { user, profile, session, loading: authLoading, initialized, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [currentView, setCurrentView] = useState<"login" | "register" | "home" | "consulta" | "centros" | "buscar" | "premium" | "perfil">("login");
  const [localUser, setLocalUser] = useState<UserProfile>(DEFAULT_USER);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [isPremium, setIsPremium] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<"menu" | "terms" | "privacy" | "guide">("menu");
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosGuideModal, setShowIosGuideModal] = useState(false);
  const [showPwaBanner, setShowPwaBanner] = useState<boolean>(() => {
    try {
      const dismissed = localStorage.getItem("dismissedPwaBanner");
      if (dismissed === "true") return false;
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
      if (isStandalone) return false;
      return true;
    } catch (e) {
      return true;
    }
  });

  // Font Size state
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">(() => {
    try {
      return (localStorage.getItem("fontSize") as "sm" | "base" | "lg") || "base";
    } catch (e) {
      return "base";
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
      if (fontSize === "sm") {
        root.style.fontSize = "14px";
      } else if (fontSize === "lg") {
        root.style.fontSize = "18px";
      } else {
        root.style.fontSize = "16px";
      }
      localStorage.setItem("fontSize", fontSize);
    } catch (e) {
      console.warn("Failed to set font size:", e);
    }
  }, [fontSize]);


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

  // Carga inicial del perfil desde caché local para evitar parpadeos visuales en móviles
  useEffect(() => {
    if (initialized && user && user.id !== "guest") {
      try {
        const cachedAvatar = localStorage.getItem(`avatar_${user.id}`);
        const cachedName = localStorage.getItem(`name_${user.id}`);
        const cachedCity = localStorage.getItem(`city_${user.id}`);
        const cachedCountry = localStorage.getItem(`country_${user.id}`);

        if (cachedAvatar || cachedName || cachedCity || cachedCountry) {
          setLocalUser((prev) => ({
            ...prev,
            id: user.id,
            email: user.email || prev.email,
            name: cachedName || prev.name,
            city: cachedCity || prev.city,
            country: cachedCountry || prev.country,
            avatarUrl: cachedAvatar || prev.avatarUrl,
          }));
        }
      } catch (err) {
        console.warn("Error al recuperar datos de perfil de cache:", err);
      }
    }
  }, [initialized, user]);

  // Sync profile data from Supabase to local state con persistencia en caché
  useEffect(() => {
    if (profile) {
      setLocalUser((prev) => {
        const updatedAvatar = profile.avatar_url || "";
        const updatedName = profile.nombre || prev.name;
        const updatedCity = profile.ciudad || prev.city;
        const updatedCountry = profile.pais || prev.country;

        if (profile.id) {
          try {
            localStorage.setItem(`avatar_${profile.id}`, updatedAvatar);
            localStorage.setItem(`name_${profile.id}`, updatedName);
            localStorage.setItem(`city_${profile.id}`, updatedCity);
            localStorage.setItem(`country_${profile.id}`, updatedCountry);
          } catch (e) {
            console.warn("Could not cache profile data:", e);
          }
        }

        return {
          ...prev,
          id: profile.id || prev.id,
          name: updatedName,
          email: profile.email || prev.email,
          city: updatedCity,
          country: updatedCountry,
          avatarUrl: updatedAvatar,
        };
      });
    }
  }, [profile]);

  // ─── Toast Management ──────────────────────────────────────
  const addToast = useCallback((toast: ToastData) => {
    setToasts((prev) => [...prev, toast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen for PWA beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log("[PWA] beforeinstallprompt event captured, saved for later");
      setDeferredPrompt(e);
      try {
        const dismissed = localStorage.getItem("dismissedPwaBanner");
        if (dismissed !== "true") {
          setShowPwaBanner(true);
          console.log("[PWA] Banner will be shown");
        } else {
          console.log("[PWA] Banner hidden (previously dismissed)");
        }
      } catch (err) {
        console.log("[PWA] localStorage error, showing banner anyway");
        setShowPwaBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    console.log("[PWA] beforeinstallprompt listener registered");

    const handleAppInstalled = () => {
      console.log("[PWA] App installed successfully");
      setShowPwaBanner(false);
      setDeferredPrompt(null);
      addToast(createToast(t("pwaSuccessToast"), "success"));
      try {
        localStorage.setItem("dismissedPwaBanner", "true");
      } catch (e) {}
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [t, addToast]);

  const handleInstallPwa = async () => {
    console.log("[PWA] Install button clicked, deferredPrompt is:", deferredPrompt ? "available" : "null");
    
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        console.log("[PWA] prompt() called");
        
        deferredPrompt.userChoice.then((choiceResult: any) => {
          console.log("[PWA] User choice:", choiceResult.outcome);
          if (choiceResult.outcome === "accepted") {
            addToast(createToast(t("pwaSuccessToast"), "success"));
            setShowPwaBanner(false);
            try {
              localStorage.setItem("dismissedPwaBanner", "true");
            } catch (e) {}
          }
          setDeferredPrompt(null);
        });
      } catch (error) {
        console.error("[PWA] Error calling prompt():", error);
        addToast(createToast("Error al intentar instalar. Por favor intenta de nuevo.", "error"));
      }
    } else {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIos = /iphone|ipad|ipod/.test(userAgent);
      console.log("[PWA] No deferredPrompt available. iOS:", isIos);
      
      if (isIos) {
        setShowIosGuideModal(true);
      } else {
        addToast(createToast("Usa el botón de instalación en la barra de direcciones del navegador.", "info"));
      }
    }
  };

  // ─── Handlers ──────────────────────────────────────────────
  const handleLoginSuccess = (idOrName: string) => {
    if (idOrName === "guest") {
      setLocalUser({
        ...DEFAULT_USER,
        id: "guest",
        name: "Invitado",
        email: "invitado@salud-conecta.ia",
      });
    }
    setCurrentView("home");
  };

  const handleRegisterSuccess = (name: string) => {
    // Profile sync happens via useEffect above
    setCurrentView("home");
  };

  const handleAddAppointment = (newApp: Appointment) => {
    setAppointments((prev) => [newApp, ...prev]);
  };

  const handleUpdateUser = async (updatedUser: UserProfile) => {
    setLocalUser(updatedUser);

    // Guardar cambios en Supabase si no es usuario invitado
    if (user && user.id !== "guest") {
      try {
        const { success, error } = await updateUserProfile(user.id, {
          nombre: updatedUser.name,
          ciudad: updatedUser.city,
          full_name: updatedUser.name,
        } as any);

        if (success) {
          addToast(createToast("Perfil guardado en la base de datos.", "success"));
        } else {
          addToast(createToast(error || "Error al sincronizar perfil con la base de datos.", "error"));
        }
      } catch (err) {
        console.error("Error updating profile:", err);
        addToast(createToast("Error inesperado al guardar los cambios del perfil.", "error"));
      }
    }
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
      <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] dark:from-slate-900 dark:to-slate-950 flex items-center justify-center">
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
          <p className="text-sm text-slate-500 font-semibold">{t('verifyingSession')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans select-none overflow-x-hidden antialiased">

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* DESKTOP SIDEBAR NAVIGATION (Solo visible en Laptop/PC) */}
      {currentView !== "login" && currentView !== "register" && (
        <aside className="hidden md:flex flex-col w-[260px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed inset-y-0 left-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView("home")}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-base">S</span>
            </div>
            <span className="font-display font-bold text-xl text-slate-800 dark:text-white tracking-tight">
              Salud <span className="text-blue-600">IA</span>
            </span>
          </div>

          <div className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto mt-2">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 pl-3">{t('mainMenu')}</div>

            {[
              { id: "home", label: t('home'), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
              { id: "consulta", label: t('consulta'), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
              { id: "centros", label: t('centros'), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg> },
              { id: "buscar", label: t('buscar'), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> },
              { id: "premium", label: t('premium'), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 12l10 10 10-10z" /></svg> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as any)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all ${currentView === tab.id
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold shadow-sm border border-blue-100/50 dark:border-blue-900/50"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium border border-transparent"
                  }`}
              >
                <div className={`w-5 h-5 ${currentView === tab.id ? "fill-current/20" : ""}`}>{tab.icon}</div>
                <span className="text-[13.5px]">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Bottom Profile Section */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setCurrentView("perfil")} className={`flex items-center gap-3 w-full p-2.5 rounded-2xl transition-all border ${currentView === "perfil" ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" : "hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent"} text-left`}>
              {localUser.avatarUrl ? (
                <img src={localUser.avatarUrl} alt={localUser.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm select-none shrink-0">
                  {localUser.name ? localUser.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {(localUser.id === "guest" || localUser.name === "Invitado") ? t('guest') : localUser.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">{localUser.email}</p>
              </div>
            </button>
          </div>
        </aside>
      )}

      {/* Dynamic Content Views based on Router State (Con padding lateral en Laptop para centrado perfecto) */}
      <div className={`flex-1 w-full bg-white dark:bg-slate-950 min-h-screen flex flex-col relative pb-20 md:pb-0 ${currentView !== "login" && currentView !== "register" ? "md:pl-[260px]" : ""}`}>

        {/* PWA Download/Install Banner */}
        <AnimatePresence>
          {showPwaBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm border-b border-blue-500/20 z-40 relative px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 overflow-hidden"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4.5 h-4.5 text-blue-200 animate-pulse" />
                </div>
                <div className="text-left">
                  <h4 className="font-display font-bold text-xs sm:text-sm tracking-tight">{t("pwaBannerTitle")}</h4>
                  <p className="text-[10px] sm:text-xs text-blue-100 font-normal max-w-2xl leading-normal">{t("pwaBannerDesc")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <button
                  onClick={handleInstallPwa}
                  className="bg-white text-blue-600 hover:bg-blue-50 active:scale-95 px-3.5 py-1.5 rounded-xl font-bold text-[11px] shadow-sm transition-all flex items-center gap-1.5 w-full sm:w-auto justify-center cursor-pointer font-sans"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t("pwaInstallButton")}</span>
                </button>
                <button
                  onClick={() => {
                    setShowPwaBanner(false);
                    try {
                      localStorage.setItem("dismissedPwaBanner", "true");
                    } catch (e) {}
                  }}
                  className="p-1.5 hover:bg-white/10 active:scale-95 rounded-lg text-blue-100 hover:text-white transition-all shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                user={localUser}
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
          <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 z-40 w-full border-t border-slate-100 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.03)] pb-safe-bottom md:hidden">
            <div className="grid grid-cols-4 p-2.5 pt-3 pb-5 relative font-sans">

              {/* Tab 1: Consulta */}
              <button
                id="btn-nav-consulta"
                onClick={() => setCurrentView("consulta")}
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${currentView === "consulta" ? "text-[#1d4ed8] dark:text-blue-400" : "text-[#94a3b8] dark:text-slate-500 hover:text-[#475569] dark:hover:text-slate-300"
                  }`}
              >
                <div className="p-1 mb-0.5">
                  <svg className={`w-[25px] h-[25px] ${currentView === "consulta" ? "fill-current" : ""}`} viewBox="0 0 24 24" fill={currentView === "consulta" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span className={`text-[11.5px] tracking-tight font-medium ${currentView === "consulta" ? "font-semibold text-[#1d4ed8] dark:text-blue-400" : "text-[#94a3b8] dark:text-slate-500"}`}>
                  {t('consulta')}
                </span>
                {/* Active indicator dot/lines */}
                {currentView === "consulta" && (
                  <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-[#1d4ed8] dark:text-blue-400 font-bold text-xs tracking-[1.5px] leading-none">...</span>
                )}
              </button>

              {/* Tab 2: Centros */}
              <button
                id="btn-nav-centros"
                onClick={() => setCurrentView("centros")}
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${currentView === "centros" ? "text-[#1d4ed8] dark:text-blue-400" : "text-[#94a3b8] dark:text-slate-500 hover:text-[#475569] dark:hover:text-slate-300"
                  }`}
              >
                <div className="p-1 mb-0.5">
                  <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <span className={`text-[11.5px] tracking-tight font-medium ${currentView === "centros" ? "font-semibold text-[#1d4ed8] dark:text-blue-400" : "text-[#94a3b8] dark:text-slate-500"}`}>
                  {t('centros')}
                </span>
                {currentView === "centros" && (
                  <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-[#1d4ed8] dark:text-blue-400 font-bold text-xs tracking-[1.5px] leading-none">...</span>
                )}
              </button>

              {/* Tab 3: Buscar */}
              <button
                id="btn-nav-buscar"
                onClick={() => setCurrentView("buscar")}
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${currentView === "buscar" ? "text-[#1d4ed8] dark:text-blue-400" : "text-[#94a3b8] dark:text-slate-500 hover:text-[#475569] dark:hover:text-slate-300"
                  }`}
              >
                <div className="p-1 mb-0.5">
                  <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <span className={`text-[11.5px] tracking-tight font-medium ${currentView === "buscar" ? "font-semibold text-[#1d4ed8] dark:text-blue-400" : "text-[#94a3b8] dark:text-slate-500"}`}>
                  {t('buscar')}
                </span>
                {currentView === "buscar" && (
                  <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-[#1d4ed8] dark:text-blue-400 font-bold text-xs tracking-[1.5px] leading-none">...</span>
                )}
              </button>

              {/* Tab 4: Premium */}
              <button
                id="btn-nav-premium"
                onClick={() => setCurrentView("premium")}
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${currentView === "premium" ? "text-[#1d4ed8] dark:text-blue-400" : "text-[#94a3b8] dark:text-slate-500 hover:text-[#475569] dark:hover:text-slate-300"
                  }`}
              >
                <div className="p-1 mb-0.5">
                  <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 12l10 10 10-10z" />
                  </svg>
                </div>
                <span className={`text-[11.5px] tracking-tight font-medium ${currentView === "premium" ? "font-semibold text-[#1d4ed8] dark:text-blue-400" : "text-[#94a3b8] dark:text-slate-500"}`}>
                  {t('premium')}
                </span>
                {currentView === "premium" && (
                  <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-[#1d4ed8] dark:text-blue-400 font-bold text-xs tracking-[1.5px] leading-none">...</span>
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
                      {settingsView === "menu" && t('settings')}
                      {settingsView === "terms" && t('terms')}
                      {settingsView === "privacy" && t('privacy')}
                      {settingsView === "guide" && t('guide')}
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
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t('appearance')}</h4>

                        {/* Dark Mode Toggle */}
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${darkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-amber-500/10 text-amber-500"}`}>
                              {darkMode ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('darkMode')}</span>
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
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('fontSize')}</span>
                          </div>
                          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                            {(["sm", "base", "lg"] as const).map((size) => (
                              <button
                                key={size}
                                onClick={() => setFontSize(size)}
                                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${fontSize === size ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                              >
                                {size === "sm" && t('small')}
                                {size === "base" && t('normal')}
                                {size === "lg" && t('large')}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Region Section */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t('regional')}</h4>
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                              <Languages className="w-4.5 h-4.5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('language')}</span>
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
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t('legalInfo')}</h4>
                        <div className="space-y-2">
                          {[
                            { id: "terms", label: t('terms'), icon: FileText, color: "text-slate-500" },
                            { id: "privacy", label: t('privacy'), icon: Shield, color: "text-slate-500" },
                            { id: "guide", label: t('guide'), icon: BookOpen, color: "text-slate-500" },
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
                          <span>{t('resetApp')}</span>
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
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('termsTitle')}</h4>
                      <p>{t('welcome')} a Salud-Conecta IA. {t('agreeToTerms')}:</p>
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
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('privacyTitle')}</h4>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 flex gap-3">
                        <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <p className="text-emerald-800 dark:text-emerald-400 font-medium">{t('infoProtected')}</p>
                      </div>
                      <p>{t('privacyFirst')}:</p>
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
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('guideTitle')}</h4>
                      <div className="space-y-3">
                        {[
                          { step: "1", title: t('aiConsultation'), desc: t('howYouFeel') },
                          { step: "2", title: t('centros'), desc: t('findCenters') },
                          { step: "3", title: t('myAppointments'), desc: t('manageAppointments') },
                          { step: "4", title: t('emergencyCard'), desc: t('qrDisclaimer') },
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
                Salud-Conecta IA • {t('version')}
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
              className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-[380px] p-6 shadow-[0_20px_50px_rgba(251,113,133,0.08)] border border-rose-50 dark:border-rose-900/10 relative overflow-hidden"
            >
              {/* Subtle top decoration */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-rose-400" />

              {/* Pulse alert icon container */}
              <div className="flex flex-col items-center text-center mt-3 mb-5">
                <div className="w-[74px] h-[74px] rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center relative mb-4">
                  {/* Ping effect */}
                  <span className="absolute inline-flex h-full w-full rounded-full bg-rose-100 dark:bg-rose-500/20 animate-ping opacity-75" />

                  {/* Inner dark red icon container */}
                  <div className="w-[56px] h-[56px] rounded-full bg-rose-400 flex items-center justify-center text-white shadow-[0_4px_16px_rgba(251,113,133,0.25)] relative z-10">
                    <Siren className="w-[28px] h-[28px] animate-pulse" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Llamada de Emergencia
                </h3>
                <p className="text-xs text-rose-400 font-bold uppercase tracking-wider mt-1 font-mono">
                  Cruz Roja • Línea 128
                </p>
              </div>

              {/* Informative Guidance Content */}
              <div className="space-y-4 mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>

                {/* When to call */}
                <div className="bg-emerald-50/60 dark:bg-emerald-500/10 rounded-[20px] p-3.5 border border-emerald-100/50 dark:border-emerald-500/20">
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    ¿Cuándo sí debes llamar?
                  </span>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pl-1 leading-relaxed">
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
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[20px] p-3.5 border border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                    ¿Cuándo usar la Consulta IA en su lugar?
                  </span>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pl-1 leading-relaxed">
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
                  className="w-full py-3.5 bg-rose-400 text-white font-bold text-sm tracking-wide rounded-2xl shadow-[0_6px_20px_rgba(251,113,133,0.2)] hover:brightness-105 transition-all flex items-center justify-center gap-2"
                >
                  <Siren className="w-4.5 h-4.5" />
                  <span>Llamar al 128 ahora</span>
                </motion.a>

                <button
                  onClick={() => setIsEmergencyModalOpen(false)}
                  className="w-full py-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-bold text-[13px] tracking-wide transition-colors active:scale-95"
                >
                  Cancelar
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS PWA Installation Guide Modal */}
      <AnimatePresence>
        {showIosGuideModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 select-none"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200"
            >
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                  <span>Instalar en iOS</span>
                </h3>
                <button
                  onClick={() => setShowIosGuideModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Sigue estos pasos en tu dispositivo Apple para agregar la aplicación a tu pantalla de inicio:
                </p>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold shrink-0">
                      1
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">Abre Safari</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                        Asegúrate de estar usando el navegador Safari oficial.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold shrink-0">
                      2
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        Presiona compartir
                        <span className="inline-block p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                            <polyline points="16 6 12 2 8 6" />
                            <line x1="12" y1="2" x2="12" y2="15" />
                          </svg>
                        </span>
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                        Toca el botón "Compartir" en la barra de herramientas inferior.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold shrink-0">
                      3
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        Agregar a Inicio
                        <span className="inline-block p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </span>
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                        Desplázate hacia abajo y selecciona la opción "Agregar a la pantalla de inicio".
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowIosGuideModal(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-2xl shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
