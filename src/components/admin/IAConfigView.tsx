import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { Plus, Clock, Bot, Send, User, Loader2, Sparkles } from "lucide-react";

interface AIConfiguration {
  id: string;
  config_key: string;
  config_value: string;
  description: string | null;
  updated_by: string;
  updated_at: string;
}

const IAConfigView: React.FC = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [aiConfigs, setAIConfigs] = useState<AIConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);
  const [editingConfig, setEditingConfig] = useState<AIConfiguration | null>(null);
  const [formData, setFormData] = useState<Partial<AIConfiguration>>({
    config_key: '',
    config_value: '',
    description: ''
  });

  // Playground State
  const [testInput, setTestInput] = useState("");
  const [testMessages, setTestMessages] = useState<{ sender: 'user' | 'bot', text: string }[]>([]);
  const [isTesting, setIsTesting] = useState(false);


  const isAdmin = (profile as any)?.role === "admin";

  useEffect(() => {
    if (!isAdmin) {
      setError("Acceso denegado");
      return;
    }

    const loadAIConfigs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('ai_configurations')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setAIConfigs(data || []);
      } catch (err: any) {
        setError(err.message || 'Error loading AI configurations');
        console.error('Error loading AI configurations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAIConfigs();
  }, []);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleAddAIConfig = async () => {
    try {

      if (!formData.config_key || !formData.config_value) {
        alert('Por favor complete todos los campos obligatorios');
        return;
      }

      const newAIConfig: Omit<AIConfiguration, 'id' | 'updated_at'> = {
        config_key: formData.config_key!,
        config_value: formData.config_value!,
        description: formData.description || null,
        updated_by: user?.id || 'unknown'
      };

      const { data, error } = await supabase
        .from('ai_configurations')
        .insert(newAIConfig);

      if (error) throw error;


      setFormMode(null);
      setEditingConfig(null);
      setFormData({
        config_key: '',
        config_value: '',
        description: ''
      });

      // Reload AI configurations
      await loadAIConfigs();

      // Show success (in real app would use toast)
      alert('Configuración de IA creada exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error creating AI configuration');
      console.error('Error creating AI configuration:', err);
    }
  };


  const handleUpdateAIConfig = async () => {
    if (!editingConfig) return;

    try {

      if (!formData.config_key || !formData.config_value) {
        alert('Por favor complete todos los campos obligatorios');
        return;
      }

      const updates: Partial<AIConfiguration> = {
        config_key: formData.config_key!,
        config_value: formData.config_value!,
        description: formData.description || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('ai_configurations')
        .update(updates)
        .eq('id', editingConfig!.id);

      if (error) throw error;


      setFormMode(null);
      setEditingConfig(null);
      setFormData({
        config_key: '',
        config_value: '',
        description: ''
      });

      // Reload AI configurations
      await loadAIConfigs();

      // Show success
      alert('Configuración de IA actualizada exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error updating AI configuration');
      console.error('Error updating AI configuration:', err);
    }
  };


  const handleDeleteAIConfig = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta configuración de IA? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;


      await loadAIConfigs();


      alert('Configuración de IA eliminada exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error deleting AI configuration');
      console.error('Error deleting AI configuration:', err);
    }
  };


  const loadAIConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setAIConfigs(data || []);
    } catch (err: any) {
      setError(err.message || 'Error loading AI configurations');
      console.error('Error loading AI configurations:', err);
    } finally {
      setLoading(false);
    }
  }, []);


  const handleTestChat = async () => {
    if (!testInput.trim() || isTesting) return;

    const newMsg = { sender: 'user' as const, text: testInput };
    setTestMessages(prev => [...prev, newMsg]);
    setTestInput("");
    setIsTesting(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          message: newMsg.text,
          history: testMessages,
          userProfile: {
            name: "Usuario de Prueba",
            bloodType: "O+",
            healthConditions: ["Diabetes", "Hipertensión"]
          }
        })
      });
      const data = await response.json();
      setTestMessages(prev => [...prev, { sender: 'bot', text: data.text || data.error || "Error al procesar la respuesta." }]);
    } catch (err) {
      console.error("Test chat error:", err);
      setTestMessages(prev => [...prev, { sender: 'bot', text: "Error de conexión al probar el bot." }]);
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('iaConfiguration')}</h2>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              setFormMode('add');
              setEditingConfig(null);
              setFormData({
                config_key: '',
                config_value: '',
                description: ''
              });
            }}
            className="flex-1 sm:flex-none justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" /> <span className="truncate">{t('addAIConfig')}</span>
          </button>
          <button
            onClick={loadAIConfigs}
            className="flex-1 sm:flex-none justify-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            <Clock className="w-4 h-4 shrink-0" /> <span className="truncate">{t('refresh')}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('aiConfigurationsList')} ({aiConfigs.length})</h3>
        </div>
        <div className="overflow-y-auto max-h-[400px] divide-y divide-slate-200 dark:divide-slate-800">
          {aiConfigs.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
              <p>No AI configurations found</p>
            </div>
          ) : (
            aiConfigs.map((config) => (
              <div key={config.id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white break-all text-sm sm:text-base">{config.config_key}</h4>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {config.description || t('noDescription')}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                      Updated: {new Date(config.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end sm:w-auto w-full border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode('edit');
                      setEditingConfig(config);
                      setFormData({
                        config_key: config.config_key,
                        config_value: config.config_value,
                        description: config.description || ''
                      });
                    }}
                    className="flex-1 sm:flex-none justify-center px-3 py-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-brand-600 flex items-center gap-1 transition-colors"
                  >
                    {t('edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAIConfig(config.id)}
                    className="flex-1 sm:flex-none justify-center px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form (Add or Edit) */}
      {formMode !== null && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {formMode === 'add' ? t('addAIConfig') : t('editAIConfig')}
            </h3>
          </div>
          <div className="px-4 sm:px-6 py-4 space-y-4">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">{t('configKey' as any)}</label>
                  <input
                    type="text"
                    name="config_key"
                    value={formData.config_key || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-650 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">{t('description')}</label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-650 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-shadow"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">{t('configValue' as any)}</label>
                  <textarea
                    name="config_value"
                    value={formData.config_value || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-650 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm transition-shadow"
                    rows={6}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormMode(null);
                    setEditingConfig(null);
                    setFormData({
                      config_key: '',
                      config_value: '',
                      description: ''
                    });
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm font-semibold transition-colors text-center"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={formMode === 'add' ? handleAddAIConfig : handleUpdateAIConfig}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-1 text-sm font-semibold transition-colors"
                  disabled={!(formData.config_key && formData.config_value)}
                >
                  {formMode === 'add' ? t('createAIConfig' as any) : t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Playground */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" /> AI Playground
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Prueba las configuraciones de IA en tiempo real.
            </p>
          </div>
          {testMessages.length > 0 && (
            <button
              onClick={() => setTestMessages([])}
              className="self-start sm:self-auto px-3 py-1.5 text-xs font-semibold bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/35 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors flex items-center gap-1"
            >
              Limpiar Chat
            </button>
          )}
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-md p-3 bg-slate-50 dark:bg-slate-800">
            {testMessages.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center my-auto">No hay mensajes aún. Envía una consulta para empezar.</p>
            ) : (
              <div className="space-y-3">
                {testMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isTesting && (
              <div className="flex justify-start mt-3">
                <div className="max-w-[85%] px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Pensando...
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTestChat(); }}
              placeholder="Escribe tu consulta de prueba aquí..."
              className="flex-1 min-w-0 px-3 py-2 border border-slate-300 dark:border-slate-650 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-shadow"
              disabled={isTesting}
            />
            <button
              onClick={handleTestChat}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-1 text-sm font-semibold shrink-0 transition-colors"
              disabled={isTesting || !testInput.trim()}
            >
              <Send className="w-4 h-4" /> Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IAConfigView;