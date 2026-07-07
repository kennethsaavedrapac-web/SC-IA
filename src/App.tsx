import React, { useState, useEffect, useCallback, Suspense } from "react";
import HomeView from "./components/HomeView";
import ConsultaView from "./components/ConsultaView";
import CentrosView from "./components/CentrosView";
import PremiumView from "./components/PremiumView";
import PerfilView from "./components/PerfilView";
import LoginView from "./components/LoginView";
import RegisterView from "./components/RegisterView";
import AdminView from "./components/AdminView";
import AnnouncementModal from "./components/AnnouncementModal";
import { ToastContainer, createToast, type ToastData } from "./components/Toast";
import { useAuth } from "./contexts/AuthContext";
import { updateUserProfile } from "./lib/authService";
import { useLanguage } from "./contexts/LanguageContext";
import { DEFAULT_USER, INITIAL_APPOINTMENTS } from "./data/medicalData";
import { UserProfile, Appointment } from "./types";
import { requestNotificationPermission, showDailyNotification, saveAdminAnnouncementRecords } from "./lib/notificationService";
import { showUpdateNotification, checkForUpdates, APP_VERSION } from "./lib/updateNotification";
import { Sparkles, Siren, X, Settings, RefreshCw, ShieldAlert, Loader2, Moon, Sun, Type, Languages, FileText, Shield, BookOpen, ChevronRight, ArrowLeft, Download, WifiOff, LogOut, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "./lib/supabaseClient";

const LoadingFallback = ({ text = "Cargando módulo..." }: { text?: string }) => (
  <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center">
    <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-4" />
    <span className="text-sm font-semibold text-slate-500">{text}</span>
  </div>
);

export default function App() {
  const { user, profile, session, loading: authLoading, initialized, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [currentView, setCurrentView] = useState<"login" | "register" | "home" | "consulta" | "buscar" | "premium" | "perfil" | "admin">("login");
  const [localUser, setLocalUser] = useState<UserProfile>(DEFAULT_USER);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [isPremium, setIsPremium] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<"menu" | "terms" | "privacy" | "guide">("menu");
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosGuideModal, setShowIosGuideModal] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState<boolean>(false);

  useEffect(() => {
    const checkPwaBanner = () => {
      const dismissed = localStorage.getItem("dismissedPwaBanner");
      if (dismissed === "true") return;
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
      if (isStandalone) return;
      setShowPwaBanner(true);
    };
    checkPwaBanner();
  }, []);

  
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>(() => {
    try {
      if (typeof window === 'undefined') return [];
      return JSON.parse(localStorage.getItem("dismissedAnnouncements") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        if (!supabase) return;
        const { data, error } = await supabase.from('admin_announcements').select('*').eq('activo', true);
        if (!error && data) {
          const now = new Date();
          const active = data.filter((a: any) => {
            
            const start = new Date(a.fecha_inicio + "T00:00:00");
            const end = new Date(a.fecha_fin + "T23:59:59");
            return now >= start && now <= end && !dismissedAnnouncements.includes(a.id);
          });
          if (user?.id) {
            saveAdminAnnouncementRecords(user.id, active.map((announcement: any) => ({
              id: announcement.id,
              tipo: announcement.tipo,
              titulo: announcement.titulo,
              mensaje: announcement.mensaje,
            })));
          }
          setAnnouncements(active);
        }
        
        if (error) console.warn("Nota: Tabla de anuncios no disponible aún.");
      } catch (err) {
        console.error("Error fetching announcements", err);
      }
    };
    fetchAnnouncements();

    
    const announcementsSub = supabase
      .channel('announcements-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_announcements' },
        () => {
          fetchAnnouncements(); 
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(announcementsSub); };
  }, [dismissedAnnouncements, user?.id]);

  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('app_settings').select('valor').eq('clave', 'global_config').single();
        if (!error && data) {
          setGlobalSettings(data.valor);
        }
      } catch (err) {
        console.error("Error fetching global settings:", err);
      }
    };
    fetchSettings();

    
    const settingsSub = supabase
      .channel('global-settings-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: "clave=eq.global_config" },
        (payload) => {
          if (payload.new && payload.new.valor) {
            setGlobalSettings(payload.new.valor);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(settingsSub); };
  }, []);

  const featureFlags = globalSettings?.featureFlags || { premiumFeatures: true, healthUnitSearch: true, appointmentBooking: true, emergencyCard: true };
  const maintenanceMode = globalSettings?.maintenanceMode || false;
  const profileRole = (profile as any)?.role ?? (profile as any)?.rol;
  const isMaintenanceBlocked = maintenanceMode && profile && profileRole !== 'admin';

  
  useEffect(() => {
    if (globalSettings) {
      if (currentView === "buscar" && !featureFlags.healthUnitSearch) setCurrentView("home");
      if (currentView === "premium" && !featureFlags.premiumFeatures) setCurrentView("home");
    }
  }, [currentView, featureFlags, globalSettings]);

  
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">(() => {
    return (localStorage.getItem("fontSize") as "sm" | "base" | "lg") || "base";
  });

  
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const initializeDarkMode = () => {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        setDarkMode(savedTheme === "dark");
        return;
      }
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setDarkMode(true);
      }
    };
    initializeDarkMode();
  }, []);

  
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


  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  
  
  useEffect(() => {
    if (!initialized) return;

    if (session && user) {
      
      if (currentView === "login" || currentView === "register") {
        setCurrentView("home");
      }

      
      requestNotificationPermission().then((granted) => {
        if (granted) {
          showDailyNotification(user.id);
        }
      });
    } else {
      
      if (currentView !== "login" && currentView !== "register") {
        setCurrentView("login");
      }
    }
  }, [session, user, initialized]);

  
  useEffect(() => {
    if (initialized && user && user.id !== "guest") {
      try {
        const cachedAvatar = localStorage.getItem(`avatar_${user.id}`);
        const cachedName = localStorage.getItem(`name_${user.id}`);
        const cachedCity = localStorage.getItem(`city_${user.id}`);
        const cachedCountry = localStorage.getItem(`country_${user.id}`);
        const cachedEmail = localStorage.getItem(`email_${user.id}`);
        const cachedPhone = localStorage.getItem(`phone_${user.id}`);
        const cachedBloodType = localStorage.getItem(`bloodType_${user.id}`);
        const cachedConditions = localStorage.getItem(`conditions_${user.id}`);

        // Decrypt medical data from localStorage (simple base64 encoding to avoid plaintext storage)
        function decryptMedicalData(encoded: string): string | null {
          try {
            return encoded ? atob(encoded) : null;
          } catch {
            return null;
          }
        }

        const decryptedConditions = cachedConditions ? decryptMedicalData(cachedConditions) : null;

        if (cachedAvatar || cachedName || cachedCity || cachedCountry || cachedEmail || cachedPhone || cachedBloodType || cachedConditions) {
          setLocalUser((prev) => ({
            ...prev,
            id: user.id,
            email: cachedEmail || user.email || prev.email,
            name: cachedName || prev.name,
            city: cachedCity || prev.city,
            country: cachedCountry || prev.country,
            avatarUrl: cachedAvatar || prev.avatarUrl,
            emergencyPhone: cachedPhone || prev.emergencyPhone,
            bloodType: cachedBloodType || prev.bloodType,
            healthConditions: decryptedConditions ? JSON.parse(decryptedConditions) : prev.healthConditions,
          }));
        }
      } catch (err) {
        console.warn("Error al recuperar datos de perfil de cache:", err);
      }
    }
  }, [initialized, user]);

  
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

  const triggerUpdateNotification = useCallback((reg: ServiceWorkerRegistration, force = false) => {
    showUpdateNotification(() => {
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }, () => {
      console.log("[PWA] Actualización pospuesta.");
    }, force);
  }, []);

  const handleCheckForUpdates = async () => {
    setCheckingUpdates(true);
    // Simular un retraso de red de 1.5s para dar feedback visual premium
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (swRegistration) {
      const result = await checkForUpdates(swRegistration, true);
      if (result.updateFound) {
        setCheckingUpdates(false);
        setIsSettingsOpen(false);
        triggerUpdateNotification(swRegistration, true);
      } else {
        setCheckingUpdates(false);
        addToast(createToast(`${t('appUpToDate')} (${APP_VERSION})`, "success"));
      }
    } else {
      setCheckingUpdates(false);
      addToast(createToast(`${t('appUpToDate')} (${APP_VERSION})`, "success"));
    }
  };

  const dismissAnnouncement = (id: string) => {
    const updated = [...dismissedAnnouncements, id];
    setDismissedAnnouncements(updated);
    localStorage.setItem("dismissedAnnouncements", JSON.stringify(updated));
  };

  
  useEffect(() => {
    
    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => {
            console.log('[PWA] Service Worker registrado:', reg.scope);
            setSwRegistration(reg);

            
            if (reg.waiting) {
              triggerUpdateNotification(reg);
            }

            
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    triggerUpdateNotification(reg);
                  }
                });
              }
            });
          })
          .catch(err => console.error('[PWA] Error al registrar SW:', err));
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }

      
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Nuevo Service Worker en control.');
      });
    }

    
    const handleBeforeInstallPrompt = (e: any) => {
      
      e.preventDefault();
      
      setDeferredPrompt(e);

      
      try {
        const dismissed = localStorage.getItem("dismissedPwaBanner");
        if (dismissed !== "true") {
          setShowPwaBanner(true);
        }
      } catch (err) {
        setShowPwaBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    
    const handleAppInstalled = () => {
      console.log("[PWA] Aplicación instalada correctamente.");
      setShowPwaBanner(false);
      setDeferredPrompt(null);
      addToast(createToast(t("pwaSuccessToast"), "success"));
      try {
        localStorage.setItem("dismissedPwaBanner", "true");
      } catch (e) { }
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [t, addToast]);

  
  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      try {
        
        await deferredPrompt.prompt();

        
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] El usuario eligió: ${outcome}`);

        if (outcome === "accepted") {
          setShowPwaBanner(false);
          try {
            localStorage.setItem("dismissedPwaBanner", "true");
          } catch (e) { }
        }

        
        setDeferredPrompt(null);
      } catch (error) {
        console.error("[PWA] Error en el proceso de instalación:", error);
      }
    } else {
      
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIos = /iphone|ipad|ipod/.test(userAgent);

      if (isIos) {
        setShowIosGuideModal(true);
      } else {
        addToast(createToast(t('useBrowserMenu'), "info"));
      }
    }
  };

  
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
    
    setCurrentView("home");
  };

  const handleAddAppointment = (newApp: Appointment) => {
    setAppointments((prev) => [newApp, ...prev]);
  };

  const handleUpdateUser = async (updatedUser: UserProfile) => {
    setLocalUser(updatedUser);

    
    try {
      const userId = user?.id !== "guest" ? user?.id : "guest";
      if (userId) {
        localStorage.setItem(`name_${userId}`, updatedUser.name);
        localStorage.setItem(`email_${userId}`, updatedUser.email);
        localStorage.setItem(`city_${userId}`, updatedUser.city);
        localStorage.setItem(`country_${userId}`, updatedUser.country);
        if (updatedUser.emergencyPhone) localStorage.setItem(`phone_${userId}`, updatedUser.emergencyPhone);
        if (updatedUser.bloodType) localStorage.setItem(`bloodType_${userId}`, updatedUser.bloodType);
        // Store health conditions with basic encoding to avoid plaintext PII in localStorage
        if (updatedUser.healthConditions) {
          localStorage.setItem(`conditions_${userId}`, btoa(JSON.stringify(updatedUser.healthConditions)));
        }
      }
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    } finally {
      // Show local save success message immediately, regardless of remote sync
      addToast(createToast(t('saveSuccess'), "success"));
    }

    
    if (user && user.id !== "guest") {
      try {
        const { success, error } = await updateUserProfile(user.id, {
          nombre: updatedUser.name,
          ciudad: updatedUser.city,
          full_name: updatedUser.name,
        } as any);

        if (success) {
        } else {
          addToast(createToast(error || t('profileSaveError'), "error"));
        }
      } catch (err) {
        console.error("Error updating profile:", err);
        addToast(createToast(t('profileUnexpectedError'), "error"));
      }
    }
  };

  const handleUnlockPremium = () => {
    setIsPremium(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const result = await logout();
    setIsLoggingOut(false);
    setIsLogoutModalOpen(false);
    if (result.success) {
      setLocalUser(DEFAULT_USER);
      setAppointments(INITIAL_APPOINTMENTS);
      setIsPremium(false);
      setCurrentView("login");
      addToast(createToast(t('sessionClosed'), "info"));
    } else {
      addToast(createToast(result.error || t('sessionCloseError'), "error"));
    }
  };

  const handleResetApp = () => {
    setLocalUser(DEFAULT_USER);
    setAppointments(INITIAL_APPOINTMENTS);
    setIsPremium(false);
    setCurrentView("home");
    setIsSettingsOpen(false);
    setSettingsView("menu");
    addToast(createToast(t('appReset'), "info"));
  };

  
  if (!initialized) {
    return (
      <div className="splash-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-6"
        >
          {/* Logo con borde degradado y anillo de respiración */}
          <div className="splash-logo-container">
            <div className="splash-logo-ring neon-glow-subtle">
              <img
                src="/app-logo-v1.jpg"
                alt="Logo Salud-Conecta IA"
                className="splash-logo-img"
              />
            </div>
          </div>

          {/* Spinner neón */}
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-teal-bright, #00D4AA)' }} />

          {/* Texto con gradiente */}
          <div className="flex flex-col items-center gap-1.5">
            <h1 className="font-display font-bold text-lg tracking-tight text-slate-800 dark:text-white">
              Salud-Conecta <span className="gradient-accent-text">IA</span>
            </h1>
            <p className="text-sm font-medium" style={{ color: 'var(--color-texto-secundario)' }}>{t('verifyingSession')}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isMaintenanceBlocked) {
    return (
      <div className="min-h-dvh bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <ShieldAlert className="w-16 h-16 text-amber-500 mb-6" />
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{t('maintenanceTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
          {t('maintenanceDesc')}
        </p>
        <button onClick={handleLogout} className="px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold rounded-xl active:scale-95 transition-all text-sm">
          {t('logout')}
        </button>
      </div>
    );
  }

  const bottomNavCount = 1 + (featureFlags.healthUnitSearch ? 1 : 0) + (featureFlags.appointmentBooking ? 1 : 0) + (featureFlags.premiumFeatures ? 1 : 0);
  const gridColsClass = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[bottomNavCount] || "grid-cols-4";
  const hasBottomNav = currentView !== "perfil" && currentView !== "login" && currentView !== "register" && currentView !== "admin";

  return (
    <div className="min-h-dvh bg-white dark:bg-slate-950 flex flex-col font-sans select-none overflow-x-hidden antialiased">

      {}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {}
      {currentView !== "login" && currentView !== "register" && currentView !== "admin" && (
        <aside className="hidden md:flex flex-col w-[260px] fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#0A1222] border-r border-slate-200/80 dark:border-[#1A2A45]/80 shadow-[4px_0_32px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_32px_rgba(0,0,0,0.3)]">
          {/* ── Cabecera: Logo con borde degradado ─────────── */}
          <div className="p-6 flex items-center gap-3.5 cursor-pointer group" onClick={() => setCurrentView("home")}>
            <div className="p-[2px] rounded-xl bg-white dark:bg-transparent" style={{ background: 'var(--gradient-accent)' }}>
              <img
                src="/app-logo-v1.jpg"
                alt="Logo Salud-Conecta IA"
                className="w-9 h-9 rounded-[10px] object-cover bg-white dark:bg-[#0D1A2F] transition-transform group-hover:scale-105"
              />
            </div>
            <span className="font-display font-bold text-xl text-slate-800 dark:text-white tracking-tight">
              Salud-Conecta <span className="gradient-accent-text">IA</span>
            </span>
          </div>

          {/* ── Menú principal ─────────────────────────────── */}
          <div className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto mt-2">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 pl-3">{t('mainMenu')}</div>

            {[
              { id: "home", label: t('home'), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
              { id: "consulta", label: t('consulta'), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M12 7l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" /><path d="M16 10l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5.5-1z" /></svg> },
              ...(featureFlags.healthUnitSearch ? [{ id: "buscar", label: t('buscar'), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> }] : []),
              ...(featureFlags.premiumFeatures ? [{ id: "premium", label: t('premium'), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" /></svg> }] : []),
              ...(profileRole === "admin" ? [{ id: "admin", label: t('adminPanel'), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="21" x2="9" y2="9" /><line x1="3" y1="9" x2="21" y2="9" /></svg> }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as any)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all relative overflow-hidden ${currentView === tab.id
                  ? "bg-brand-50/80 dark:bg-[#0D2A3A]/60 font-bold shadow-sm border border-brand-200/50 dark:border-[#0D5F50]/50"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#111E36]/60 hover:text-slate-900 dark:hover:text-white font-medium border border-transparent"
                  }`}
                style={currentView === tab.id ? { color: 'var(--color-teal-bright, #00D4AA)' } : undefined}
              >
                {/* Borde izquierdo degradado para item activo */}
                {currentView === tab.id && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
                    style={{ background: 'var(--gradient-accent)' }}
                  />
                )}
                <div className={`w-5 h-5 ${currentView === tab.id ? "fill-current/20" : ""}`}>{tab.icon}</div>
                <span className="text-[13.5px]">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── Perfil de usuario ──────────────────────────── */}
          <div className="p-4 border-t border-slate-100 dark:border-[#1A2A45]/60">
            <button onClick={() => setCurrentView("perfil")} className={`flex items-center gap-3 w-full p-2.5 rounded-2xl transition-all border ${currentView === "perfil" ? "bg-slate-50 dark:bg-[#111E36] border-slate-200 dark:border-[#1A2A45]" : "hover:bg-slate-50 dark:hover:bg-[#111E36]/60 border-transparent"} text-left`}>
              {localUser.avatarUrl ? (
                <img src={localUser.avatarUrl} alt={localUser.name} className="w-10 h-10 rounded-full object-cover shadow-sm" style={{ border: '2px solid var(--color-teal, #00B4A0)' }} />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm select-none shrink-0" style={{ background: 'var(--gradient-accent)' }}>
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

      {}
      <div className={`health-app-bg flex-1 w-full flex flex-col relative ${currentView === "buscar" ? "h-[100dvh] overflow-hidden pb-0" : `min-h-screen ${hasBottomNav ? "pb-20" : "pb-0"}`} md:pb-0 ${currentView !== "login" && currentView !== "register" && currentView !== "admin" ? "md:pl-[260px]" : ""}`}>

        {}
        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full bg-slate-800 dark:bg-slate-900 text-white shadow-sm border-b border-slate-700/50 dark:border-slate-800 z-50 relative px-4 py-2 flex items-center justify-center gap-2 overflow-hidden"
            >
              <WifiOff className="w-4 h-4 text-slate-300" />
              <span className="text-xs font-medium text-slate-200">{t('offlineMsg')}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {}
        <AnimatePresence>
          {showPwaBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full bg-gradient-to-r from-brand-900 to-brand-600 text-white shadow-sm border-b border-brand-600/20 z-40 relative px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 overflow-hidden"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4.5 h-4.5 text-brand-200 animate-pulse" />
                </div>
                <div className="text-left">
                  <h4 className="font-display font-bold text-xs sm:text-sm tracking-tight">{t("pwaBannerTitle")}</h4>
                  <p className="text-[10px] sm:text-xs text-brand-100 font-normal max-w-2xl leading-normal">{t("pwaBannerDesc")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <button
                  id="btn-instalar"
                  onClick={handleInstallPwa}
                  className="bg-white text-brand-600 hover:bg-brand-50 active:scale-95 px-3.5 py-1.5 rounded-xl font-bold text-[11px] shadow-sm transition-all flex items-center gap-1.5 w-full sm:w-auto justify-center cursor-pointer font-sans"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t("pwaInstallButton")}</span>
                </button>
                <button
                  onClick={() => {
                    setShowPwaBanner(false);
                    try {
                      localStorage.setItem("dismissedPwaBanner", "true");
                    } catch (e) { }
                  }}
                  className="p-1.5 hover:bg-white/10 active:scale-95 rounded-lg text-brand-100 hover:text-white transition-all shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {}
        <AnimatePresence>
          {announcements.length > 0 && (
            <AnnouncementModal
              announcements={announcements}
              onDismiss={dismissAnnouncement}
            />
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
              <Suspense fallback={<LoadingFallback text={t('loadingModule')} />}>
                <LoginView
                  onLogin={handleLoginSuccess}
                  onNavigateToRegister={() => setCurrentView("register")}
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode(!darkMode)}
                  onToast={addToast}
                />
              </Suspense>
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
              <Suspense fallback={<LoadingFallback text={t('loadingModule')} />}>
                <RegisterView
                  onRegister={handleRegisterSuccess}
                  onNavigateToLogin={() => setCurrentView("login")}
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode(!darkMode)}
                  onToast={addToast}
                />
              </Suspense>
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
              <Suspense fallback={<LoadingFallback text={t('loadingModule')} />}>
                <HomeView
                  user={localUser}
                  onNavigate={(tab) => setCurrentView(tab)}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                />
              </Suspense>
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
              <Suspense fallback={<LoadingFallback text={t('loadingModule')} />}>
                <ConsultaView user={localUser} onNavigate={(tab) => setCurrentView(tab)} isPremium={isPremium} onTriggerEmergency={() => setIsEmergencyModalOpen(true)} />
              </Suspense>
            </motion.div>
          )}

          {currentView === "buscar" && featureFlags.healthUnitSearch && (
            <motion.div
              key="buscar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              <Suspense fallback={<LoadingFallback text={t('loadingModule')} />}>
                <CentrosView onNavigate={(tab) => setCurrentView(tab)} onTriggerEmergency={() => setIsEmergencyModalOpen(true)} />
              </Suspense>
            </motion.div>
          )}

          {currentView === "premium" && featureFlags.premiumFeatures && (
            <motion.div
              key="premium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              <Suspense fallback={<LoadingFallback text={t('loadingModule')} />}>
                <PremiumView
                  user={localUser}
                  isPremium={isPremium}
                  onUnlockPremium={handleUnlockPremium}
                  onNavigate={(tab) => setCurrentView(tab)}
                />
              </Suspense>
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
              <Suspense fallback={<LoadingFallback text={t('loadingModule')} />}>
                <PerfilView
                  user={localUser}
                  isPremium={isPremium}
                  onGoBack={() => setCurrentView("home")}
                  onUpdateUser={handleUpdateUser}
                  onLogout={() => setIsLogoutModalOpen(true)}
                  onGoToAdmin={profileRole === "admin" ? () => setCurrentView("admin") : undefined}
                />
              </Suspense>
            </motion.div>
          )}

          {currentView === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col h-screen"
            >
              <Suspense fallback={<LoadingFallback text={t('loadingModule')} />}>
                <AdminView onGoBack={() => setCurrentView("home")} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>

        {}
        {currentView !== "perfil" && currentView !== "login" && currentView !== "register" && currentView !== "admin" && (
          <nav className="fixed bottom-0 inset-x-0 z-40 w-full pb-safe-bottom md:hidden bg-white/90 dark:bg-[#0A1222]/85 backdrop-blur-xl border-t border-slate-200/60 dark:border-[#1A2A45]/50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">
            <div className={`grid ${gridColsClass} p-2.5 pt-3 pb-5 relative font-sans`}>

              {/* ── Inicio ──────────────────────────────────── */}
              <button
                id="btn-nav-home"
                onClick={() => setCurrentView("home")}
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${currentView === "home" ? "" : "text-[#94a3b8] dark:text-slate-500 hover:text-[#475569] dark:hover:text-slate-300"
                  }`}
                style={currentView === "home" ? { color: 'var(--color-teal-bright, #00D4AA)' } : undefined}
              >
                <div className="p-1 mb-0.5">
                  <svg className={`w-[25px] h-[25px] ${currentView === "home" ? "fill-current" : ""}`} viewBox="0 0 24 24" fill={currentView === "home" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <span className={`text-[11.5px] tracking-tight ${currentView === "home" ? "font-bold" : "font-medium text-[#94a3b8] dark:text-slate-500"}`}>
                  {t('home')}
                </span>
                {currentView === "home" && (
                  <span className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gradient-accent)' }} />
                )}
              </button>

              {/* ── Consulta ────────────────────────────────── */}
              <button
                id="btn-nav-consulta"
                onClick={() => setCurrentView("consulta")}
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${currentView === "consulta" ? "" : "text-[#94a3b8] dark:text-slate-500 hover:text-[#475569] dark:hover:text-slate-300"
                  }`}
                style={currentView === "consulta" ? { color: 'var(--color-teal-bright, #00D4AA)' } : undefined}
              >
                <div className="p-1 mb-0.5">
                  <svg className={`w-[25px] h-[25px] ${currentView === "consulta" ? "fill-current" : ""}`} viewBox="0 0 24 24" fill={currentView === "consulta" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <path d="M12 7l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
                    <path d="M16 10l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5.5-1z" />
                  </svg>
                </div>
                <span className={`text-[11.5px] tracking-tight ${currentView === "consulta" ? "font-bold" : "font-medium text-[#94a3b8] dark:text-slate-500"}`}>
                  {t('consulta')}
                </span>
                {currentView === "consulta" && (
                  <span className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gradient-accent)' }} />
                )}
              </button>

              {/* ── Buscar ──────────────────────────────────── */}
              {featureFlags.healthUnitSearch && (
                <button
                  id="btn-nav-buscar"
                  onClick={() => setCurrentView("buscar")}
                  className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${currentView === "buscar" ? "" : "text-[#94a3b8] dark:text-slate-500 hover:text-[#475569] dark:hover:text-slate-300"
                    }`}
                  style={currentView === "buscar" ? { color: 'var(--color-teal-bright, #00D4AA)' } : undefined}
                >
                  <div className="p-1 mb-0.5">
                    <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <span className={`text-[11.5px] tracking-tight ${currentView === "buscar" ? "font-bold" : "font-medium text-[#94a3b8] dark:text-slate-500"}`}>
                    {t('buscar')}
                  </span>
                  {currentView === "buscar" && (
                    <span className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gradient-accent)' }} />
                  )}
                </button>
              )}

              {/* ── Premium ─────────────────────────────────── */}
              {featureFlags.premiumFeatures && (
                <button
                  id="btn-nav-premium"
                  onClick={() => setCurrentView("premium")}
                  className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${currentView === "premium" ? "" : "text-[#94a3b8] dark:text-slate-500 hover:text-[#475569] dark:hover:text-slate-300"
                    }`}
                  style={currentView === "premium" ? { color: 'var(--color-teal-bright, #00D4AA)' } : undefined}
                >
                  <div className="p-1 mb-0.5">
                    <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                    </svg>
                  </div>
                  <span className={`text-[11.5px] tracking-tight ${currentView === "premium" ? "font-bold" : "font-medium text-[#94a3b8] dark:text-slate-500"}`}>
                    {t('premium')}
                  </span>
                  {currentView === "premium" && (
                    <span className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gradient-accent)' }} />
                  )}
                </button>
              )}
            </div>
          </nav>
        )}
      </div>

      {}
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
              {}
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
                    <Settings className={`w-5 h-5 text-brand-600 ${settingsView === "menu" ? "animate-spin-slow" : ""}`} />
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

              {}
              <div className="p-6 max-h-[70vh] overflow-y-auto max-md:no-scrollbar">
                <AnimatePresence mode="wait">
                  {settingsView === "menu" && (
                    <motion.div
                      key="menu"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-6"
                    >
                      {}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t('appearance')}</h4>

                        {}
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${darkMode ? "bg-brand-600/10 text-brand-400" : "bg-amber-500/10 text-amber-500"}`}>
                              {darkMode ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('darkMode')}</span>
                          </div>
                          <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${darkMode ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700"}`}
                          >
                            <motion.div
                              animate={{ x: darkMode ? 22 : 2 }}
                              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                            />
                          </button>
                        </div>

                        {}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-xl bg-brand-600/10 text-brand-400">
                              <Type className="w-4.5 h-4.5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('fontSize')}</span>
                          </div>
                          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                            {(["sm", "base", "lg"] as const).map((size) => (
                              <button
                                key={size}
                                onClick={() => setFontSize(size)}
                                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${fontSize === size ? "bg-brand-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                              >
                                {size === "sm" && t('small')}
                                {size === "base" && t('normal')}
                                {size === "lg" && t('large')}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {}
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
                            onChange={(e) => setLanguage(e.target.value as "es" | "en" | "mi" | "kr")}
                            className="bg-transparent text-sm font-bold text-brand-600 outline-none cursor-pointer"
                          >
                            <option value="es">Español</option>
                            <option value="en">English</option>
                            <option value="mi">Miskito</option>
                            <option value="kr">Kriol</option>
                          </select>
                        </div>
                      </div>

                      {}
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
                              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-900/50 transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <item.icon className={`w-4.5 h-4.5 ${item.color} group-hover:text-brand-400 transition-colors`} />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.label}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-400 transition-all group-hover:translate-x-0.5" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t('updates')}</h4>

                        {}
                        <button
                          onClick={handleCheckForUpdates}
                          disabled={checkingUpdates}
                          className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-900/50 transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-brand-600/10 text-brand-400 flex items-center justify-center">
                              {checkingUpdates ? (
                                <Loader2 className="w-4.5 h-4.5 text-brand-600 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4.5 h-4.5 text-brand-600" />
                              )}
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('checkUpdates')}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">{APP_VERSION}</span>
                        </button>

                        {}
                        <button
                          onClick={() => {
                            setIsSettingsOpen(false);
                            
                            showUpdateNotification(() => {
                              addToast(createToast(t('simulatingReload'), "info"));
                              setTimeout(() => window.location.reload(), 1500);
                            }, () => {
                              addToast(createToast(t('updatePostponed'), "info"));
                            }, true);
                          }}
                          className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-900/50 transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-brand-600/10 text-brand-600 flex items-center justify-center">
                              <Sparkles className="w-4.5 h-4.5 text-brand-600" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('simulateUpdate')}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-400 transition-all group-hover:translate-x-0.5" />
                        </button>
                      </div>

                      {}
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
                            <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center text-[10px] font-bold shrink-0">
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

              {}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 text-center">
                Salud-Conecta IA • {APP_VERSION}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-md z-[100] flex items-center justify-center p-5 select-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 26 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="relative w-full max-w-[390px] overflow-hidden rounded-[30px] bg-white dark:bg-slate-900 border border-white/80 dark:border-slate-800 shadow-[0_28px_80px_rgba(15,23,42,0.28)]"
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-blue-500/14 via-cyan-400/10 to-rose-400/12 dark:from-blue-500/18 dark:via-cyan-400/8 dark:to-rose-500/10" />
              <div className="relative p-6 sm:p-7">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  disabled={isLoggingOut}
                  className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                  aria-label={t('cancel')}
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center pt-2">
                  <motion.div
                    initial={{ rotate: -8, scale: 0.84 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.08, type: "spring", stiffness: 420, damping: 18 }}
                    className="relative mb-5"
                  >
                    <span className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" />
                    <span className="relative w-[72px] h-[72px] rounded-full bg-gradient-to-br from-red-50 to-blue-50 dark:from-red-500/10 dark:to-blue-500/10 border border-red-100 dark:border-red-500/15 shadow-[0_16px_36px_rgba(239,68,68,0.16)] flex items-center justify-center">
                      <LogOut className="w-8 h-8 text-red-500" />
                    </span>
                  </motion.div>

                  <h3 className="font-display text-[22px] font-black text-slate-950 dark:text-white tracking-tight leading-tight">
                    {t('logoutModalTitle')}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-w-[300px]">
                    {t('logoutModalDesc')}
                  </p>
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 dark:bg-slate-800/55 border border-slate-100 dark:border-slate-800 p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-left text-xs font-semibold leading-snug text-slate-600 dark:text-slate-300">
                    {t('logoutModalSecureNote')}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsLogoutModalOpen(false)}
                    disabled={isLoggingOut}
                    className="order-2 sm:order-1 w-full py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    {t('logoutModalStay')}
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="order-1 sm:order-2 w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-[0_14px_30px_rgba(220,38,38,0.24)] transition-all active:scale-[0.98] disabled:opacity-80 flex items-center justify-center gap-2"
                  >
                    {isLoggingOut ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <LogOut className="w-4.5 h-4.5" />}
                    <span>{t('logout')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
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
              {}
              <div className="flex flex-col mt-2 mb-5">
                <div className="flex flex-col items-center justify-center text-center mb-5 mt-2">
                  <div className="w-[64px] h-[64px] rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-3 shadow-[0_4px_16px_rgba(251,113,133,0.15)] relative">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-rose-100 dark:bg-rose-500/20 animate-ping opacity-75" />
                    <Siren className="w-[32px] h-[32px] text-[#d32f2f] relative z-10" />
                  </div>
                  <h3 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Emergencia médica
                  </h3>
                </div>

                <p className="text-slate-600 dark:text-slate-400 text-[14px] font-medium leading-snug mb-3 text-left px-1">
                  Si presentas alguno de estos síntomas, actúa de inmediato:
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-4 py-4 text-left mb-2">
                  <ul className="space-y-3.5 text-[14px] text-slate-700 dark:text-slate-300 font-medium leading-tight">
                    <li className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Dolor o presión en el pecho</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Dificultad severa para respirar</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Sangrado abundante</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                      <span>Confusión o pérdida del conocimiento</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Convulsiones o parálisis súbita</span>
                    </li>
                  </ul>
                </div>
              </div>

              {}
              <div className="flex flex-col gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                <motion.a
                  href="tel:128"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    setTimeout(() => setIsEmergencyModalOpen(false), 500);
                  }}
                  className="w-full py-3.5 bg-[#d32f2f] text-white font-bold text-[15px] tracking-wide rounded-[12px] shadow-sm hover:brightness-105 transition-all flex items-center justify-center gap-2.5"
                >
                  <Siren className="w-5 h-5" />
                  <span>{t('callRedCross')}</span>
                </motion.a>

                <button
                  onClick={() => setIsEmergencyModalOpen(false)}
                  className="w-full py-3 bg-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-bold text-[14px] rounded-[12px] transition-colors active:scale-95"
                >
                  {t('cancel')}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
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
                  <Sparkles className="w-5 h-5 text-brand-600 animate-pulse" />
                  <span>{t('installIosTitle')}</span>
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
                  {t('installIosDesc')}
                </p>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center text-sm font-bold shrink-0">
                      1
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('iosStep1Title')}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                        {t('iosStep1Desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center text-sm font-bold shrink-0">
                      2
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        {t('iosStep2Title')}
                        <span className="inline-block p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <svg className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                            <polyline points="16 6 12 2 8 6" />
                            <line x1="12" y1="2" x2="12" y2="15" />
                          </svg>
                        </span>
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                        {t('iosStep2Desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center text-sm font-bold shrink-0">
                      3
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        {t('iosStep3Title')}
                        <span className="inline-block p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <svg className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </span>
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                        {t('iosStep3Desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowIosGuideModal(false)}
                  className="bg-brand-600 hover:bg-brand-900 text-white font-bold text-xs py-2.5 px-4 rounded-2xl shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  {t('gotIt')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
