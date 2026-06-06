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
  const [testMessages, setTestMessages] = useState<{sender: 'user'|'bot', text: string}[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  // Check if user is admin (profile type may not include 'role' in its definition)
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

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle adding new AI configuration
  const handleAddAIConfig = async () => {
    try {
      // Validate required fields
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

      // Reset form and close
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

  // Handle updating AI configuration
  const handleUpdateAIConfig = async () => {
    if (!editingConfig) return;

    try {
      // Validate required fields
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

      // Reset form and close
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

  // Handle deleting AI configuration
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

      // Reload AI configurations
      await loadAIConfigs();

      // Show success
      alert('Configuración de IA eliminada exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error deleting AI configuration');
      console.error('Error deleting AI configuration:', err);
    }
  };

  // Load AI configurations function (for refresh)
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

  // Handle Playground Chat
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
        // En el backend se leerá automáticamente de supabase las configuraciones actualizadas
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
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('admin')}</h2>
        <div className="flex items-center gap-3">
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
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
          <button
            onClick={loadAIConfigs}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <Clock className="w-4 h-4" /> {t('loading')}
          </button>
        </div>
      </div>

      {/* AI Configurations List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('admin')} ({aiConfigs.length})</h3>
        </div>
        <div className="px-6 py-4 overflow-y-auto max-h-[400px]">
          {aiConfigs.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
              <p>No AI configurations found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {aiConfigs.map((config) => (
                <div key={config.id} className="px-6 py-4 flex justify-between items-center">
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{config.config_key}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {config.description || 'No description'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Updated: {new Date(config.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                      className="px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {t('edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAIConfig(config.id)}
                      className="px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {formMode !== null && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {formMode === 'add' ? 'Agregar Configuración IA' : 'Editar Configuración IA'}
            </h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('configKey' as any)}</label>
                  <input
                    type="text"
                    name="config_key"
                    value={formData.config_key || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('configValue' as any)}</label>
                  <textarea
                    name="config_value"
                    value={formData.config_value || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('description' as any)}</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end mt-6">
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
                  className="mr-3 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={formMode === 'add' ? handleAddAIConfig : handleUpdateAIConfig}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!(formData.config_key && formData.config_value)}
                >
                  {formMode === 'add' ? t('createAIConfig' as any) : t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IAConfigView;