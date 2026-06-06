import React, { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { Plus, Edit2, Trash2, AlertTriangle, Save, X, Megaphone, Star, CheckCircle, Info, Loader2 } from "lucide-react";
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

export default function AnnouncementManagement() {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  const [formData, setFormData] = useState<Announcement>({
    tipo: "alert",
    titulo: "",
    mensaje: "",
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    activo: true
  });

  // Obtener anuncios desde Supabase
  const fetchAnnouncements = async () => {
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
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const getIconForType = (type: string) => {
    switch (type) {
      case "alert": return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case "banner": return <Megaphone className="w-5 h-5 text-blue-500" />;
      case "promotion": return <Star className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      tipo: "alert",
      titulo: "",
      mensaje: "",
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      activo: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formData.titulo || !formData.mensaje) return alert("El título y mensaje son obligatorios");
    
    setIsSaving(true);
    try {
      const { id, creado_en, created_at, ...payload } = formData as any;

      if (editingId) {
        const { error } = await supabase.from('admin_announcements').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('admin_announcements').insert([payload]);
        if (error) throw error;
      }
      await fetchAnnouncements();
      resetForm();
    } catch (err) {
      console.error("Error saving announcement:", err);
      alert("Error al guardar el anuncio.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: Announcement) => {
    setFormData(item);
    setEditingId(item.id!);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este anuncio?")) return;
    try {
      const { error } = await supabase.from('admin_announcements').delete().eq('id', id);
      if (error) throw error;
      await fetchAnnouncements();
    } catch (err) {
      console.error("Error deleting announcement:", err);
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
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }} 
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? t('cancel') : t('createAnnouncement')}</span>
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
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
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-500">{t('announcementType')}</label>
              <select name="tipo" value={formData.tipo} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                <option value="alert">{t('announcementType_alert' as any)}</option>
                <option value="banner">{t('announcementType_banner' as any)}</option>
                <option value="promotion">{t('announcementType_promotion' as any)}</option>
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
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-500">{t('startDate')}</label>
              <input 
                type="date" 
                name="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={handleInputChange}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-500">{t('endDate')}</label>
              <input 
                type="date" 
                name="fecha_fin"
                value={formData.fecha_fin}
                onChange={handleInputChange}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" 
              />
            </div>

            <div className="space-y-1.5 flex items-center md:col-span-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="activo" checked={formData.activo} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Anuncio Activo (Público)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
              {editingId ? "Actualizar Anuncio" : t('saveChanges')}
            </button>
          </div>
        </div>
      )}

      {/* Announcements List */}
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