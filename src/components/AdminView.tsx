import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { UserProfile } from "../types";
import { motion } from "motion/react";
import { User, Shield, Settings, BarChart3, LucideProps } from "lucide-react";

// Subcomponents
import UserManagement from "./admin/UserManagement";
import HealthUnitManagement from "./admin/HealthUnitManagement";
import SettingsManagement from "./admin/SettingsManagement";
import AnalyticsView from "./admin/AnalyticsView";

const AdminView: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<"users" | "health" | "settings" | "analytics">("users");
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    // Simulate loading delay
    setIsLoading(false);
  }, []);

  if (!isAdmin) {
    // Redirect non-admins (should not happen due to route protection, but just in case)
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans select-none overflow-x-hidden antialiased">
      {/* Header */}
      <header className="flex flex-col items-center px-6 pt-[env(safe-area-inset-top,44px)] pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 w-full max-w-6xl">
          <img
            src="/app-logo-v1.jpg"
            alt="Logo"
            className="w-9 h-9 rounded-lg shadow-sm object-cover border border-blue-100 dark:border-blue-900/30"
          />
          <span className="font-display font-bold text-xl text-slate-800 dark:text-white tracking-tight">
            Salud-Conecta <span className="text-blue-600">IA</span>
          </span>
        </div>
        <div className="w-full max-w-6xl px-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t('adminPanel')}</h1>
          <nav className="flex space-x-4 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveSection("users")}
              className={`px-3 py-2 text-sm font-medium ${activeSection === "users" ? "border-b-2 border-blue-500 text-blue-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              {t('userManagement')}
            </button>
            <button
              onClick={() => setActiveSection("health")}
              className={`px-3 py-2 text-sm font-medium ${activeSection === "health" ? "border-b-2 border-blue-500 text-blue-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              {t('healthUnitManagement')}
            </button>
            <button
              onClick={() => setActiveSection("settings")}
              className={`px-3 py-2 text-sm font-medium ${activeSection === "settings" ? "border-b-2 border-blue-500 text-blue-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              {t('settings')}
            </button>
            <button
              onClick={() => setActiveSection("analytics")}
              className={`px-3 py-2 text-sm font-medium ${activeSection === "analytics" ? "border-b-2 border-blue-500 text-blue-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              {t('analytics')}
            </button>
          </nav>
        </div>
        <div className="flex justify-end w-full max-w-6xl px-6 pt-4">
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            {t('logout')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-slate-500">{t('loading')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeSection === "users" && <UserManagement user={profile as UserProfile} />}
            {activeSection === "health" && <HealthUnitManagement />}
            {activeSection === "settings" && <SettingsManagement />}
            {activeSection === "analytics" && <AnalyticsView />}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminView;