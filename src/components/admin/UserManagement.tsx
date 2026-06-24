import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { UserProfile } from "../../types";
import { supabase } from "../../lib/supabaseClient";
import { Shield, Star, Users, CheckCircle } from "lucide-react";

const UserManagement: React.FC<{ user: UserProfile }> = ({ user }) => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, "user" | "admin">>({});

  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data as UserProfile[]);
      } catch (err: any) {
        setError(err.message || 'Error fetching users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  
  const handlePremiumToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: newStatus })
        .eq('id', userId);

      if (error) throw error;

      
      setUsers(prevUsers =>
        prevUsers.map(u => u.id === userId ? { ...u, is_premium: newStatus } as UserProfile : u)
      );
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el estado Premium del usuario');
    }
  };

  
  const handleRoleChange = async (userId: string, targetRole: "user" | "admin") => {
    try {
      setEditingUserId(userId);
      const { error } = await supabase
        .from('profiles')
        .update({ role: targetRole })
        .eq('id', userId);

      if (error) throw error;

      
      setUsers(prevUsers =>
        prevUsers.map(u => u.id === userId ? { ...u, role: targetRole } : u)
      );

      
      setPendingRoles(prev => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    } catch (err: any) {
      setError(err.message || 'Error updating user role');
      console.error('Error updating user role:', err);
    } finally {
      setEditingUserId(null);
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

  
  const totalAdmins = users.filter(u => (u as any).role === 'admin').length;
  const totalPremium = users.filter(u => (u as any).is_premium).length;

  return (
    <div className="space-y-6">
      {}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('userManagement')}</h2>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">{t('totalUsers')}</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{users.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600"><Users className="w-5 h-5" /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Administradores</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{totalAdmins}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600"><Shield className="w-5 h-5" /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Usuarios Premium</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-black text-slate-800 dark:text-white">{totalPremium}</p>
              <span className="text-xs font-semibold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/50">
                Activos
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500"><Star className="w-5 h-5" /></div>
        </div>
      </div>

      {}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Avatar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Suscripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {users.map((userItem) => {
              const currentRole = (userItem as any).role || 'user';
              const userPendingRole = userItem.id ? pendingRoles[userItem.id] : undefined;
              const selectedRole = userPendingRole ?? currentRole;
              const hasChanges = userPendingRole !== undefined && userPendingRole !== currentRole;

              return (
                <tr key={userItem.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {userItem.avatarUrl ? (
                      <img
                        src={userItem.avatarUrl}
                        alt={userItem.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                        {userItem.name ? userItem.name.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                    {userItem.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-white">{userItem.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => userItem.id && handlePremiumToggle(userItem.id, (userItem as any).is_premium)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1.5 w-fit ${(userItem as any).is_premium ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/50' : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}
                    >
                      {(userItem as any).is_premium ? <><Star className="w-3 h-3 fill-current" /> Premium</> : 'Básico'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentRole === 'admin'
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                        : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    }`}
                    >
                      {currentRole === 'admin' ? t('admin') : t('user')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-3">
                    {/* Role selector (only show if not editing yourself or if admin) */}
                    {(userItem.id !== user.id || (user as any).role === 'admin') && (
                      <select
                        value={selectedRole}
                        onChange={(e) => userItem.id && setPendingRoles(prev => ({ ...prev, [userItem.id!]: e.target.value as "user" | "admin" }))}
                        className="w-28 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="user">{t('user')}</option>
                        <option value="admin">{t('admin')}</option>
                      </select>
                    )}
                    {!((userItem.id !== user.id || (user as any).role === 'admin')) && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">{t('yourRole')}</span>
                    )}
                    <button
                      onClick={() => userItem.id && handleRoleChange(userItem.id, selectedRole)}
                      disabled={editingUserId === userItem.id || !hasChanges}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        !hasChanges
                          ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                          : editingUserId === userItem.id
                            ? 'bg-slate-200 dark:bg-slate-700/50 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700'
                      }`}
                    >
                      {editingUserId === userItem.id ? t('updating') : t('save')}
                    </button>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
                  {t('noUsersFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;