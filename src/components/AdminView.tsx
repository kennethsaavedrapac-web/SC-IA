import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Users, MapPin, Megaphone, Hospital, Bot, BarChart3, Settings, LogOut, Menu, X, ArrowLeft } from "lucide-react";
import { HEALTH_CENTERS } from "../data/healthUnits";
import { supabase } from "../lib/supabaseClient";


import UserManagement from "./admin/UserManagement";
import HealthUnitManagement from "./admin/HealthUnitManagement";
import SettingsManagement from "./admin/SettingsManagement";
import AnalyticsView from "./admin/AnalyticsView";
import LocationManagement from "./admin/LocationManagement";
import AnnouncementManagement from "./admin/AnnouncementManagement";
import IAConfigView from "./admin/IAConfigView";

interface AdminViewProps {
  onGoBack?: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onGoBack }) => {
  const { profile, logout } = useAuth();
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<"users" | "health" | "settings" | "analytics" | "location" | "announcements" | "ia">("location");
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [overridesCount, setOverridesCount] = useState(0);

  
  const isAdmin = (profile as any)?.role === "admin" || (profile as any)?.rol === "admin";

  useEffect(() => {
    setIsLoading(false);
  }, []);

  
  useEffect(() => {
    const fetchOverrides = async () => {
      const { data, error } = await supabase.from('health_center_overrides').select('center_id');
      if (!error && data) {
        setOverridesCount(data.length);
      }
    };
    if (activeSection === "location") {
      fetchOverrides();
    }
  }, [activeSection]);

  const handleSectionChange = (section: typeof activeSection) => {
    setActiveSection(section);
    setIsSidebarOpen(false);
  };

  if (!isAdmin) return null;

  const totalCenters = HEALTH_CENTERS.length;
  const withCoords = HEALTH_CENTERS.filter(c => c.latitude && c.longitude).length;

  const sections = [
    { id: "location", icon: MapPin, label: t('locationManagement') },
    { id: "announcements", icon: Megaphone, label: t('announcementManagement') },
    { id: "health", icon: Hospital, label: t('healthUnitManagement') },
    { id: "users", icon: Users, label: t('userManagement') },
    { id: "ia", icon: Bot, label: t('iaConfiguration') },
    { id: "analytics", icon: BarChart3, label: t('analytics') },
    { id: "settings", icon: Settings, label: t('generalSettings') },
  ] as const;

  const currentLabel = sections.find(s => s.id === activeSection)?.label;

  return (
    <div className="flex h-dvh overflow-hidden font-sans antialiased relative">

      {}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30"
          />
        )}
      </AnimatePresence>

      {}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-40 transition-transform duration-300 ease-in-out shadow-2xl ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/app-logo-v2.jpg" alt="Logo" className="w-8 h-8 rounded-lg shadow-sm object-cover border border-brand-100 dark:border-brand-900/30" />
            <h1 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
              {t('adminPanel')}
            </h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="px-2.5 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-900 dark:text-brand-400 rounded-md text-[10px] font-bold w-fit border border-brand-100 dark:border-brand-900 uppercase tracking-wider">
            {t('admin')}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 no-scrollbar">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => handleSectionChange(sec.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-sm font-semibold outline-none ${activeSection === sec.id
                  ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
            >
              <sec.icon className="w-5 h-5" />
              {sec.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-50 dark:bg-brand-600/10 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-600/20 rounded-xl transition-colors text-sm font-bold"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
              {t('backToApp')}
            </button>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors text-sm font-bold"
          >
            <LogOut className="w-4.5 h-4.5" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">

        {}
        <header className="flex flex-col shrink-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          {}
          <div className="relative flex items-center justify-between px-4 md:px-6 py-3">
            <div className="flex items-center gap-3 z-10">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Abrir menú de administración"
              >
                <Menu className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <span className="font-bold text-sm md:text-base text-slate-800 dark:text-white truncate">
                {currentLabel}
              </span>
            </div>

            {}
            {activeSection === "location" && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-3">
                <span className="inline-flex items-center gap-2 bg-brand-50/90 dark:bg-brand-900/40 rounded-xl px-3.5 py-2 border border-brand-200 dark:border-brand-900/40 shadow-xs">
                  <MapPin className="w-4 h-4 text-brand-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {t('totalCenters')}: <span className="text-brand-600 dark:text-brand-400 text-sm">{totalCenters}</span>
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 bg-emerald-50/90 dark:bg-emerald-950/40 rounded-xl px-3.5 py-2 border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Con coord.: <span className="text-emerald-600 dark:text-emerald-450 text-sm">{withCoords}</span>
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 bg-brand-50/90 dark:bg-brand-900/40 rounded-xl px-3.5 py-2 border border-brand-200 dark:border-brand-900/40 shadow-xs">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-brand-400">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Ajustados: <span className="text-brand-600 dark:text-brand-400 text-sm">{overridesCount}</span>
                  </span>
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 z-10">
              {onGoBack && (
                <button
                  onClick={onGoBack}
                  className="p-2 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/35 rounded-lg transition-colors"
                  title={t('backToApp')}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </header>

        {}
        <main className={`flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-[#0b0f19] ${activeSection === "location" ? "p-0 overflow-hidden" : "p-4 md:p-8 overflow-y-auto"}`}>
          {isLoading ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-slate-500">{t('loading')}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={activeSection === "location" ? "h-full w-full" : "pb-8"}
              >
                {activeSection === "users" && profile && <UserManagement user={profile as unknown as UserProfile} />}
                {activeSection === "health" && <HealthUnitManagement />}
                {activeSection === "settings" && <SettingsManagement />}
                {activeSection === "analytics" && <AnalyticsView />}
                {activeSection === "location" && <LocationManagement />}
                {activeSection === "announcements" && <AnnouncementManagement />}
                {activeSection === "ia" && <IAConfigView />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

    </div>
  );
};

export default AdminView;
