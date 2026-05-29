import React, { useState } from "react";
import QRCode from "react-qr-code";
import { ArrowLeft, Bell, Settings, User, Shield, AlertTriangle, Key, BellRing, Heart, ChevronRight, BadgeCheck, Check, Clipboard, CheckCircle, LogOut } from "lucide-react";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface PerfilViewProps {
  user: UserProfile;
  isPremium: boolean;
  onGoBack: () => void;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout?: () => void;
}

export default function PerfilView({ user, isPremium, onGoBack, onUpdateUser, onLogout }: PerfilViewProps) {
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
    <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-b from-[#f5f8ff] to-[#f8fafc]">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white/70 backdrop-blur-md sticky top-0 z-30 border-b border-blue-50/50">
        <button
          id="btn-profile-go-back"
          onClick={onGoBack}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100 active:scale-95 flex items-center"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h2 className="font-display font-bold text-lg text-slate-800 flex items-center">
          Mi perfil
          <span className="ml-1 px-2 py-0.5 bg-blue-100 rounded-full text-blue-700 text-[10px] uppercase font-bold flex items-center space-x-0.5">
            <BadgeCheck className="w-3 h-3 text-blue-600 inline shrink-0" />
            <span>Verificado</span>
          </span>
        </h2>

        {/* Bells with alert badge */}
        <button
          id="btn-profile-bell"
          onClick={() => {
            alert("No tienes alertas críticas pendientes. Su historial clínico de triaje virtual se encuentra en perfecto orden.");
            setShowNotificationBadge(false);
          }}
          className="p-2 -mr-2 text-slate-600 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100 relative active:scale-95"
        >
          <Bell className="w-6 h-6" />
          {showNotificationBadge && (
            <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-bounce"></span>
          )}
        </button>
      </header>

      {/* Main Container */}
      <main className="px-6 pt-6 flex-1 space-y-6 max-w-4xl mx-auto w-full">
        
        {/* Profile Card Header segment */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100/90 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>

          {/* Avatar Picture with verified ring */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full p-1.5 bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-md">
              <img 
                src={user.avatarUrl} 
                alt={user.name} 
                className="w-full h-full rounded-full object-cover border-4 border-white"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full shadow-inner animate-pulse"></span>
          </div>

          <div className="text-center sm:text-left space-y-1.5">
            <h3 className="font-display font-medium text-2.5xl text-slate-900 tracking-tight leading-none flex items-center justify-center sm:justify-start">
              {user.name}.
            </h3>
            <p className="text-slate-400 text-xs font-medium font-mono">{user.email}</p>
            <p className="text-slate-500 text-xs font-semibold flex items-center justify-center sm:justify-start space-x-1">
              <span className="text-blue-500 text-sm">📍</span>
              <span>{user.city}, {user.country}</span>
            </p>

            {isPremium && (
              <span className="inline-block bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-250/30 text-yellow-600/90 font-mono text-[9px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full mt-2">
                🏆 Miembro Premium Activo
              </span>
            )}
          </div>
        </div>

        {/* QR Code section segment card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-5 justify-between">
            
            <div className="flex-1 text-center sm:text-left space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-blue-500 flex items-center justify-center sm:justify-start gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Tarjeta de Emergencia GPS</span>
              </span>
              <h4 className="font-display font-bold text-slate-900 text-base">Comparte tu perfil médico</h4>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Escanea este código en caso de emergencia para acceder a mi información de salud de vital importancia.
                Se puede utilizar para primeros auxilios avanzados de Cruz Roja.
              </p>

              <div className="pt-2 flex justify-center sm:justify-start">
                <span className="inline-flex items-center space-x-1 bg-blue-50 text-blue-700 text-[10px] px-3 py-1.5 rounded-full font-bold border border-blue-100">
                  <span className="text-sm">🔒</span>
                  <span>Sólo personal autorizado</span>
                </span>
              </div>
            </div>

            {/* Visual Real Active QR Generator Container */}
            <div 
              onClick={() => alert(`Contenido del código de seguridad médica:\n\n${qrTelemetryText}`)}
              className="w-36 h-36 border border-slate-200/80 p-3.5 bg-slate-50 rounded-2xl flex items-center justify-center cursor-pointer shadow-inner animate-pulse duration-300 hover:scale-105 transition-transform"
              title="Presiona para ampliar detalles clínicos del QR"
            >
              <QRCode
                value={qrTelemetryText}
                size={112}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                fgColor="#0f172a"
              />
            </div>
          </div>

          <div className="text-center sm:text-left text-[10px] text-slate-400 border-t border-slate-50 pt-2.5">
            ⌛ El código se actualiza dinámicamente cada 24 horas para garantizar la protección de su identidad.
          </div>
        </div>

        {/* ACCOUNT MANAGE LIST SEGMENT */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gestión de cuenta</h4>
          
          {/* Menu Option items collapsible blocks */}
          {[
            {
              id: "personal",
              title: "Información personal",
              subtitle: "Nombre, correo y teléfono",
              icon: User,
              color: "text-blue-600 bg-blue-50 border border-blue-100",
            },
            {
              id: "seguridad",
              title: "Seguridad y privacidad",
              subtitle: "Contraseña, verificación y datos",
              icon: Key,
              color: "text-emerald-600 bg-emerald-50 border border-emerald-100",
            },
            {
              id: "notificaciones",
              title: "Notificaciones",
              subtitle: "Preferencias de alertas",
              icon: BellRing,
              color: "text-purple-600 bg-purple-50 border border-purple-100",
            },
            {
              id: "preferencias",
              title: "Preferencias de salud",
              subtitle: "Temas y condiciones de interés",
              icon: Heart,
              color: "text-rose-600 bg-rose-50 border border-rose-100",
            },
          ].map((item) => {
            const Icon = item.icon;
            const isOpen = activeMenuSection === item.id;
            
            return (
              <div key={item.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <button
                  id={`btn-profile-menu-${item.id}`}
                  onClick={() => setActiveMenuSection(isOpen ? null : item.id)}
                  className="w-full p-4.5 text-left flex items-center justify-between hover:bg-slate-50/50 transition-colors outline-none"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-800">{item.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
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
                      className="border-t border-slate-50 bg-slate-50/40"
                    >
                      <div className="p-5 text-xs text-slate-600 space-y-4">
                        
                        {/* Nested Personal info update Form */}
                        {item.id === "personal" && (
                          <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-left">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Nombre paciente</label>
                                <input
                                  id="input-edit-username"
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full text-slate-800 bg-white py-2 px-3.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-blue-500 text-xs font-semibold"
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Correo seguro</label>
                                <input
                                  id="input-edit-useremail"
                                  type="email"
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  className="w-full text-slate-800 bg-white py-2 px-3.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-blue-500 text-xs font-mono font-semibold"
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Municipio de Residencia</label>
                                <input
                                  id="input-edit-usercity"
                                  type="text"
                                  value={editCity}
                                  onChange={(e) => setEditCity(e.target.value)}
                                  className="w-full text-slate-800 bg-white py-2 px-3.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-blue-500 text-xs font-semibold"
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Celular de Emergencia</label>
                                <input
                                  type="text"
                                  defaultValue="+505 8888-9999"
                                  className="w-full text-slate-800 bg-white py-2 px-3.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-blue-500 text-xs font-semibold"
                                  disabled
                                />
                              </div>
                            </div>

                            <button
                              id="btn-save-personal-info"
                              type="submit"
                              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2 px-5 rounded-xl border-none outline-none text-xs transition-all tracking-wide"
                            >
                              Guardar cambios del perfil
                            </button>
                          </form>
                        )}

                        {/* Nested secure privacy content panel */}
                        {item.id === "seguridad" && (
                          <div className="space-y-3.5 text-left">
                            <p className="text-slate-500 leading-normal">
                              Su cuenta tecnológica utiliza encriptación de extremo a extremo para las consultas médicas de triaje.
                              También puede habilitar el desbloqueo mediante Biometría Facial (FaceID) o PIN del celular.
                            </p>
                            <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100">
                              <span className="font-semibold text-slate-700">Autenticación biométrica móvil</span>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold">Inactivo (Por defecto)</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100">
                              <span className="font-semibold text-slate-700">Encriptación de Triage Clínico</span>
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold">Activo (AES-256)</span>
                            </div>
                          </div>
                        )}

                        {/* Nested alert notifications checker options */}
                        {item.id === "notificaciones" && (
                          <div className="space-y-3 text-left">
                            <label className="flex items-center space-x-3 cursor-pointer p-1 bg-white rounded-xl border border-slate-100">
                              <input type="checkbox" defaultChecked className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-0 cursor-pointer ml-2" />
                              <span className="font-semibold text-slate-700">Alertas de vacunas estacionales en Granada</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer p-1 bg-white rounded-xl border border-slate-100">
                              <input type="checkbox" defaultChecked className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-0 cursor-pointer ml-2" />
                              <span className="font-semibold text-slate-700">Recordatorios de citas agendadas por SMS</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer p-1 bg-white rounded-xl border border-slate-100">
                              <input type="checkbox" className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-0 cursor-pointer ml-2" />
                              <span className="font-semibold text-slate-700">Emails informativos sobre bienestar público</span>
                            </label>
                          </div>
                        )}

                        {/* Nested Allergologies condition list */}
                        {item.id === "preferencias" && (
                          <div className="space-y-4 text-left">
                            <div>
                              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Condiciones críticas registradas</span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {user.healthConditions.map((cond, i) => (
                                  <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-[10px] border border-blue-100 flex items-center space-x-1">
                                    <span>⚕️</span>
                                    <span>{cond}</span>
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="p-3 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-800">Tipo de sangre</span>
                                <p className="text-[10px] text-slate-400 mt-0.5">Necesario para emergencias de primeros auxilios</p>
                              </div>
                              <span className="text-sm font-bold bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full font-mono border border-rose-100">O positivo (O+)</span>
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
              <span>¡La información de Kenneth se guardó con éxito en el perfil local!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Protection standard banner at end */}
        <div className="bg-slate-100/50 rounded-2xl p-4.5 border border-slate-200/50 flex items-center space-x-3.5 mt-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-semibold text-slate-800">
              Tu información está protegida.
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
              Cumplimos con los más altos estándares de privacidad y seguridad médica de acuerdo con las normativas GDPR y HIPAA.
            </p>
          </div>
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            id="btn-profile-logout"
            onClick={() => {
              if (window.confirm("¿Estás seguro de que deseas cerrar la sesión?")) {
                onLogout();
              }
            }}
            className="w-full mt-5 bg-red-50 hover:bg-red-100/80 text-red-600 border border-red-200/85 rounded-2xl py-3.5 px-5 font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5 text-red-500 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        )}

      </main>
    </div>
  );
}
