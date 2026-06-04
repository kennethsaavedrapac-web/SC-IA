import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { Calendar, CheckCircle, Clock, Edit, Trash2, UserPlus, AlertTriangle, ShieldAlert, Send, LampDesk } from "lucide-react";

interface AdminAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'banner' | 'alert' | 'promotion';
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  start_time: string | null; // HH:MM format
  end_time: string | null; // HH:MM format
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Optional targeting fields
  departments?: string[]; // null for all
  municipalities?: string[]; // null for all
  user_segments?: string[]; // null for all (e.g., ['premium', 'new'])
}

const AnnouncementManagement: React.FC = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AdminAnnouncement | null>(null);
  const [formData, setFormData] = useState<Partial<AdminAnnouncement>>({
    title: '',
    message: '',
    type: 'banner',
    start_date: '',
    end_date: '',
    start_time: null,
    end_time: null,
    is_active: true
  });

  // Check if user is admin
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (!isAdmin) {
      setError("Acceso denegado");
      return;
    }

    const loadAnnouncements = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('admin_announcements')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAnnouncements(data || []);
      } catch (err: any) {
        setError(err.message || 'Error loading announcements');
        console.error('Error loading announcements:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Handle date changes
  const handleDateChange = (field: 'start_date' | 'end_date', date: string | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: date || ''
    }));
  };

  // Handle time changes
  const handleTimeChange = (field: 'start_time' | 'end_time', time: string | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: time
    }));
  };

  // Handle adding new announcement
  const handleAddAnnouncement = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.message || !formData.start_date || !formData.end_date) {
        alert('Por favor complete todos los campos obligatorios');
        return;
      }

      const newAnnouncement: Omit<AdminAnnouncement, 'id' | 'created_at' | 'updated_at' | 'created_by'> = {
        title: formData.title!,
        message: formData.message!,
        type: formData.type! as 'banner' | 'alert' | 'promotion',
        start_date: formData.start_date!,
        end_date: formData.end_date!,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        is_active: formData.is_active ?? true,
        created_by: user?.id || 'unknown'
      };

      const { data, error } = await supabase
        .from('admin_announcements')
        .insert(newAnnouncement);

      if (error) throw error;

      // Reset form and close
      setFormMode(null);
      setFormData({
        title: '',
        message: '',
        type: 'banner',
        start_date: '',
        end_date: '',
        start_time: null,
        end_time: null,
        is_active: true
      });

      // Reload announcements
      await loadAnnouncements();

      // Show success (in real app would use toast)
      alert('Anuncio creado exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error creating announcement');
      console.error('Error creating announcement:', err);
    }
  };

  // Handle updating announcement
  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement) return;

    try {
      // Validate required fields
      if (!formData.title || !formData.message || !formData.start_date || !formData.end_date) {
        alert('Por favor complete todos los campos obligatorios');
        return;
      }

      const updates: Partial<AdminAnnouncement> = {
        title: formData.title!,
        message: formData.message!,
        type: formData.type! as 'banner' | 'alert' | 'promotion',
        start_date: formData.start_date!,
        end_date: formData.end_date!,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        is_active: formData.is_active ?? true,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('admin_announcements')
        .update(updates)
        .eq('id', editingAnnouncement!.id);

      if (error) throw error;

      // Reset form and close
      setFormMode(null);
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        message: '',
        type: 'banner',
        start_date: '',
        end_date: '',
        start_time: null,
        end_time: null,
        is_active: true
      });

      // Reload announcements
      await loadAnnouncements();

      // Show success
      alert('Anuncio actualizado exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error updating announcement');
      console.error('Error updating announcement:', err);
    }
  };

  // Handle deleting announcement
  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este anuncio? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Reload announcements
      await loadAnnouncements();

      // Show success
      alert('Anuncio eliminado exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error deleting announcement');
      console.error('Error deleting announcement:', err);
    }
  };

  // Handle toggling announcement active state
  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_announcements')
        .update({
          is_active: !currentState,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Reload announcements
      await loadAnnouncements();
    } catch (err: any) {
      setError(err.message || 'Error toggling announcement');
      console.error('Error toggling announcement:', err);
    }
  };

  // Load announcements function (for refresh)
  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err: any) {
      setError(err.message || 'Error loading announcements');
      console.error('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('announcementManagement')}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFormMode('add');
              setEditingAnnouncement(null);
              setFormData({
                title: '',
                message: '',
                type: 'banner',
                start_date: '',
                end_date: '',
                start_time: null,
                end_time: null,
                is_active: true
              });
            }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <UserPlus className="w-4 h-4" /> {t('addAnnouncement')}
          </button>
          <button
            onClick={loadAnnouncements}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <Clock className="w-4 h-4" /> {t('refresh')}
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('announcementsList')} ({announcements.length})</h3>
        </div>
        <div className="px-6 py-4 overflow-y-auto max-h-[400px]">
          {announcements.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
              <p>{t('noAnnouncementsFound')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="px-6 py-4 flex justify-between items-center">
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    {/* Type indicator */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      {announcement.type === 'alert' ? (
                        <div className="w-4 h-4 bg-red-500 rounded-full" />
                      ) : announcement.type === 'promotion' ? (
                        <div className="w-4 h-4 bg-blue-500 rounded-full" />
                      ) : (
                        <div className="w-4 h-4 bg-green-500 rounded-full" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{announcement.title}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {t(`announcementType.${announcement.type}`)} |
                        {new Date(announcement.start_date).toLocaleDateString()} -
                        {new Date(announcement.end_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {announcement.is_active ? t('active') : t('inactive')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {announcement.is_active ?
                        `<span className="text-green-500">●</span> ${t('active')}` :
                        `<span className="text-gray-500">●</span> ${t('inactive')}`}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormMode('edit');
                          setEditingAnnouncement(announcement);
                          setFormData({
                            title: announcement.title,
                            message: announcement.message,
                            type: announcement.type,
                            start_date: announcement.start_date,
                            end_date: announcement.end_date,
                            start_time: announcement.start_time,
                            end_time: announcement.end_time,
                            is_active: announcement.is_active
                          });
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {t('edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(announcement.id, !!announcement.is_active)}
                        className={`px-3 py-1.5 text-xs font-medium ${
                          announcement.is_active
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-${
                          announcement.is_active ? 'yellow' : 'green'
                        }-500`}
                      >
                        {announcement.is_active ? t('deactivate') : t('activate')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        {t('delete')}
                      </button>
                    </div>
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
              {formMode === 'add' ? t('addAnnouncement') : t('editAnnouncement')}
            </h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('title')}</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('announcementType')}</label>
                  <select
                    name="type"
                    value={formData.type || 'banner'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="banner">{t('announcementType.banner')}</option>
                    <option value="alert">{t('announcementType.alert')}</option>
                    <option value="promotion">{t('announcementType.promotion')}</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('message')}</label>
                <textarea
                  name="message"
                  value={formData.message || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('startDate')}</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date || ''}
                    onChange={(e) => handleDateChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('endDate')}</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date || ''}
                    onChange={(e) => handleDateChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('startTime')}</label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time || ''}
                    onChange={(e) => handleTimeChange('start_time', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('endTime')}</label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time || ''}
                    onChange={(e) => handleTimeChange('end_time', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center">
                      {formData.is_active ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      ) : (
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('active')}</span>
                  </div>
                  <label className="relative inline-flex items-center px-2 py-1 mr-2 leading-none text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 cursor-pointer select-none"
                    onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                  >
                    <input type="checkbox" className="sr-only" />
                    <span className="ls-0.5">{formData.is_active ? t('enabled') : t('disabled')}</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setFormMode(null);
                    setEditingAnnouncement(null);
                    setFormData({
                      title: '',
                      message: '',
                      type: 'banner',
                      start_date: '',
                      end_date: '',
                      start_time: null,
                      end_time: null,
                      is_active: true
                    });
                  }}
                  className="mr-3 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={formMode === 'add' ? handleAddAnnouncement : handleUpdateAnnouncement}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!(formData.title && formData.message && formData.start_date && formData.end_date)}
                >
                  {formMode === 'add' ? t('createAnnouncement') : t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManagement;