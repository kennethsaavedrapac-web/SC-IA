import React, { useState } from "react";
import QRCode from "react-qr-code";
import { ArrowLeft, Bell, User, Shield, Key, BellRing, Heart, ChevronRight, CheckCircle, LogOut, Camera, Loader2, Mail, MapPin, QrCode, Lock, ShieldCheck } from "lucide-react";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import { uploadAvatar } from "../lib/avatarService";
import { useAuth } from "../contexts/AuthContext";

interface PerfilViewProps {
  user: UserProfile;
  isPremium: boolean;
  onGoBack: () => void;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout?: () => void;
}

export default function PerfilView({ user, isPremium, onGoBack, onUpdateUser, onLogout }: PerfilViewProps) {
  const { t } = useLanguage();
  const { refreshProfile } = useAuth();
  const [activeMenuSection, setActiveMenuSection] = useState<string | null>(null);

  // Forms state for updates
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editCity, setEditCity] = useState(user.city);
  const [isSavedAlertOpen, setIsSavedAlertOpen] = useState(false);
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);

  // Avatar upload states
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarClick = () => {
    if (user.id === "guest" || !user.id) {
      alert("Los usuarios invitados no pueden cambiar su foto de perfil.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const result = await uploadAvatar(user.id || "", file, user.avatarUrl);
      if (result.success && result.url) {
        onUpdateUser({
          ...user,
          avatarUrl: result.url,
        });
        await refreshProfile();
      } else {
        alert(result.error || "Error al subir la imagen.");
      }
    } catch (err) {
      console.error("Error upload avatar:", err);
      alert("Ocurrió un error inesperado al subir el avatar.");
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name ? name.trim().charAt(0).toUpperCase() : "U";
  };

  const displayName = (user.id === "guest" || user.name === "Invitado") ? t('guest') : user.name;
  const qrTelemetryText = React.useMemo(() => {
    const qrGeneratedAt = new Date();
    const qrExpiresAt = new Date(qrGeneratedAt.getTime() + 24 * 60 * 60 * 1000);

    return JSON.stringify({
      app: "Salud-Conecta IA",
      type: "emergency-medical-profile",
      version: 1,
      generatedAt: qrGeneratedAt.toISOString(),
      expiresAt: qrExpiresAt.toISOString(),
      patient: {
        id: user.id || "guest",
        name: displayName,
        email: user.email,
        location: `${user.city}, ${user.country}`,
        healthConditions: user.healthConditions,
        bloodType: "O+",
        emergencyContact: "+505 8888-9999",
      },
    });
  }, [displayName, user.city, user.country, user.email, user.healthConditions, user.id]);

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
    <div className="flex flex-col min-h-screen pb-24 bg-[#f3f8ff] dark:bg-slate-950 transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full border border-blue-200/55 dark:border-blue-900/30"></div>
        <div className="absolute top-28 -left-8 w-72 h-72 rounded-full border border-blue-200/45 dark:border-blue-900/30"></div>
        <div className="absolute top-72 right-[-8rem] w-72 h-72 rounded-full bg-blue-100/45 dark:bg-blue-950/30 blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_28%,rgba(56,189,248,0.08),transparent_28%),linear-gradient(135deg,transparent_0%,transparent_60%,rgba(59,130,246,0.08)_60%,transparent_78%)]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 sm:px-8 pt-4 sm:pt-6 pb-1 sm:pb-2">
        <div className="flex justify-between items-start w-full max-w-5xl mx-auto">
          <button
            id="btn-profile-go-back"
            onClick={onGoBack}
            className="w-12 h-12 sm:w-20 sm:h-20 bg-white/95 dark:bg-slate-900/90 text-slate-950 dark:text-white rounded-full shadow-[0_18px_40px_rgba(37,99,235,0.12)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            title="Volver"
          >
            <ArrowLeft className="w-6 h-6 sm:w-9 sm:h-9" />
          </button>

          <div className="text-center pt-0.5 sm:pt-2">
            <h2 className="font-display font-bold text-xl sm:text-4xl text-slate-950 dark:text-white tracking-tight leading-none">
              {t('perfil')}
            </h2>
            <span className="mt-1.5 sm:mt-3 inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-lg font-bold text-slate-950 dark:text-slate-100">
              <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
              <span>Salud-Conecta <span className="text-blue-600">IA</span></span>
            </span>
          </div>

          <button
            id="btn-profile-bell"
            onClick={() => {
              alert(t('noAlerts'));
              setShowNotificationBadge(false);
            }}
            className="w-12 h-12 sm:w-20 sm:h-20 bg-white/95 dark:bg-slate-900/90 text-slate-950 dark:text-white rounded-full shadow-[0_18px_40px_rgba(37,99,235,0.12)] flex items-center justify-center relative hover:scale-105 active:scale-95 transition-all"
            title={t('notifications')}
          >
            <Bell className="w-6 h-6 sm:w-8 sm:h-8" />
            {showNotificationBadge && (
              <span className="absolute top-2 right-2 sm:top-4 sm:right-4 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-blue-500 border-[3px] sm:border-4 border-white dark:border-slate-900 rounded-full"></span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 px-4 sm:px-8 pt-4 sm:pt-8 flex-1 space-y-5 sm:space-y-7 max-w-5xl mx-auto w-full">

        {/* Profile Card Header segment */}
        <section className="grid grid-cols-1 md:grid-cols-[minmax(220px,0.9fr)_minmax(280px,1.1fr)] items-center gap-5 sm:gap-8 md:gap-12 md:min-h-[330px]">

          {/* Area de Avatar con Etiqueta */}
          <div className="flex justify-center md:justify-end">
            <div className="relative group shrink-0 select-none">
              <div className="absolute inset-[-1.75rem] sm:inset-[-3rem] rounded-full border border-blue-200/60 dark:border-blue-900/40"></div>
              <div className="absolute inset-[-1.1rem] sm:inset-[-2rem] rounded-full border border-blue-200/60 dark:border-blue-900/40"></div>
              <div className="absolute inset-[-0.55rem] sm:inset-[-1rem] rounded-full border border-blue-200/70 dark:border-blue-900/40"></div>
              <div 
                onClick={handleAvatarClick}
                className={`w-32 h-32 sm:w-56 sm:h-56 rounded-full p-1.5 sm:p-2.5 bg-gradient-to-tr from-blue-700 via-blue-500 to-cyan-300 shadow-[0_18px_36px_rgba(37,99,235,0.22)] sm:shadow-[0_26px_50px_rgba(37,99,235,0.28)] relative cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-95 active:opacity-85 ${user.id === "guest" ? "cursor-not-allowed opacity-90 hover:scale-100 active:scale-100 active:opacity-90" : ""}`}
                title={user.id === "guest" ? "No disponible para invitados" : t('changePhoto')}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover border-[7px] sm:border-[10px] border-[#eef7ff] dark:border-slate-900 bg-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center border-[7px] sm:border-[10px] border-[#eef7ff] dark:border-slate-900">
                    <span className="text-4xl sm:text-6xl font-bold text-slate-500 dark:text-slate-400">
                      {getInitials(user.name)}
                    </span>
                  </div>
                )}

                {/* Uploading overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center rounded-full">
                    <Loader2 className="w-7 h-7 sm:w-9 sm:h-9 text-white animate-spin" />
                  </div>
                )}

                {/* Camera Icon Hover Overlay (only for non-guests, when not uploading) */}
                {user.id !== "guest" && !isUploading && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-full">
                    <Camera className="w-7 h-7 sm:w-9 sm:h-9 text-white drop-shadow-md" />
                  </div>
                )}
              </div>

              {/* Hidden File Input */}
              {user.id !== "guest" && (
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                />
              )}
              
              <span className="absolute bottom-2.5 right-2 sm:bottom-6 sm:right-4 w-7 h-7 sm:w-11 sm:h-11 bg-emerald-400 border-[5px] sm:border-[7px] border-white dark:border-slate-950 rounded-full shadow-lg"></span>

              {/* Small floating Camera/Pencil Button in bottom-right corner */}
              {user.id !== "guest" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAvatarClick();
                  }}
                  disabled={isUploading}
                  className="absolute bottom-1.5 left-1.5 sm:bottom-3 sm:left-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-900 hover:bg-blue-50 text-blue-600 flex items-center justify-center shadow-lg border border-blue-100 dark:border-slate-700 transition-all active:scale-90 hover:scale-110 cursor-pointer z-10"
                  title={t('changePhoto')}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="text-center md:text-left space-y-3 sm:space-y-5">
            <h3 className="font-display font-bold text-4xl sm:text-7xl text-slate-950 dark:text-white tracking-tight leading-[0.95]">
              {displayName}<span className="text-blue-600">.</span>
            </h3>
            <div className="space-y-2.5 sm:space-y-3.5">
              <p className="text-slate-950 dark:text-slate-100 text-sm sm:text-xl font-semibold flex items-center justify-center md:justify-start gap-2.5 sm:gap-4">
                <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-100/85 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
                <span className="break-all">{user.email}</span>
              </p>
              <p className="text-slate-950 dark:text-slate-100 text-sm sm:text-xl font-semibold flex items-center justify-center md:justify-start gap-2.5 sm:gap-4">
                <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-100/85 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
                <span>{user.city}, {user.country}</span>
              </p>
            </div>

            {isPremium && (
              <span className="inline-flex bg-amber-100/90 border border-amber-200 text-amber-700 font-mono text-[11px] font-bold uppercase tracking-wider py-2 px-4 rounded-full">
                {t('premiumMember')}
              </span>
            )}
          </div>
        </section>

        {/* QR Code section segment card */}
        <section className="bg-white/95 dark:bg-slate-900/95 rounded-[1.5rem] sm:rounded-[2.75rem] p-4 sm:p-8 border border-white/80 dark:border-slate-800 shadow-[0_18px_46px_rgba(37,99,235,0.1)] sm:shadow-[0_24px_70px_rgba(37,99,235,0.12)] space-y-4 sm:space-y-5">
          <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8 justify-between">

            <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-5 flex-1 text-center sm:text-left">
              <div className="w-14 h-14 sm:w-24 sm:h-24 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-[0_14px_28px_rgba(37,99,235,0.22)] sm:shadow-[0_20px_38px_rgba(37,99,235,0.28)] shrink-0">
                <QrCode className="w-7 h-7 sm:w-12 sm:h-12" />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-display font-bold text-slate-950 dark:text-white text-xl sm:text-3xl leading-tight">{t('shareProfile')}</h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-lg leading-relaxed max-w-md">
                {t('emergencyDesc')}
                </p>

                <span className="inline-flex items-center gap-2 bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{t('authorizedOnly')}</span>
                </span>
              </div>
            </div>

            {/* Visual Real Active QR Generator Container */}
            <div
              onClick={() => alert(`Contenido del código de seguridad médica:\n\n${qrTelemetryText}`)}
              className="w-36 h-36 sm:w-52 sm:h-52 border border-slate-200/80 dark:border-slate-700 p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center cursor-pointer shadow-[0_18px_34px_rgba(15,23,42,0.08)] hover:scale-[1.03] transition-transform"
              title="Presiona para ampliar detalles clínicos del QR"
            >
              <QRCode
                value={qrTelemetryText}
                size={168}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                fgColor="currentColor"
                className="text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="text-center text-xs sm:text-base text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 sm:pt-4 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
            <span>{t('qrDisclaimer')}</span>
          </div>
        </section>

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
