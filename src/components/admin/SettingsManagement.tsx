import React, { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { Loader2, Save, ToggleLeft, ToggleRight, Sparkles, Smartphone, ShieldAlert, Zap } from "lucide-react";

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
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Check if user is admin (profile type may not include 'role')
  const isAdmin = (profile as any)?.role === "admin";

  useEffect(() => {
    const fetchSettings = async () => {
      if (!isAdmin) return;
      try {
        const { data, error } = await supabase.from('app_settings').select('*').eq('clave', 'global_config').single();
        
        if (error && error.code === 'PGRST116') {
          // Si no existe, insertamos los valores por defecto
          await supabase.from('app_settings').insert({ clave: 'global_config', valor: DEFAULT_SETTINGS, descripcion: 'Configuración global de la app' });
          setSettings(DEFAULT_SETTINGS);
        } else if (data && data.valor) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.valor });
          if (data.actualizado_en) setLastSaved(new Date(data.actualizado_en));
        }
      } catch (err) {
        console.error("Error cargando configuraciones:", err);
        setError("No se pudieron cargar las configuraciones.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { value } = e.target;
    const isCheckbox = e.target instanceof HTMLInputElement && e.target.type === "checkbox";
    setEditValue(isCheckbox ? (e.target as HTMLInputElement).checked : value);
  };

  // Handle saving a setting
  const handleSaveSetting = async (field: string, value: any) => {
    if (!isAdmin) return;
    setIsSaving(true);

    try {
      const newSettings = { ...settings, [field]: value };
      
      const { error } = await supabase.from('app_settings').upsert({
        clave: 'global_config',
        valor: newSettings,
        actualizado_en: new Date().toISOString()
      }, { onConflict: 'clave' });

      if (error) throw error;

      setSettings(newSettings);
      setLastSaved(new Date());

      // Reset edit state
      setEditedField(null);
      setEditValue("");
    } catch (err: any) {
      setError(`Failed to save ${field}: ${err.message || 'Error desconocido'}`);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle toggling feature flag
  const handleToggleFeatureFlag = async (flag: string) => {
    if (!isAdmin) return;
    setIsSaving(true);

    try {
      const newSettings = {
        ...settings,
        featureFlags: {
          ...settings.featureFlags,
          [flag]: !settings.featureFlags[flag]
        }
      };

      const { error } = await supabase.from('app_settings').upsert({
        clave: 'global_config',
        valor: newSettings,
        actualizado_en: new Date().toISOString()
      }, { onConflict: 'clave' });

      if (error) throw error;
      setSettings(newSettings);
      setLastSaved(new Date());
    } catch (err: any) {
      setError(`Error al alternar feature flag: ${err.message || 'Error desconocido'}`);
      console.error(err);
    } finally {
      setIsSaving(false);
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
          {isSaving ? (
            <span className="text-xs font-bold text-blue-500 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...</span>
          ) : lastSaved ? (
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              {t('lastUpdated')}: {lastSaved.toLocaleTimeString()}
            </span>
          ) : null}
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"><Smartphone className="w-4.5 h-4.5 text-blue-500" /> {t('generalSettings')}</h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* App Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase font-bold text-slate-500">{t('appName')}</label>
            <input
              type="text"
              name="appName"
              value={editedField === "appName" ? editValue : settings.appName}
              onChange={handleChange}
              onBlur={() => { if (editedField === "appName" && editValue !== settings.appName) handleSaveSetting("appName", editValue); else setEditedField(null); }}
              onFocus={() => {
                setEditedField("appName");
                setEditValue(settings.appName);
              }}
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${editedField === "appName" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200 dark:border-slate-700"} rounded-xl text-sm outline-none transition-all`}
            />
          </div>

          {/* Welcome Message */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase font-bold text-slate-500">{t('welcomeMessage')}</label>
            <input
              type="text"
              name="welcomeMessage"
              value={editedField === "welcomeMessage" ? editValue : settings.welcomeMessage}
              onChange={handleChange}
              onBlur={() => { if (editedField === "welcomeMessage" && editValue !== settings.welcomeMessage) handleSaveSetting("welcomeMessage", editValue); else setEditedField(null); }}
              onFocus={() => {
                setEditedField("welcomeMessage");
                setEditValue(settings.welcomeMessage);
              }}
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${editedField === "welcomeMessage" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200 dark:border-slate-700"} rounded-xl text-sm outline-none transition-all`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-500">{t('contactEmail')}</label>
              <input
                type="email"
                name="contactEmail"
                value={editedField === "contactEmail" ? editValue : settings.contactEmail}
                onChange={handleChange}
                onBlur={() => { if (editedField === "contactEmail" && editValue !== settings.contactEmail) handleSaveSetting("contactEmail", editValue); else setEditedField(null); }}
                onFocus={() => { setEditedField("contactEmail"); setEditValue(settings.contactEmail); }}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${editedField === "contactEmail" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200 dark:border-slate-700"} rounded-xl text-sm outline-none transition-all font-mono`}
              />
            </div>

            {/* Emergency Number */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-500">{t('emergencyNumber')}</label>
              <input
                type="tel"
                name="emergencyNumber"
                value={editedField === "emergencyNumber" ? editValue : settings.emergencyNumber}
                onChange={handleChange}
                onBlur={() => { if (editedField === "emergencyNumber" && editValue !== settings.emergencyNumber) handleSaveSetting("emergencyNumber", editValue); else setEditedField(null); }}
                onFocus={() => { setEditedField("emergencyNumber"); setEditValue(settings.emergencyNumber); }}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${editedField === "emergencyNumber" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200 dark:border-slate-700"} rounded-xl text-sm outline-none transition-all font-mono`}
              />
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${settings.maintenanceMode ? "bg-red-100 dark:bg-red-900/30 text-red-600" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">{t('maintenanceMode')}</span>
                <span className="text-[11px] text-slate-500">Impide el acceso a usuarios no administradores.</span>
              </div>
            </div>
            <button onClick={() => handleSaveSetting("maintenanceMode", !settings.maintenanceMode)} className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${settings.maintenanceMode ? "bg-red-500" : "bg-slate-300 dark:bg-slate-600"}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${settings.maintenanceMode ? "translate-x-[22px]" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Show PWA Banner */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${settings.showPwaBanner ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">{t('showPwaBanner')}</span>
                <span className="text-[11px] text-slate-500">Muestra el banner superior sugiriendo instalar la App.</span>
              </div>
            </div>
            <button onClick={() => handleSaveSetting("showPwaBanner", !settings.showPwaBanner)} className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${settings.showPwaBanner ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${settings.showPwaBanner ? "translate-x-[22px]" : "translate-x-1"}`} />
            </button>
          </div>
        </div>

        {/* Feature Flags Section */}
        <div className="border-t border-slate-100 dark:border-slate-800">
          <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-800/30">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"><Sparkles className="w-4.5 h-4.5 text-indigo-500" /> {t('featureFlags')}</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings.featureFlags).map(([flag, enabled]: [string, any]) => (
              <div key={flag} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{(t as any)(`featureFlag.${flag}`) || flag.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                <button onClick={() => handleToggleFeatureFlag(flag)} className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${enabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${enabled ? "translate-x-[22px]" : "translate-x-1"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* AI Settings Section */}
        <div className="border-t border-slate-100 dark:border-slate-800">
          <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-800/30">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"><Zap className="w-4.5 h-4.5 text-emerald-500" /> {t('aiSettings')}</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Model */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-500">{t('aiModel')}</label>
              <select
                name="aiModel"
                value={editedField === "aiModel" ? editValue : settings.aiModel}
                onChange={handleChange}
                onBlur={() => { if (editedField === "aiModel" && editValue !== settings.aiModel) handleSaveSetting("aiModel", editValue); else setEditedField(null); }}
                onFocus={() => { setEditedField("aiModel"); setEditValue(settings.aiModel); }}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${editedField === "aiModel" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 dark:border-slate-700"} rounded-xl text-sm font-bold outline-none transition-all cursor-pointer`}
              >
                <option value="gemini-2.0-flash-lite">{t('geminiFlashLite')}</option>
                <option value="gemini-2.0-flash">{t('geminiFlash')}</option>
                <option value="gemini-2.0-pro">{t('geminiPro')}</option>
              </select>
            </div>

            {/* Max Consultation Length */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-500">{t('maxConsultationLength')}</label>
              <input
                type="number"
                name="maxConsultationLength"
                value={editedField === "maxConsultationLength" ? editValue : settings.maxConsultationLength}
                onChange={handleChange}
                onBlur={() => { if (editedField === "maxConsultationLength" && Number(editValue) !== settings.maxConsultationLength) handleSaveSetting("maxConsultationLength", Number(editValue)); else setEditedField(null); }}
                onFocus={() => { setEditedField("maxConsultationLength"); setEditValue(String(settings.maxConsultationLength)); }}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${editedField === "maxConsultationLength" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 dark:border-slate-700"} rounded-xl text-sm font-mono outline-none transition-all`}
                min="100" max="2000" step="50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;