import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Users, MapPin, Megaphone, Hospital, Bot, BarChart3, Settings, LogOut } from "lucide-react";

// Subcomponents
import UserManagement from "./admin/UserManagement";
import HealthUnitManagement from "./admin/HealthUnitManagement";
import SettingsManagement from "./admin/SettingsManagement";
import AnalyticsView from "./admin/AnalyticsView";
import LocationManagement from "./admin/LocationManagement";
import AnnouncementManagement from "./admin/AnnouncementManagement";
import IAConfigView from "./admin/IAConfigView";

const AdminView: React.FC = () => {
  const { profile, logout } = useAuth();
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<"users" | "health" | "settings" | "analytics" | "location" | "announcements" | "ia">("location");
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin
  const isAdmin = (profile as any)?.userRole === "admin";

  useEffect(() => {
    // Simulate loading delay
    setIsLoading(false);
  }, []);

  if (!isAdmin) {
    // Redirect non-admins (should not happen due to route protection, but just in case)
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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans antialiased">
      {/* Sidebar Administrativo */}
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-20">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <img src="/app-logo-v1.jpg" alt="Logo" className="w-8 h-8 rounded-lg shadow-sm object-cover border border-blue-100 dark:border-blue-900/30" />
            <h1 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
              {t('adminPanel')}
            </h1>
          </div>
          <div className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-[10px] font-bold w-fit border border-blue-100 dark:border-blue-800 uppercase tracking-wider">
            {t('admin')}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 no-scrollbar">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
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

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors text-sm font-bold"
          >
            <LogOut className="w-4.5 h-4.5" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-[#0b0f19] p-8">
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
              className="max-w-5xl mx-auto"
            >
              {activeSection === "users" && profile && <UserManagement user={profile as UserProfile} />}
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
  );
};

export default AdminView;