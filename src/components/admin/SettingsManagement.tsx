import React, { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";

// In a real app, these would come from a Supabase table or config service
const DEFAULT_SETTINGS = {
  appName: "Salud-Conecta IA",
  appDescription: "Asistente de triaje digital para Nicaragua",
  welcomeMessage: "Bienvenido a Salud-Conecta IA",
  contactEmail: "info@salud-conecta.ia",
  supportPhone: "+505 2278 0000",
  emergencyNumber: "128",
  maintenanceMode: false,
  showPwaBanner: true,
  enableAnalytics: true,
  aiModel: "gemini-2.0-flash-lite",
  maxConsultationLength: 500,
  availableLanguages: ["es", "en"],
  defaultLanguage: "es",
  featureFlags: {
    premiumFeatures: true,
    emergencyCard: true,
    appointmentBooking: true,
    healthUnitSearch: true,
    voiceInput: false,
    videoConsultation: false
  }
};

const SettingsManagement: React.FC = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedField, setEditedField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>("");

  // Check if user is admin
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    // In a real app, fetch settings from Supabase or API
    // For now, we'll use defaults
    setLoading(false);
  }, []);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setEditValue(type === "checkbox" ? checked : value);
  };

  // Handle saving a setting
  const handleSaveSetting = async (field: string, value: any) => {
    if (!isAdmin) return;

    try {
      // In a real app, this would save to Supabase/settings table
      // For now, we'll update local state
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));

      // Reset edit state
      setEditedField(null);
      setEditValue("");

      // Show success toast (would need toast context)
      console.log(`Setting ${field} updated to:`, value);
    } catch (err) {
      setError(`Failed to save ${field}: ${err.message || 'Unknown error'}`);
      console.error(err);
    }
  };

  // Handle toggling feature flag
  const handleToggleFeatureFlag = (flag: string) => {
    if (!isAdmin) return;

    try {
      setSettings(prev => ({
        ...prev,
        featureFlags: {
          ...prev.featureFlags,
          [flag]: !prev.featureFlags[flag]
        }
      }));

      console.log(`Feature flag ${flag} toggled to:`, !prev.featureFlags[flag]);
    } catch (err) {
      setError(`Failed to toggle feature flag: ${err.message || 'Unknown error'}`);
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500">{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500 dark:text-slate-400">{t('accessDenied')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('settings')}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t('lastUpdated')}: {new Date().toLocaleString()}
          </span>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('generalSettings')}</h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* App Name */}
          <div className={editedField === "appName" ? "border-b-2 border-blue-500 pb-1" : ""}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('appName')}</label>
            <input
              type="text"
              name="appName"
              value={editedField === "appName" ? editValue : settings.appName}
              onChange={handleChange}
              onBlur={() => {
                if (editedField === "appName") {
                  handleSaveSetting("appName", editValue);
                }
              }}
              onFocus={() => {
                setEditedField("appName");
                setEditValue(settings.appName);
              }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Welcome Message */}
          <div className={editedField === "welcomeMessage" ? "border-b-2 border-blue-500 pb-1" : ""}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('welcomeMessage')}</label>
            <input
              type="text"
              name="welcomeMessage"
              value={editedField === "welcomeMessage" ? editValue : settings.welcomeMessage}
              onChange={handleChange}
              onBlur={() => {
                if (editedField === "welcomeMessage") {
                  handleSaveSetting("welcomeMessage", editValue);
                }
              }}
              onFocus={() => {
                setEditedField("welcomeMessage");
                setEditValue(settings.welcomeMessage);
              }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contact Email */}
          <div className={editedField === "contactEmail" ? "border-b-2 border-blue-500 pb-1" : ""}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('contactEmail')}</label>
            <input
              type="email"
              name="contactEmail"
              value={editedField === "contactEmail" ? editValue : settings.contactEmail}
              onChange={handleChange}
              onBlur={() => {
                if (editedField === "contactEmail") {
                  handleSaveSetting("contactEmail", editValue);
                }
              }}
              onFocus={() => {
                setEditedField("contactEmail");
                setEditValue(settings.contactEmail);
              }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Emergency Number */}
          <div className={editedField === "emergencyNumber" ? "border-b-2 border-blue-500 pb-1" : ""}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('emergencyNumber')}</label>
            <input
              type="tel"
              name="emergencyNumber"
              value={editedField === "emergencyNumber" ? editValue : settings.emergencyNumber}
              onChange={handleChange}
              onBlur={() => {
                if (editedField === "emergencyNumber") {
                  handleSaveSetting("emergencyNumber", editValue);
                }
              }}
              onFocus={() => {
                setEditedField("emergencyNumber");
                setEditValue(settings.emergencyNumber);
              }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Maintenance Mode */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center">
                {settings.maintenanceMode ? (
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                ) : (
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                )}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('maintenanceMode')}</span>
            </div>
            <label className="relative inline-flex items-center px-2 py-1 mr-2 leading-none text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 cursor-pointer select-none"
              onClick={() => handleSaveSetting("maintenanceMode", !settings.maintenanceMode)}
            >
              <input type="checkbox" className="sr-only" />
              <span className="ls-0.5">{settings.maintenanceMode ? t('enabled') : t('disabled')}</span>
            </label>
          </div>

          {/* Show PWA Banner */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center">
                {settings.showPwaBanner ? (
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                ) : (
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                )}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('showPwaBanner')}</span>
            </div>
            <label className="relative inline-flex items-center px-2 py-1 mr-2 leading-none text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 cursor-pointer select-none"
              onClick={() => handleSaveSetting("showPwaBanner", !settings.showPwaBanner)}
            >
              <input type="checkbox" className="sr-only" />
              <span className="ls-0.5">{settings.showPwaBanner ? t('enabled') : t('disabled')}</span>
            </label>
          </div>
        </div>

        {/* Feature Flags Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('featureFlags')}</h3>
          </div>
          <div className="px-6 py-4 space-y-3">
            {Object.entries(settings.featureFlags).map(([flag, enabled]) => (
              <div key={flag} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center">
                    {enabled ? (
                      <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                    ) : (
                      <div className="w-3 h-3 bg-gray-400 rounded-full" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t(`featureFlag.${flag}`) || flag.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                </div>
                <label className="relative inline-flex items-center px-2 py-1 mr-2 leading-none text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 cursor-pointer select-none"
                  onClick={() => handleToggleFeatureFlag(flag)}
                >
                  <input type="checkbox" className="sr-only" />
                  <span className="ls-0.5">{enabled ? t('enabled') : t('disabled')}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* AI Settings Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('aiSettings')}</h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            {/* AI Model */}
            <div className={editedField === "aiModel" ? "border-b-2 border-blue-500 pb-1" : ""}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('aiModel')}</label>
              <select
                name="aiModel"
                value={editedField === "aiModel" ? editValue : settings.aiModel}
                onChange={handleChange}
                onBlur={() => {
                  if (editedField === "aiModel") {
                    handleSaveSetting("aiModel", editValue);
                  }
                }}
                onFocus={() => {
                  setEditedField("aiModel");
                  setEditValue(settings.aiModel);
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gemini-2.0-flash-lite">{t('geminiFlashLite')}</option>
                <option value="gemini-2.0-flash">{t('geminiFlash')}</option>
                <option value="gemini-2.0-pro">{t('geminiPro')}</option>
              </select>
            </div>

            {/* Max Consultation Length */}
            <div className={editedField === "maxConsultationLength" ? "border-b-2 border-blue-500 pb-1" : ""}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('maxConsultationLength')}</label>
              <input
                type="number"
                name="maxConsultationLength"
                value={editedField === "maxConsultationLength" ? editValue : settings.maxConsultationLength}
                onChange={handleChange}
                onBlur={() => {
                  if (editedField === "maxConsultationLength") {
                    handleSaveSetting("maxConsultationLength", Number(editValue));
                  }
                }}
                onFocus={() => {
                  setEditedField("maxConsultationLength");
                  setEditValue(String(settings.maxConsultationLength));
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="100"
                max="2000"
                step="50"
              />
            </div>
          </div>
        </div>

        {/* Save All Button */}
        <div className="px-6 py-4 text-right">
          <button
            onClick={() => {
              // In a real app, this would save all settings to backend
              alert(t('settingsSaved'));
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {t('saveAllSettings')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;