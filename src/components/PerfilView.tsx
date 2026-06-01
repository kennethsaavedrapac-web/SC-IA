import React, { useState } from "react";
import QRCode from "react-qr-code";
import { ArrowLeft, Bell, Settings, User, Shield, AlertTriangle, Key, BellRing, Heart, ChevronRight, BadgeCheck, Check, Clipboard, CheckCircle, LogOut } from "lucide-react";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

interface PerfilViewProps {
  user: UserProfile;
  isPremium: boolean;
  onGoBack: () => void;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout?: () => void;
}

export default function PerfilView({ user, isPremium, onGoBack, onUpdateUser, onLogout }: PerfilViewProps) {
  const { t } = useLanguage();
  const [activeMenuSection, setActiveMenuSection] = useState<string | null>(null);

  // Forms state for updates
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editCity, setEditCity] = useState(user.city);
  const [isSavedAlertOpen, setIsSavedAlertOpen] = useState(false);
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);

  // QR Code secret text containing vital clinical metrics in case of real first-aid scans
  const qrTelemetryText = `Salud-Conecta IA EMERGENCY FILE:
Patient: Kenneth S. 
Location: Granada, Nicaragua
Blood Type: O+ 
Allergies: Polen
Emergency Contact: Cruz Roja Granada - 128`;

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name: editName,
      email: editEmail,
      city: editCity,
    });
    setIsSavedAlertOpen(true);
    setTimeout(() => {
      setIsSavedAlertOpen(false);
      setActiveMenuSection(null);
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 border-b border-blue-50/50 dark:border-slate-800">
        <div className="flex justify-between items-center w-full max-w-5xl mx-auto">
          <button
            id="btn-profile-go-back"
            onClick={onGoBack}
            className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 flex items-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white flex items-center">
            {t('perfil')}
            <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-400 text-[10px] uppercase font-bold flex items-center space-x-0.5">
              <BadgeCheck className="w-3 h-3 text-blue-600 inline shrink-0" />
              <span>{t('verified')}</span>
            </span>
          </h2>

          {/* Bells with alert badge */}
          <button
            id="btn-profile-bell"
            onClick={() => {
              alert(t('noAlerts'));
              setShowNotificationBadge(false);
            }}
            className="p-2 -mr-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 relative active:scale-95"
          >
            <Bell className="w-6 h-6" />
            {showNotificationBadge && (
              <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-bounce"></span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="px-6 pt-6 flex-1 space-y-6 max-w-5xl mx-auto w-full">

        {/* Profile Card Header segment */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>

          {/* Avatar Picture with verified ring */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full p-1.5 bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-md">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-800"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white dark:border-slate-800 rounded-full shadow-inner animate-pulse"></span>
          </div>

          <div className="text-center sm:text-left space-y-1.5">
            <h3 className="font-display font-medium text-2.5xl text-slate-900 dark:text-white tracking-tight leading-none flex items-center justify-center sm:justify-start">
              {(user.id === "guest" || user.name === "Invitado") ? t('guest') : user.name}.
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-medium font-mono">{user.email}</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold flex items-center justify-center sm:justify-start space-x-1">
              <span className="text-blue-500 text-sm">📍</span>
              <span>{user.city}, {user.country}</span>
            </p>

            {isPremium && (
              <span className="inline-block bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-250/30 text-yellow-600/90 font-mono text-[9px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full mt-2">
                {t('premiumMember')}
              </span>
            )}
          </div>
        </div>

        {/* QR Code section segment card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-5 justify-between">

            <div className="flex-1 text-center sm:text-left space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-blue-500 flex items-center justify-center sm:justify-start gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>{t('emergencyCard')}</span>
              </span>
              <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">{t('shareProfile')}</h4>
              <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed max-w-sm">
                {t('emergencyDesc')}
              </p>

              <div className="pt-2 flex justify-center sm:justify-start">
                <span className="inline-flex items-center space-x-1 bg-blue-50 text-blue-700 text-[10px] px-3 py-1.5 rounded-full font-bold border border-blue-100">
                  <span className="text-sm">🔒</span>
                  <span>{t('authorizedOnly')}</span>
                </span>
              </div>
            </div>

            {/* Visual Real Active QR Generator Container */}
            <div
              onClick={() => alert(`Contenido del código de seguridad médica:\n\n${qrTelemetryText}`)}
              className="w-36 h-36 border border-slate-200/80 dark:border-slate-700 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center cursor-pointer shadow-inner animate-pulse duration-300 hover:scale-105 transition-transform"
              title="Presiona para ampliar detalles clínicos del QR"
            >
              <QRCode
                value={qrTelemetryText}
                size={112}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                fgColor="currentColor"
                className="text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="text-center sm:text-left text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-50 dark:border-slate-800 pt-2.5">
            {t('qrDisclaimer')}
          </div>
        </div>

        {/* ACCOUNT MANAGE LIST SEGMENT */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('accountManagement')}</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Menu Option items collapsible blocks */}
            {[
              {
                id: "personal",
                title: t('personalInfo'),
                subtitle: t('personalSubtitle'),
                icon: User,
                color: "text-blue-600 bg-blue-50 border border-blue-100",
              },
              {
                id: "seguridad",
                title: t('securityPrivacy'),
                subtitle: t('securitySubtitle'),
                icon: Key,
                color: "text-emerald-600 bg-emerald-50 border border-emerald-100",
              },
              {
                id: "notificaciones",
                title: t('notifications'),
                subtitle: t('notificationsSubtitle'),
                icon: BellRing,
                color: "text-purple-600 bg-purple-50 border border-purple-100",
              },
              {
                id: "preferencias",
                title: t('healthPrefs'),
                subtitle: t('healthSubtitle'),
                icon: Heart,
                color: "text-rose-600 bg-rose-50 border border-rose-100",
              },
            ].map((item) => {
              const Icon = item.icon;
              const isOpen = activeMenuSection === item.id;

              return (
                <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                  <button
                    id={`btn-profile-menu-${item.id}`}
                    onClick={() => setActiveMenuSection(isOpen ? null : item.id)}
                    className="w-full p-4.5 text-left flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors outline-none"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-800 dark:text-white">{item.title}</h5>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-400 transform transition-transform ${isOpen ? "rotate-90 text-blue-600" : ""}`} />
                  </button>

                  {/* Collapsed Nested Details Screen panel */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="border-t border-slate-50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20"
                      >
                        <div className="p-5 text-xs text-slate-600 space-y-4">

                          {/* Nested Personal info update Form */}
                          {item.id === "personal" && (
                            <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-left">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] uppercase font-bold text-slate-400">{t('patientName')}</label>
                                  <input
                                    id="input-edit-username"
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-blue-500 text-xs font-semibold"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">{t('secureEmail')}</label>
                                  <input
                                    id="input-edit-useremail"
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-blue-500 text-xs font-mono font-semibold"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">{t('residence')}</label>
                                  <input
                                    id="input-edit-usercity"
                                    type="text"
                                    value={editCity}
                                    onChange={(e) => setEditCity(e.target.value)}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-blue-500 text-xs font-semibold"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">{t('emergencyPhone')}</label>
                                  <input
                                    type="text"
                                    defaultValue="+505 8888-9999"
                                    className="w-full text-slate-800 dark:text-slate-400 bg-white dark:bg-slate-800 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-blue-500 text-xs font-semibold"
                                    disabled
                                  />
                                </div>
                              </div>

                              <button
                                id="btn-save-personal-info"
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2 px-5 rounded-xl border-none outline-none text-xs transition-all tracking-wide"
                              >
                                {t('saveChanges')}
                              </button>
                            </form>
                          )}

                          {/* Nested secure privacy content panel */}
                          {item.id === "seguridad" && (
                            <div className="space-y-3.5 text-left">
                              <p className="text-slate-500 dark:text-slate-400 leading-normal">
                                {t('securityDesc')}
                              </p>
                              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{t('biometricAuth')}</span>
                                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full font-bold">{t('inactive')}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{t('encryptionTitle')}</span>
                                <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold">{t('activeAES')}</span>
                              </div>
                            </div>
                          )}

                          {/* Nested alert notifications checker options */}
                          {item.id === "notificaciones" && (
                            <div className="space-y-3 text-left">
                              <label className="flex items-center space-x-3 cursor-pointer p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <input type="checkbox" defaultChecked className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-0 cursor-pointer ml-2" />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{t('alertVaccines')}</span>
                              </label>
                              <label className="flex items-center space-x-3 cursor-pointer p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <input type="checkbox" defaultChecked className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-0 cursor-pointer ml-2" />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{t('alertAppointments')}</span>
                              </label>
                              <label className="flex items-center space-x-3 cursor-pointer p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <input type="checkbox" className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-0 cursor-pointer ml-2" />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{t('alertEmails')}</span>
                              </label>
                            </div>
                          )}

                          {/* Nested Allergologies condition list */}
                          {item.id === "preferencias" && (
                            <div className="space-y-4 text-left">
                              <div>
                                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">{t('recordedConditions')}</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {user.healthConditions.map((cond, i) => (
                                    <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-bold text-[10px] border border-blue-100 dark:border-blue-900/50 flex items-center space-x-1">
                                      <span>⚕️</span>
                                      <span>{cond}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-slate-800 dark:text-white">{t('bloodType')}</span>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{t('bloodDesc')}</p>
                                </div>
                                <span className="text-sm font-bold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-full font-mono border border-rose-100 dark:border-rose-900/50">{t('bloodOPos')}</span>
                              </div>
                            </div>
                          )}

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Saved feedback card banner */}
        <AnimatePresence>
          {isSavedAlertOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-emerald-50 border border-emerald-250/20 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-sm"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600 focus:outline-none shrink-0" />
              <span>{t('saveSuccess')}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Protection standard banner at end */}
        <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl p-4.5 border border-slate-200/50 dark:border-slate-800 flex items-center space-x-3.5 mt-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
              {t('infoProtected')}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
              {t('standardsDesc')}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            id="btn-profile-logout"
            onClick={() => {
              if (window.confirm(t('logoutConfirm'))) {
                onLogout();
              }
            }}
            className="w-full mt-5 bg-red-50 dark:bg-red-900/10 hover:bg-red-100/80 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200/85 dark:border-red-900/30 rounded-2xl py-3.5 px-5 font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5 text-red-500 shrink-0" />
            <span>{t('logout')}</span>
          </button>
        )}

      </main>
    </div>
  );
}
