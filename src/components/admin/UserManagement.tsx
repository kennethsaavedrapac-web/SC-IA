import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { UserProfile } from "../../types";
import { supabase } from "../../lib/supabaseClient";

const UserManagement: React.FC<{ user: UserProfile }> = ({ user }) => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<"user" | "admin">("user");

  // Fetch all users (profiles)
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

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: "user" | "admin") => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );
    } catch (err: any) {
      setError(err.message || 'Error updating user role');
      console.error('Error updating user role:', err);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('userManagement')}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t('totalUsers')}: {users.length}
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t('avatar')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t('name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t('email')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t('role')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {users.map((userItem) => (
              <tr key={userItem.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4 flex items-center space-x-3">
                  {userItem.avatarUrl ? (
                    <img
                      src={userItem.avatarUrl}
                      alt={userItem.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                      {userItem.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium text-slate-900 dark:text-white">{userItem.name}</span>
                </td>
                <td className="px-6 py-4 text-slate-900 dark:text-white">{userItem.email || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    userItem.role === 'admin'
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                      : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                  }`}
                  >
                    {userItem.role === 'admin' ? t('admin') : t('user')}
                  </span>
                </td>
                <td className="px-6 py-4 space-x-3">
                  {/* Role selector (only show if not editing yourself or if admin) */}
                  {(userItem.id !== user.id || user.role === 'admin') && (
                    <select
                      value={userItem.role}
                      onChange={(e) => setNewRole(e.target.value as "user" | "admin")}
                      className="w-24 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">{t('user')}</option>
                      <option value="admin">{t('admin')}</option>
                    </select>
                  )}
                  {!((userItem.id !== user.id || user.role === 'admin')) && (
                    <span className="text-xs text-slate-500 dark:slasate-400">{t('yourRole')}</span>
                  )}
                  <button
                    onClick={() => handleRoleChange(userItem.id, newRole)}
                    disabled={editingUserId === userItem.id}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      editingUserId === userItem.id
                        ? 'bg-slate-200 dark:bg-slate-700/50 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700'
                    }`}
                  >
                    {editingUserId === userItem.id ? t('updating') : t('save')}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
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