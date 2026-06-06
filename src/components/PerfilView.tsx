import React, { useState, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Bell, User, Shield, Key, BellRing, Heart, ChevronRight, CheckCircle, LogOut, Camera, Loader2, Mail, MapPin, QrCode, Lock, ShieldCheck, Download, X, Maximize2, Phone, Globe, Droplets, Plus, Trash2, Save, Activity } from "lucide-react";
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
  onGoToAdmin?: () => void;
}

export default function PerfilView({ user, isPremium, onGoBack, onUpdateUser, onLogout, onGoToAdmin }: PerfilViewProps) {
  const { t } = useLanguage();
  const { refreshProfile } = useAuth();
  const [activeMenuSection, setActiveMenuSection] = useState<string | null>(null);

  // Forms state for updates
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editCity, setEditCity] = useState(user.city);
  const [editCountry, setEditCountry] = useState(user.country);
  const [editPhone, setEditPhone] = useState(user.emergencyPhone || "+505 8888-9999");
  const [editBloodType, setEditBloodType] = useState(user.bloodType || "O+");
  const [editConditions, setEditConditions] = useState<string[]>(user.healthConditions);
  const [newCondition, setNewCondition] = useState("");
  const [isSavedAlertOpen, setIsSavedAlertOpen] = useState(false);
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  // Local Medical Data State
  const [localMedicalData, setLocalMedicalData] = useState(() => {
    const saved = localStorage.getItem(`medicalData_${user.id || 'guest'}`);
    return saved ? JSON.parse(saved) : {
      enfermedades: "",
      alergias: "",
      tipoSangre: "",
      tratamientos: "",
      pastillas: "",
      vacunas: "",
      peso: "",
      altura: "",
      cedula: "",
      contactoEmergencia: "",
    };
  });

  const handleUpdateMedicalData = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(`medicalData_${user.id || 'guest'}`, JSON.stringify(localMedicalData));
    setIsSavedAlertOpen(true);
    setTimeout(() => {
      setIsSavedAlertOpen(false);
      setActiveMenuSection(null);
    }, 2500);
  };

  // Notifications State (Local Storage & Supabase)
  const [notifPreference, setNotifPreference] = useState<string[]>(() => {
    const stored = localStorage.getItem("notifPreference");
    if (stored) return stored.split(",");
    return ["consejo", "recordatorio"];
  });

  const handleNotifChange = async (val: string) => {
    let newPrefs: string[];
    if (val === "ninguna") {
      newPrefs = ["ninguna"];
    } else {
      if (notifPreference.includes(val)) {
        newPrefs = notifPreference.filter(p => p !== val && p !== "ninguna");
        if (newPrefs.length === 0) newPrefs = ["ninguna"];
      } else {
        newPrefs = [...notifPreference.filter(p => p !== "ninguna"), val];
      }
    }

    setNotifPreference(newPrefs);
    const prefString = newPrefs.join(",");
    localStorage.setItem("notifPreference", prefString);
    
    // Actualizar en la base de datos si el usuario está logueado
    if (user.id && user.id !== "guest") {
      try {
        const { supabase } = await import('../lib/supabaseClient');
        await supabase
          .from('push_subscriptions')
          .update({ preferences: prefString })
          .eq('user_id', user.id);
      } catch (err) {
        console.error("Error saving preferences", err);
      }
    }
  };

  // Condition management
  const handleAddCondition = useCallback(() => {
    const trimmed = newCondition.trim();
    if (trimmed && !editConditions.includes(trimmed)) {
      setEditConditions(prev => [...prev, trimmed]);
      setNewCondition("");
    }
  }, [newCondition, editConditions]);

  const handleRemoveCondition = useCallback((index: number) => {
    setEditConditions(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Avatar upload states
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
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
  const qrRefreshWindow = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const qrTelemetryText = React.useMemo(() => {
    const qrGeneratedAt = new Date(qrRefreshWindow * 24 * 60 * 60 * 1000);
    const qrExpiresAt = new Date(qrGeneratedAt.getTime() + 24 * 60 * 60 * 1000);
    const profileUrl = typeof window !== "undefined"
      ? `${window.location.origin}/profile/${user.id || "guest"}`
      : undefined;

    return JSON.stringify({
      app: "Salud-Conecta IA",
      type: "emergency-medical-profile",
      version: 1,
      profileUrl,
      generatedAt: qrGeneratedAt.toISOString(),
      expiresAt: qrExpiresAt.toISOString(),
      patient: {
        id: user.id || "guest",
        name: displayName,
        email: user.email,
        location: `${user.city}, ${user.country}`,
        healthConditions: user.healthConditions,
        bloodType: user.bloodType || "O+",
        emergencyContact: user.emergencyPhone || "+505 8888-9999",
      },
    });
  }, [displayName, qrRefreshWindow, user]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name: editName,
      email: editEmail,
      city: editCity,
      country: editCountry,
      emergencyPhone: editPhone,
      bloodType: editBloodType,
      healthConditions: editConditions,
    });
    setIsSavedAlertOpen(true);
    setTimeout(() => {
      setIsSavedAlertOpen(false);
      setActiveMenuSection(null);
    }, 2500);
  };

  const downloadQRCode = () => {
    import("jspdf").then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      
      // Colores de la app (Paleta Profesional)
      const primaryColor = [30, 58, 138]; // slate-blue darker
      const secondaryColor = [13, 148, 136]; // text-teal-600
      const accentColor = [56, 189, 248]; // sky-400
      const slateDark = [15, 23, 42]; // text-slate-900
      const slateLight = [100, 116, 139]; // text-slate-500
      const bgPage = [255, 255, 255]; // Fondo blanco limpio
      const sectionBg = [248, 250, 252]; // Fondo muy tenue para secciones (slate-50)

      // Función para pintar el diseño base en cada página
      const drawBackground = (pageDoc: any) => {
        // Fondo blanco
        pageDoc.setFillColor(bgPage[0], bgPage[1], bgPage[2]);
        pageDoc.rect(0, 0, 210, 297, 'F');
        
        // Header (Banner principal azul oscuro)
        pageDoc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pageDoc.rect(0, 0, 210, 35, 'F');
        
        // Línea acento teal
        pageDoc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        pageDoc.rect(0, 35, 210, 2, 'F');

        // Línea decorativa lateral izquierda
        pageDoc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        pageDoc.rect(10, 45, 1.5, 240, 'F');

        // Footer
        pageDoc.setFillColor(241, 245, 249); // slate-100
        pageDoc.rect(0, 285, 210, 12, 'F');
        pageDoc.setFontSize(8);
        pageDoc.setFont("helvetica", "italic");
        pageDoc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
        pageDoc.text("Documento oficial clínico emitido por Salud-Conecta IA", 105, 292, { align: "center" });
      };

      drawBackground(doc);
      
      // Título en el Header
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Tarjeta de Emergencia Médica", 15, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 215, 255);
      doc.text("Resumen Clínico Confidencial", 15, 28);

      // --- Info del paciente (General) ---
      let yPos = 55;
      
      // Rectángulo contenedor para Información Personal
      doc.setFillColor(sectionBg[0], sectionBg[1], sectionBg[2]);
      doc.roundedRect(15, yPos - 8, 180, 40, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(15, yPos - 8, 180, 40, 3, 3, 'S');

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Información Personal", 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text("Paciente:", 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${user.name}`, 40, yPos);

      doc.setFont("helvetica", "bold");
      doc.text("Cédula:", 110, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${localMedicalData.cedula || "No registrada"}`, 130, yPos);
      yPos += 7;
      
      doc.setFont("helvetica", "bold");
      doc.text("Sangre:", 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(225, 29, 72); // rose-600 para sangre
      doc.text(`${localMedicalData.tipoSangre || editBloodType || user.bloodType || "No espec."}`, 40, yPos);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text("Contacto Emer.:", 110, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${localMedicalData.contactoEmergencia || user.emergencyPhone || "+505 8888-9999"}`, 140, yPos);
      yPos += 7;

      doc.setFont("helvetica", "bold");
      doc.text("Peso:", 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${localMedicalData.peso ? localMedicalData.peso + ' kg' : 'No reg.'}`, 40, yPos);
      
      doc.setFont("helvetica", "bold");
      doc.text("Altura:", 110, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${localMedicalData.altura ? localMedicalData.altura + ' cm' : 'No reg.'}`, 130, yPos);
      yPos += 18;

      // --- Datos Médicos Especializados ---
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("Datos Médicos Especializados", 15, yPos);
      yPos += 8;

      doc.setFontSize(10);
      
      const renderMedicalItem = (label: string, value: string) => {
        // Cuadro para el item
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(15, yPos - 5, 180, 12, 2, 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(15, yPos - 5, 180, 12, 2, 2, 'S');

        doc.setFont("helvetica", "bold");
        doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
        doc.text(`${label}:`, 20, yPos + 2);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
        
        // Manejar texto largo
        const splitText = doc.splitTextToSize(value || "Ninguno registrado", 120);
        doc.text(splitText, 60, yPos + 2);
        yPos += (splitText.length * 5) + 8;
      };

      renderMedicalItem("Enfermedades", localMedicalData.enfermedades);
      renderMedicalItem("Alergias", localMedicalData.alergias);
      renderMedicalItem("Tratamientos", localMedicalData.tratamientos);
      renderMedicalItem("Pastillas", localMedicalData.pastillas);
      renderMedicalItem("Vacunas", localMedicalData.vacunas);

      // Condiciones de salud
      if (user.healthConditions && user.healthConditions.length > 0) {
        renderMedicalItem("Otras cond.", user.healthConditions.join(", "));
      }

      // --- QR Code ---
      yPos += 5;
      if (yPos > 210) {
        doc.addPage();
        drawBackground(doc);
        yPos = 55;
      }

      // Contenedor del QR
      doc.setFillColor(sectionBg[0], sectionBg[1], sectionBg[2]);
      doc.roundedRect(15, yPos, 180, 50, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, yPos, 180, 50, 3, 3, 'S');

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Código QR de Emergencia", 85, yPos + 15);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
      doc.text("Escanea este código para ver el perfil completo.", 85, yPos + 22);
      doc.text("Acceso restringido para personal médico autorizado.", 85, yPos + 28);
      
      doc.setFontSize(8);
      doc.setTextColor(225, 29, 72); // rose
      doc.text("En caso de emergencia, contactar inmediatamente a los familiares.", 85, yPos + 38);

      const svg = qrRef.current?.querySelector("svg");
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        
        img.onload = () => {
          canvas.width = 512;
          canvas.height = 512;
          if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, 512, 512);
            ctx.drawImage(img, 0, 0, 512, 512);
          }
          const pngData = canvas.toDataURL("image/png");
          // QR dentro de su caja
          doc.addImage(pngData, 'PNG', 25, yPos + 5, 40, 40);
          
          doc.save(`Info-Emergencia-${user.name}.pdf`);
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
      } else {
        doc.save(`Info-Emergencia-${user.name}.pdf`);
      }
    }).catch(err => {
      console.error("Error cargando jsPDF", err);
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f8ff] dark:bg-slate-950 transition-colors duration-300">
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
              <img
                src="/app-logo-v1.jpg"
                alt="Logo"
                className="w-4 h-4 sm:w-6 sm:h-6 rounded shadow-sm object-cover"
              />
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

            {/* Quick info badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
              {user.emergencyPhone && (
                <span className="inline-flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700">
                  <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />
                  {user.emergencyPhone}
                </span>
              )}
              {user.bloodType && (
                <span className="inline-flex items-center gap-1.5 bg-rose-50/80 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full border border-rose-100/60 dark:border-rose-900/40 font-mono">
                  <Droplets className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  {user.bloodType}
                </span>
              )}
            </div>

            {isPremium && (
              <span className="inline-flex bg-amber-100/90 border border-amber-200 text-amber-700 font-mono text-[11px] font-bold uppercase tracking-wider py-2 px-4 rounded-full">
                {t('premiumMember')}
              </span>
            )}
          </div>
        </section>

        {/* QR Code section segment card */}
        <section className="bg-white/95 dark:bg-slate-900/95 rounded-[1.5rem] sm:rounded-[2.75rem] p-3.5 sm:p-8 border border-white/80 dark:border-slate-800 shadow-[0_18px_46px_rgba(37,99,235,0.1)] sm:shadow-[0_24px_70px_rgba(37,99,235,0.12)]">
          <div className="flex flex-row items-center gap-3 sm:gap-8 justify-between">
            {/* Lado Izquierdo: Info */}
            <div className="flex flex-col gap-2 flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2 sm:gap-5">
                <div className="w-10 h-10 sm:w-24 sm:h-24 rounded-xl sm:rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <QrCode className="w-5 h-5 sm:w-12 sm:h-12" />
                </div>
                <h4 className="font-display font-bold text-slate-950 dark:text-white text-base sm:text-3xl leading-tight truncate">
                  {t('shareProfile')}
                </h4>
              </div>
              <p className="hidden sm:block text-slate-600 dark:text-slate-300 text-sm sm:text-lg leading-relaxed max-w-md">
                {t('emergencyDesc')}
              </p>

              <div className="flex">
                <span className="inline-flex items-center gap-1.5 bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] sm:text-sm px-2.5 py-1.5 rounded-xl font-bold">
                  <Lock className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  <span>{t('authorizedOnly')}</span>
                </span>
              </div>
            </div>

            {/* Lado Derecho: QR más pequeño y lateral */}
            <div className="flex flex-col items-center gap-2 sm:gap-5 shrink-0">
              <div
                ref={qrRef}
                className="w-24 h-24 sm:w-64 sm:h-64 border-2 sm:border-4 border-blue-200 dark:border-blue-800 p-2 sm:p-6 bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-md"
              >
                <QRCodeSVG
                  value={qrTelemetryText}
                  size={200}
                  level="H"
                  includeMargin={true}
                  className="w-full h-full text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowQRModal(true)}
                  className="p-2 sm:px-5 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg sm:rounded-xl font-bold transition-all active:scale-95 shadow-sm"
                >
                  <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={downloadQRCode}
                  className="p-2 sm:px-5 sm:py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg sm:rounded-xl font-bold transition-all active:scale-95 shadow-sm"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] sm:text-base text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 mt-3.5 pt-3 sm:pt-4 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
            <span>{t('qrDisclaimer')}</span>
          </div>
        </section>

        {/* ACCOUNT MANAGE LIST SEGMENT */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('accountManagement')}</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
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
                id: "datos_medicos",
                title: "Datos Médicos",
                subtitle: "Información clínica especializada",
                icon: Activity,
                color: "text-teal-600 bg-teal-50 border border-teal-100",
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
                            <form onSubmit={handleUpdateProfile} className="space-y-4 text-left">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                                    <User className="w-3 h-3" /> {t('patientName')}
                                  </label>
                                  <input
                                    id="input-edit-username"
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-xs font-semibold transition-all"
                                    required
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <Mail className="w-3 h-3" /> {t('secureEmail')}
                                  </label>
                                  <input
                                    id="input-edit-useremail"
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-xs font-mono font-semibold transition-all"
                                    required
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3" /> {t('residence')}
                                  </label>
                                  <input
                                    id="input-edit-usercity"
                                    type="text"
                                    value={editCity}
                                    onChange={(e) => setEditCity(e.target.value)}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-xs font-semibold transition-all"
                                    required
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <Globe className="w-3 h-3" /> País
                                  </label>
                                  <input
                                    type="text"
                                    value={editCountry}
                                    onChange={(e) => setEditCountry(e.target.value)}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-xs font-semibold transition-all"
                                    required
                                  />
                                </div>
                                <div className="space-y-1.5 lg:col-span-2">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <Phone className="w-3 h-3" /> {t('emergencyPhone')}
                                  </label>
                                  <input
                                    type="tel"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-xs font-semibold transition-all"
                                    placeholder="+505 0000-0000"
                                  />
                                </div>
                              </div>

                              <button
                                id="btn-save-personal-info"
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-2.5 px-5 rounded-xl border-none outline-none text-xs transition-all tracking-wide flex items-center justify-center gap-2 shadow-sm"
                              >
                                <Save className="w-3.5 h-3.5" />
                                {t('saveProfileChanges' as any)}
                              </button>
                            </form>
                          )}

                          {/* Nested secure privacy content panel */}
                          {item.id === "seguridad" && (
                            <div className="space-y-3 text-left">
                              <p className="text-slate-500 dark:text-slate-400 leading-normal text-[13px]">
                                Configuración de seguridad y acceso a la cuenta.
                              </p>
                              <div className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center p-2">
                                    <svg viewBox="0 0 24 24" className="w-full h-full">
                                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Cuenta de Google</h4>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Has iniciado sesión con tu cuenta de Google</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Nested alert notifications checker options */}
                          {item.id === "notificaciones" && (
                            <div className="space-y-2.5 text-left">
                              <p className="text-[11px] text-slate-500 mb-2">Selecciona qué tipo de notificaciones deseas recibir:</p>
                              {[
                                { value: "consejo", label: "Consejo del día", desc: "Tips diarios para mejorar tu salud" },
                                { value: "recordatorio", label: "Recordatorios", desc: "Avisos sobre tu estado de salud y citas" },
                                { value: "ninguna", label: "Silenciar ambas", desc: "No recibir notificaciones push" },
                              ].map((opt) => {
                                const isSelected = notifPreference.includes(opt.value);
                                return (
                                  <div
                                    key={opt.value}
                                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                                      isSelected 
                                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    }`}
                                    onClick={() => handleNotifChange(opt.value)}
                                  >
                                    <div className="flex-1 min-w-0 mr-3">
                                      <span className={`font-semibold text-xs block ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                        {opt.label}
                                      </span>
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">{opt.desc}</span>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'
                                    }`}>
                                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Nested Datos Medicos Form */}
                          {item.id === "datos_medicos" && (
                            <form onSubmit={handleUpdateMedicalData} className="space-y-4 text-left">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Enfermedades que padece
                                  </label>
                                  <input
                                    type="text"
                                    value={localMedicalData.enfermedades}
                                    onChange={(e) => setLocalMedicalData({...localMedicalData, enfermedades: e.target.value})}
                                    placeholder="Ej: Diabetes, Hipertensión"
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Alergias
                                  </label>
                                  <input
                                    type="text"
                                    value={localMedicalData.alergias}
                                    onChange={(e) => setLocalMedicalData({...localMedicalData, alergias: e.target.value})}
                                    placeholder="Ej: Penicilina, Nueces"
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Tipo de Sangre
                                  </label>
                                  <select
                                    value={localMedicalData.tipoSangre}
                                    onChange={(e) => setLocalMedicalData({...localMedicalData, tipoSangre: e.target.value})}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  >
                                    <option value="">Seleccione...</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                  </select>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Tratamientos actuales
                                  </label>
                                  <input
                                    type="text"
                                    value={localMedicalData.tratamientos}
                                    onChange={(e) => setLocalMedicalData({...localMedicalData, tratamientos: e.target.value})}
                                    placeholder="Ej: Fisioterapia"
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Pastillas que toma
                                  </label>
                                  <input
                                    type="text"
                                    value={localMedicalData.pastillas}
                                    onChange={(e) => setLocalMedicalData({...localMedicalData, pastillas: e.target.value})}
                                    placeholder="Ej: Losartán 50mg"
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Vacunas aplicadas
                                  </label>
                                  <input
                                    type="text"
                                    value={localMedicalData.vacunas}
                                    onChange={(e) => setLocalMedicalData({...localMedicalData, vacunas: e.target.value})}
                                    placeholder="Ej: COVID-19, Tétanos"
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Peso (kg)
                                  </label>
                                  <input
                                    type="number"
                                    value={localMedicalData.peso}
                                    onChange={(e) => setLocalMedicalData({...localMedicalData, peso: e.target.value})}
                                    placeholder="Ej: 70"
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Altura (cm)
                                  </label>
                                  <input
                                    type="number"
                                    value={localMedicalData.altura}
                                    onChange={(e) => setLocalMedicalData({...localMedicalData, altura: e.target.value})}
                                    placeholder="Ej: 175"
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Cédula de Identidad
                                  </label>
                                  <input
                                    type="text"
                                    value={localMedicalData.cedula}
                                    onChange={(e) => setLocalMedicalData({...localMedicalData, cedula: e.target.value})}
                                    placeholder="000-000000-0000A"
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Contacto de Emergencia
                                  </label>
                                  <input
                                    type="tel"
                                    value={localMedicalData.contactoEmergencia}
                                    onChange={(e) => setLocalMedicalData({...localMedicalData, contactoEmergencia: e.target.value})}
                                    placeholder="+505 0000-0000"
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                className="w-full bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold py-2.5 px-5 rounded-xl border-none outline-none text-xs transition-all tracking-wide flex items-center justify-center gap-2 shadow-sm"
                              >
                                <Save className="w-3.5 h-3.5" />
                                Guardar Datos Médicos
                              </button>
                            </form>
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

        {/* Admin Panel Button */}
        {onGoToAdmin && (
          <button
            onClick={onGoToAdmin}
            className="w-full mt-4 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200/85 dark:border-blue-900/30 rounded-2xl py-3.5 px-5 font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Shield className="w-4.5 h-4.5 text-blue-500 shrink-0" />
            <span>{t('adminPanel')}</span>
          </button>
        )}

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

      {/* Floating Save Success Toast */}
      <AnimatePresence>
        {isSavedAlertOpen && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-emerald-500 text-white px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-[0_10px_40px_rgba(16,185,129,0.35)]"
          >
            <CheckCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{t('saveSuccess')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Modal - Fullscreen View */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-2xl sm:text-3xl text-slate-950 dark:text-white">
                  {t('shareProfile')}
                </h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex flex-col items-center space-y-6">
                {/* Large QR Code */}
                <div
                  ref={qrRef}
                  className="w-72 h-72 sm:w-96 sm:h-96 border-4 border-blue-300 dark:border-blue-700 p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-lg"
                >
                  <QRCodeSVG
                    value={qrTelemetryText}
                    size={320}
                    level="H"
                    className="w-full h-full text-slate-900 dark:text-white"
                  />
                </div>

                {/* QR Info */}
                <div className="w-full space-y-3 text-center">
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {t('emergencyDesc')}
                  </p>
                  <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-3 py-2 rounded-xl font-bold">
                    <Lock className="w-4 h-4" />
                    <span>{t('authorizedOnly')}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 w-full pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={downloadQRCode}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-md"
                  >
                    <Download className="w-5 h-5" />
                    <span>{t('download') || 'Descargar'}</span>
                  </button>
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-2xl font-bold text-sm transition-all active:scale-95"
                  >
                    <span>{t('close') || 'Cerrar'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
