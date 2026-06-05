import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Users, MapPin, Megaphone, Hospital, Bot, BarChart3, Settings, LogOut, Menu, X, ArrowLeft } from "lucide-react";

// Subcomponents
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

  // Check if user is admin
  const isAdmin = (profile as any)?.role === "admin" || (profile as any)?.rol === "admin";

  useEffect(() => {
    // Simulate loading delay
    setIsLoading(false);
  }, []);

  // Close sidebar on section change (mobile)
  const handleSectionChange = (section: typeof activeSection) => {
    setActiveSection(section);
    setIsSidebarOpen(false);
  };

  if (!isAdmin) {
    // Redirect non-admins
    return null;
  }

  const sections = [
    { id: "location", icon: MapPin, label: t('locationManagement') },
    { id: "announcements", icon: Megaphone, label: t('announcementManagement') },
    { id: "health", icon: Hospital, label: t('healthUnitManagement') },
    { id: "users", icon: Users, label: t('userManagement') },
    { id: "ia", icon: Bot, label: t('settings') },
    { id: "analytics", icon: BarChart3, label: t('analytics') },
    { id: "settings", icon: Settings, label: t('generalSettings') },
  ] as const;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans antialiased relative">
      
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Administrativo (Responsive drawer on mobile, static on desktop) */}
      <aside 
        className={`fixed md:relative inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-40 transition-transform duration-300 ease-in-out transform md:transform-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/app-logo-v1.jpg" alt="Logo" className="w-8 h-8 rounded-lg shadow-sm object-cover border border-blue-100 dark:border-blue-900/30" />
            <h1 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
              {t('adminPanel')}
            </h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 md:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-[10px] font-bold w-fit border border-blue-100 dark:border-blue-800 uppercase tracking-wider">
            {t('admin')}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 no-scrollbar">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => handleSectionChange(sec.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-sm font-semibold outline-none ${
                activeSection === sec.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
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
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl transition-colors text-sm font-bold"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
              Volver a la App
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        
        {/* Mobile Header Bar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 md:hidden shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-sm text-slate-800 dark:text-white truncate">
              {sections.find(s => s.id === activeSection)?.label}
            </span>
          </div>
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/35 rounded-lg transition-colors"
              title="Volver a la App"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </header>

        {/* Inner Content Grid */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-[#0b0f19] p-4 md:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
                className="max-w-5xl mx-auto pb-8"
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