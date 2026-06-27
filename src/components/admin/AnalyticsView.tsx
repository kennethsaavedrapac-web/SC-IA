import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { supabase } from "../../lib/supabaseClient";
import { Users, Star, Activity, Megaphone, MapPin, Loader2, ArrowUpRight, ArrowDownRight, Clock, MessageSquare, CreditCard, Calendar } from "lucide-react";

const AnalyticsView: React.FC = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    newUsersThisWeek: 0,
    overriddenCenters: 0,
    activeAnnouncements: 0,
    recentUsers: [] as any[]
  });

  const [chatActivity, setChatActivity] = useState<{ dayLabel: string; count: number }[]>([]);
  const [chatSource, setChatSource] = useState<"db" | "local" | "simulated">("simulated");

  const isAdmin = (profile as any)?.role === "admin";

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAdmin) return;
      
      try {
        
        const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        
        
        const { count: premiumUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true);
        
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const { count: newUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString());
        
        
        const { count: overriddenCenters } = await supabase.from('health_center_overrides').select('*', { count: 'exact', head: true });
        
        
        const { count: activeAnnouncements } = await supabase.from('admin_announcements').select('*', { count: 'exact', head: true }).eq('activo', true);
        
        
        const { data: recentUsers } = await supabase.from('profiles').select('id, nombre, created_at, avatar_url, role').order('created_at', { ascending: false }).limit(5);

        setStats({
          totalUsers: totalUsers || 0,
          premiumUsers: premiumUsers || 0,
          newUsersThisWeek: newUsers || 0,
          overriddenCenters: overriddenCenters || 0,
          activeAnnouncements: activeAnnouncements || 0,
          recentUsers: recentUsers || []
        });

        // Load chat activity logs
        let chatLogs: any[] = [];
        let source: "db" | "local" | "simulated" = "simulated";

        try {
          const { data, error: chatLogsError } = await supabase
            .from('chat_logs')
            .select('created_at')
            .gte('created_at', oneWeekAgo.toISOString());
            
          if (!chatLogsError && data) {
            chatLogs = data;
            source = "db";
          } else {
            throw chatLogsError || new Error("Failed to fetch chat logs");
          }
        } catch (err) {
          // Fallback to localStorage triageHistory
          const localLogs: any[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("triageHistory_")) {
              try {
                const stored = localStorage.getItem(key);
                if (stored) {
                  const messages = JSON.parse(stored);
                  if (Array.isArray(messages)) {
                    messages.forEach((msg: any) => {
                      if (msg.sender === "user" && msg.createdAt) {
                        localLogs.push({ created_at: msg.createdAt });
                      }
                    });
                  }
                }
              } catch (e) {
                // ignore parsing error
              }
            }
          }
          if (localLogs.length > 0) {
            chatLogs = localLogs;
            source = "local";
          }
        }

        const getSpanishDayLabel = (date: Date) => {
          const days = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
          return days[date.getDay()];
        };

        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return {
            dateStr: d.toISOString().split('T')[0],
            dayLabel: getSpanishDayLabel(d),
            count: 0
          };
        });

        let finalActivity = [];
        if (source === "simulated") {
          const simulatedValues = [12, 28, 15, 42, 22, 35, 18];
          finalActivity = last7Days.map((day, idx) => ({
            dayLabel: day.dayLabel,
            count: simulatedValues[idx]
          }));
        } else {
          finalActivity = last7Days.map(day => {
            const matching = chatLogs.filter(log => {
              try {
                const logDate = new Date(log.created_at).toISOString().split('T')[0];
                return logDate === day.dateStr;
              } catch (e) {
                return false;
              }
            });
            return {
              dayLabel: day.dayLabel,
              count: matching.length
            };
          });
        }

        setChatActivity(finalActivity);
        setChatSource(source);

      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center py-12">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="mt-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Cargando métricas...</p>
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
      {}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('analytics')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Métricas reales en vivo de tu plataforma.</p>
        </div>
        <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-100 dark:border-emerald-800 flex items-center gap-1.5 shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Sincronizado
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-600/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('totalUsers')}</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 leading-none">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900 shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 w-fit px-2.5 py-1 rounded-md">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{stats.newUsersThisWeek} esta semana</span>
          </div>
        </div>

        {}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suscripciones Premium</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 leading-none">{stats.premiumUsers}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-500 border border-amber-100 dark:border-amber-800 shrink-0">
              <Star className="w-6 h-6 fill-amber-500/20" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 w-fit px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-700">
            <span>{stats.totalUsers > 0 ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1) : 0}% del total</span>
          </div>
        </div>

        {}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Centros Modificados</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 leading-none">{stats.overriddenCenters}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 w-fit px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-700">
            <span>En base de datos</span>
          </div>
        </div>

        {}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alertas Activas</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 leading-none">{stats.activeAnnouncements}</p>
            </div>
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800 shrink-0">
              <Megaphone className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 w-fit px-2.5 py-1 rounded-md">
            <Activity className="w-3.5 h-3.5" />
            <span>Impactando a la audiencia</span>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-brand-400" /> Nuevos Usuarios Registrados
          </h3>
          <div className="space-y-3">
            {stats.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.nombre} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                    {u.nombre.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{u.nombre}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                {u.role === 'admin' && (
                  <span className="px-2.5 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-[10px] font-bold rounded-md">Admin</span>
                )}
              </div>
            ))}
            {stats.recentUsers.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-6">Aún no hay registros de usuarios.</p>
            )}
          </div>
        </div>

        {}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" /> Actividad del Chat ({chatSource === "db" ? "Base de Datos" : chatSource === "local" ? "Historial Local" : "Simulado"})
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {chatSource === "db" ? "Real" : chatSource === "local" ? "Local" : "Simulación"}
            </span>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 h-40 border-b border-slate-100 dark:border-slate-800 pb-2 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-t border-slate-400 w-full"></div>
              <div className="border-t border-slate-400 w-full"></div>
              <div className="border-t border-slate-400 w-full"></div>
            </div>
            {chatActivity.map((day, idx) => {
              const maxCount = Math.max(...chatActivity.map(d => d.count), 1);
              const heightPct = Math.max((day.count / maxCount) * 100, 5);
              return (
                <div key={idx} className="w-full bg-emerald-500/20 hover:bg-emerald-500/40 rounded-t-lg relative group transition-colors" style={{ height: `${heightPct}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-md">
                    {day.count === 1 ? "1 mensaje" : `${day.count} mensajes`}
                  </div>
                  <div className="absolute top-0 inset-x-0 bg-emerald-500 rounded-t-lg shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ height: '4px' }}></div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase">
            {chatActivity.map((day, idx) => (
              <span key={idx} className="w-full text-center">{day.dayLabel}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsView;