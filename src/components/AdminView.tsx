import React, { useState, useEffect, Suspense, lazy } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Users, MapPin, Megaphone, Hospital, Bot, BarChart3, Settings, Menu, X, ArrowLeft, Loader2 } from "lucide-react";
import { HEALTH_CENTERS } from "../data/healthUnits";
import { supabase } from "../lib/supabaseClient";

// Dynamic imports for admin submodules
const UserManagement = lazy(() => import("./admin/UserManagement"));
const HealthUnitManagement = lazy(() => import("./admin/HealthUnitManagement"));
const SettingsManagement = lazy(() => import("./admin/SettingsManagement"));
const AnalyticsView = lazy(() => import("./admin/AnalyticsView"));
const LocationManagement = lazy(() => import("./admin/LocationManagement"));
const AnnouncementManagement = lazy(() => import("./admin/AnnouncementManagement"));
const IAConfigView = lazy(() => import("./admin/IAConfigView"));

interface AdminViewProps {
  onGoBack?: () => void;
}

const SubViewFallback = () => (
  <div className="w-full h-64 flex flex-col items-center justify-center space-y-3">
    <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
    <span className="text-sm font-medium text-slate-500">Cargando sección de administración...</span>
  </div>
);

const AdminView: React.FC<AdminViewProps> = ({ onGoBack }) => {
  const { profile } = useAuth();
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

      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-40 transition-transform duration-300 ease-in-out shadow-2xl ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {sections.map(({ id, icon: Icon, label }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => handleSectionChange(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${isActive
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white truncate">
              {currentLabel}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {activeSection === "location" && (
              <div className="hidden sm:flex items-center gap-3">
                <span className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl px-3.5 py-2 border border-slate-200 dark:border-slate-700/50 shadow-xs">
                  <Hospital className="w-4 h-4 text-brand-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Total: <span className="text-brand-600 dark:text-brand-400 text-sm">{totalCenters}</span>
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

        <main className={`flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-[#0b0f19] ${activeSection === "location" ? "p-0 overflow-hidden" : "p-4 md:p-8 overflow-y-auto"}`}>
          {isLoading ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-slate-500">{t('loading')}</p>
            </div>
          ) : (
            <Suspense fallback={<SubViewFallback />}>
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
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminView;
