import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { Plus, Edit2, Trash2, AlertTriangle, Save, X, Megaphone, Star, Info, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

interface Announcement {
  id?: string;
  tipo: "banner" | "alert" | "promotion";
  titulo: string;
  mensaje: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}

const getIconForType = (type: string) => {
  switch (type) {
    case "alert": return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    case "banner": return <Megaphone className="w-5 h-5 text-blue-500" />;
    case "promotion": return <Star className="w-5 h-5 text-amber-500" />;
    default: return <Info className="w-5 h-5 text-slate-500" />;
  }
};

interface AnnouncementFormProps {
  initialData: Announcement | null;
  onSave: (data: Announcement) => Promise<void>;
  onCancel: () => void;
  t: any;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({ initialData, onSave, onCancel, t }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Announcement>(
    initialData || {
      tipo: "alert",
      titulo: "",
      mensaje: "",
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      activo: true
    }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.titulo || !formData.mensaje) return alert("El título y mensaje son obligatorios");
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase font-bold text-slate-500">{t('title')}</label>
          <input 
            type="text" 
            name="titulo"
            value={formData.titulo}
            onChange={handleInputChange}
            placeholder="Ej. Alerta Epidemiológica" 
            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" 
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase font-bold text-slate-500">{t('announcementType')}</label>
          <select name="tipo" value={formData.tipo} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors">
            <option value="alert">{t('announcementType_alert' as any) || 'Alerta'}</option>
            <option value="banner">{t('announcementType_banner' as any) || 'Banner'}</option>
            <option value="promotion">{t('announcementType_promotion' as any) || 'Promoción'}</option>
          </select>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[11px] uppercase font-bold text-slate-500">{t('message')}</label>
          <textarea 
            rows={3} 
            name="mensaje"
            value={formData.mensaje}
            onChange={handleInputChange}
            placeholder="Escribe el contenido del anuncio..." 
            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 resize-none transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] uppercase font-bold text-slate-500">{t('startDate')}</label>
          <input 
            type="date" 
            name="fecha_inicio"
            value={formData.fecha_inicio}
            onChange={handleInputChange}
            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] uppercase font-bold text-slate-500">{t('endDate')}</label>
          <input 
            type="date" 
            name="fecha_fin"
            value={formData.fecha_fin}
            onChange={handleInputChange}
            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" 
          />
        </div>

        <div className="space-y-1.5 flex items-center md:col-span-2 pt-2">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input type="checkbox" name="activo" checked={formData.activo} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Anuncio Activo (Público)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-2 gap-3">
        <button onClick={onCancel} disabled={isSaving} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          {t('cancel')}
        </button>
        <button onClick={handleSubmit} disabled={isSaving} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
          {initialData ? "Actualizar Anuncio" : t('saveChanges')}
        </button>
      </div>
    </div>
  );
};

export default function AnnouncementManagement() {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_announcements')
        .select('*')
        .order('creado_en', { ascending: false });
        
      if (error) throw error;
      if (data) setAnnouncements(data as Announcement[]);
    } catch (err) {
      console.error("Error fetching announcements:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSave = async (formData: Announcement) => {
    try {
      const { id, creado_en, created_at, ...payload } = formData as any;

      if (editingItem?.id) {
        const { error } = await supabase.from('admin_announcements').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('admin_announcements').insert([payload]);
        if (error) throw error;
      }
      await fetchAnnouncements();
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      console.error("Error saving announcement:", err);
      alert("Error al guardar el anuncio.");
    }
  };

  const handleEdit = (item: Announcement) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este anuncio?")) return;
    try {
      const { error } = await supabase.from('admin_announcements').delete().eq('id', id);
      if (error) throw error;
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Error deleting announcement:", err);
    }
  };

  const toggleForm = () => {
    if (showForm) {
      setShowForm(false);
      setEditingItem(null);
    } else {
      setEditingItem(null);
      setShowForm(true);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('announcementManagement')}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Crea banners y notificaciones que verán los usuarios.</p>
        </div>
        <button 
          onClick={toggleForm} 
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
        >
          {showForm && !editingItem ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm && !editingItem ? t('cancel') : t('createAnnouncement')}</span>
        </button>
      </div>

      {/* Formulario extraído para evitar re-renders */}
      {showForm && (
        <AnnouncementForm 
          key={editingItem ? editingItem.id : 'new'} 
          initialData={editingItem} 
          onSave={handleSave} 
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
          t={t} 
        />
      )}

      {/* Lista */}
      <div className="p-6">
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">
              {t('noAnnouncementsFound')}
            </div>
          ) : (
            announcements.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                  {getIconForType(item.tipo)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">{item.titulo}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.activo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                      {item.activo ? t('active') : t('inactive')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug mb-2">{item.mensaje}</p>
                  <div className="text-[11px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800/50 w-fit px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                    {item.fecha_inicio} &nbsp; ➔ &nbsp; {item.fecha_fin}
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0 justify-end sm:justify-start">
                  <button onClick={() => handleEdit(item)} className="p-2.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id!)} className="p-2.5 text-rose-600 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}