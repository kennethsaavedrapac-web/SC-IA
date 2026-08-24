import React, { useState, useRef, useCallback, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Bell, User, Shield, Key, BellRing, Heart, ChevronRight, CheckCircle, LogOut, Camera, Loader2, Mail, MapPin, QrCode, Lock, ShieldCheck, Download, X, Maximize2, Phone, Globe, Droplets, Plus, Trash2, Save, Activity, Cloud, CloudOff, AlertTriangle, Clock, Megaphone, Calendar, Star } from "lucide-react";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import { uploadAvatar } from "../lib/avatarService";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { sanitizeAndTrim, validateEmail, validateName, validatePhone } from "../lib/security";
import TwoFactorSetup from "./TwoFactorSetup";
import { saveMedicalData, loadMedicalData, getEmptyMedicalForm, type MedicalFormData } from "../lib/fhirService";
import { getTodaysNotificationHistory, markTodaysNotificationsRead, type AppNotificationRecord } from "../lib/notificationService";
import MfaEnrollmentModal from "./MfaEnrollmentModal";
import { createToast, type ToastData } from "./Toast";

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


  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editCity, setEditCity] = useState(user.city);
  const [editCountry, setEditCountry] = useState(user.country);
  const [editPhone, setEditPhone] = useState(user.emergencyPhone || "+505 8888-9999");
  const [editSex, setEditSex] = useState(user.sex || "");
  const [editBirthDate, setEditBirthDate] = useState(user.birthDate || "");
  const [editBloodType, setEditBloodType] = useState(user.bloodType || "O+");
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [editConditions, setEditConditions] = useState<string[]>(user.healthConditions);
  const [newCondition, setNewCondition] = useState("");
  const [isSavedAlertOpen, setIsSavedAlertOpen] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<AppNotificationRecord[]>([]);
  const [isNotificationInboxOpen, setIsNotificationInboxOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showMfaEnrollment, setShowMfaEnrollment] = useState(false);
  const { profile } = useAuth();

  // Medical Data State (FHIR-backed)
  const [localMedicalData, setLocalMedicalData] = useState<MedicalFormData>(() => {
    // Initial load from localStorage as immediate cache
    try {
      const saved = localStorage.getItem(`medicalData_${user.id || 'guest'}`);
      return saved ? JSON.parse(saved) : getEmptyMedicalForm();
    } catch {
      return getEmptyMedicalForm();
    }
  });
  const [isSavingMedical, setIsSavingMedical] = useState(false);
  const [medicalSyncSource, setMedicalSyncSource] = useState<"fhir" | "localStorage" | "none">("none");
  const [medicalSaveError, setMedicalSaveError] = useState<string | null>(null);

  // Load medical data from FHIR on mount (if cédula available)
  useEffect(() => {
    const loadFromFhir = async () => {
      const cedula = localMedicalData.cedula;
      if (!cedula || cedula.trim().length < 3) return;

      try {
        const result = await loadMedicalData(cedula, user.id || 'guest');
        if (result.found && result.data) {
          setLocalMedicalData(result.data);
          setMedicalSyncSource(result.source);
        }
      } catch (err) {
        console.warn("Failed to load FHIR data on mount:", err);
      }
    };

    loadFromFhir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateMedicalData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMedical(true);
    setMedicalSaveError(null);

    try {
      const result = await saveMedicalData(
        localMedicalData,
        user.id || 'guest',
        {
          nombre: user.name,
          email: user.email,
          ciudad: user.city,
          pais: user.country,
        }
      );

      setMedicalSyncSource(result.source);

      if (result.source === "fhir") {
        setIsSavedAlertOpen(true);
        setTimeout(() => {
          setIsSavedAlertOpen(false);
          setActiveMenuSection(null);
        }, 2500);
      } else {
        // Saved to localStorage (fallback)
        setMedicalSaveError(result.message);
        setIsSavedAlertOpen(true);
        setTimeout(() => {
          setIsSavedAlertOpen(false);
          setMedicalSaveError(null);
        }, 4000);
      }
    } catch (err: any) {
      console.error("Medical data save error:", err);
      setMedicalSaveError("Error inesperado al guardar datos médicos.");
      // Still show alert since localStorage fallback in the service saved the data
      setIsSavedAlertOpen(true);
      setTimeout(() => {
        setIsSavedAlertOpen(false);
        setMedicalSaveError(null);
      }, 4000);
    } finally {
      setIsSavingMedical(false);
    }
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


    if (user.id && user.id !== "guest") {
      try {
        await supabase
          .from('push_subscriptions')
          .update({ preferences: prefString })
          .eq('user_id', user.id);
      } catch (err) {
        console.error("Error saving preferences", err);
      }
    }
  };

  const refreshNotificationHistory = useCallback(() => {
    setNotificationHistory(getTodaysNotificationHistory(user.id || 'guest'));
  }, [user.id]);

  useEffect(() => {
    refreshNotificationHistory();
    window.addEventListener("salud-notifications-updated", refreshNotificationHistory);
    return () => {
      window.removeEventListener("salud-notifications-updated", refreshNotificationHistory);
    };
  }, [refreshNotificationHistory]);

  const unreadNotifications = notificationHistory.filter((notification) => !notification.read).length;

  const handleOpenNotifications = () => {
    refreshNotificationHistory();
    setIsNotificationInboxOpen(true);
  };

  const handleMarkNotificationsRead = () => {
    const updatedHistory = markTodaysNotificationsRead(user.id || 'guest');
    setNotificationHistory(
      updatedHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  };

  const formatNotificationTime = (value: string) => {
    try {
      return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--:--";
    }
  };

  const getNotificationTypeLabel = (notification: AppNotificationRecord) => {
    if (notification.source !== "announcement") return t('notifications');
    if (notification.category === "alert") return t('announcementType_alert' as any);
    if (notification.category === "promotion") return t('announcementType_promotion' as any);
    return t('announcementType_banner' as any);
  };

  const getNotificationTone = (notification: AppNotificationRecord) => {
    if (notification.source !== "announcement") {
      return "bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-300";
    }
    if (notification.category === "alert") {
      return "bg-rose-50 dark:bg-rose-900/25 border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-300";
    }
    if (notification.category === "promotion") {
      return "bg-amber-50 dark:bg-amber-900/25 border-amber-100 dark:border-amber-800 text-amber-600 dark:text-amber-300";
    }
    return "bg-indigo-50 dark:bg-indigo-900/25 border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300";
  };


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
      alert(t('guestAvatarAlert'));
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
        alert(result.error || t('avatarUploadError'));
      }
    } catch (err) {
      console.error("Error upload avatar:", err);
      alert(t('avatarUnexpectedError'));
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

    // Validate inputs before saving
    const nameValidation = validateName(editName);
    if (!nameValidation.valid) {
      alert(nameValidation.error === 'tooShort' ? t('nameMin') : t('nameRequired'));
      return;
    }
    if (!validateEmail(editEmail)) {
      alert(t('emailInvalid'));
      return;
    }
    if (editPhone && !validatePhone(editPhone)) {
      alert(t('phoneInvalid'));
      return;
    }

    // Sanitize inputs before saving
    onUpdateUser({
      ...user,
      name: sanitizeAndTrim(editName),
      email: editEmail.trim(),
      city: sanitizeAndTrim(editCity),
      country: sanitizeAndTrim(editCountry),
      emergencyPhone: editPhone.trim(),
      bloodType: editBloodType,
      healthConditions: editConditions.map(c => sanitizeAndTrim(c)),
      sex: editSex,
      birthDate: editBirthDate,
    });
    
    // Also save medical data to persist cedula if changed from personal form
    saveMedicalData(localMedicalData, user.id || 'guest', {
      nombre: sanitizeAndTrim(editName),
      email: editEmail.trim(),
      ciudad: sanitizeAndTrim(editCity),
      pais: sanitizeAndTrim(editCountry),
    }).then((result) => {
      setMedicalSyncSource(result.source);
    }).catch(console.error);

    setIsSavedAlertOpen(true);
    setTimeout(() => {
      setIsSavedAlertOpen(false);
      setActiveMenuSection(null);
    }, 2500);
  };

  const downloadQRCode = () => {
    Promise.all([
      import("jspdf"),
      import("html-to-image")
    ]).then(async ([{ default: jsPDF }, htmlToImage]) => {
      try {
        const frontEl = document.getElementById("card-front-face");
        const backEl = document.getElementById("card-back-face");
        if (!frontEl || !backEl) {
          alert("Error: No se encontraron los elementos de la tarjeta en la pantalla.");
          return;
        }

        // Crear un overlay oscuro de carga
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
        overlay.style.zIndex = "999998";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        
        const loaderText = document.createElement("h2");
        loaderText.innerText = "Generando documento...";
        loaderText.style.color = "#1e3a8a";
        loaderText.style.fontFamily = "system-ui, sans-serif";
        loaderText.style.fontSize = "24px";
        loaderText.style.fontWeight = "bold";
        loaderText.style.marginBottom = "30px";
        overlay.appendChild(loaderText);
        document.body.appendChild(overlay);

        // Crear contenedor temporal 100% visible pero sobre el overlay
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "fixed";
        tempContainer.style.top = "50%";
        tempContainer.style.left = "50%";
        tempContainer.style.transform = "translate(-50%, -50%) scale(0.6)";
        tempContainer.style.zIndex = "999999";
        tempContainer.style.width = "840px";
        tempContainer.style.display = "flex";
        tempContainer.style.flexDirection = "column";
        tempContainer.style.gap = "40px";
        tempContainer.style.backgroundColor = "transparent";
        tempContainer.style.padding = "20px";
        
        // Clonar nodos
        const frontClone = frontEl.cloneNode(true) as HTMLElement;
        const backClone = backEl.cloneNode(true) as HTMLElement;
        
        // Quitar estilos 3D
        frontClone.style.backfaceVisibility = "visible";
        frontClone.style.transform = "none";
        frontClone.style.position = "relative";
        frontClone.style.inset = "auto";
        frontClone.style.width = "800px";
        frontClone.style.height = "504px";
        
        backClone.style.backfaceVisibility = "visible";
        backClone.style.transform = "none";
        backClone.style.position = "relative";
        backClone.style.inset = "auto";
        backClone.style.width = "800px";
        backClone.style.height = "504px";

        tempContainer.appendChild(frontClone);
        tempContainer.appendChild(backClone);
        document.body.appendChild(tempContainer);

        // Renderizar con html-to-image (soporta oklch nativamente via SVG)
        // Damos un timeout pequeñito para asegurar que los clones se montaron y cargaron imgs
        await new Promise(r => setTimeout(r, 200));

        const imgData = await htmlToImage.toPng(tempContainer, {
          pixelRatio: 2,
          backgroundColor: "rgba(255,255,255,1)",
          cacheBust: true,
        });

        // Limpieza de UI
        document.body.removeChild(tempContainer);
        document.body.removeChild(overlay);
        
        // Obtener dimensiones reales de la imagen
        const img = new Image();
        img.src = imgData;
        await new Promise((resolve) => { img.onload = resolve; });
        
        // Crear PDF
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const marginX = 10;
        const printWidth = pdfWidth - (marginX * 2);
        const printHeight = (img.height * printWidth) / img.width;

        pdf.addImage(imgData, "PNG", marginX, 15, printWidth, printHeight);
        pdf.save(`Documento-Emergencia-${user.name || "perfil"}.pdf`);
      } catch (err) {
        console.error("Error generando PDF", err);
        alert("Ocurrió un error al generar el PDF: " + (err as Error).message);
        
        // Limpieza de emergencia
        const temp = document.body.lastChild as HTMLElement;
        if (temp) document.body.removeChild(temp);
      }
    }).catch(err => {
      console.error("Error cargando módulos PDF", err);
      alert("Error cargando los módulos necesarios para generar el PDF.");
    });
  };

  // ═══════════════════════════════════════════════════════════
  //  Helper functions for converting DOM elements/URLs to PNG
  // ═══════════════════════════════════════════════════════════

  const toDataUrl = (src?: string): Promise<string | null> => new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 512;
      canvas.height = img.naturalHeight || 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

  const qrToDataUrl = (qrElement: HTMLDivElement | null): Promise<string | null> => new Promise((resolve) => {
    const svg = qrElement?.querySelector("svg");
    if (!svg) {
      resolve(null);
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  });

  return (
    <div className="flex flex-col min-h-dvh transition-colors duration-300 relative overflow-hidden">

      { }
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
              <span>Salud-Conecta <span className="text-brand-600">IA</span></span>
            </span>
          </div>

          <button
            id="btn-profile-bell"
            onClick={handleOpenNotifications}
            className="w-12 h-12 sm:w-20 sm:h-20 bg-white/95 dark:bg-slate-900/90 text-slate-950 dark:text-white rounded-full shadow-[0_18px_40px_rgba(37,99,235,0.12)] flex items-center justify-center relative hover:scale-105 active:scale-95 transition-all"
            title={t('notifications')}
          >
            <Bell className="w-6 h-6 sm:w-8 sm:h-8" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 min-w-5 h-5 px-1 bg-blue-600 text-white border-[3px] border-white dark:border-slate-900 rounded-full text-[9px] font-black flex items-center justify-center leading-none">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </header>

      { }
      <main className="relative z-10 px-4 sm:px-8 pt-4 sm:pt-8 flex-1 space-y-5 sm:space-y-7 max-w-5xl mx-auto w-full">

        { }
        <section className="grid grid-cols-1 md:grid-cols-[minmax(220px,0.9fr)_minmax(280px,1.1fr)] items-center gap-5 sm:gap-8 md:gap-12 md:min-h-[330px]">

          { }
          <div className="flex justify-center md:justify-end">
            <div className="relative group shrink-0 select-none">
              <div className="absolute inset-[-1.75rem] sm:inset-[-3rem] rounded-full border border-brand-200/60 dark:border-brand-900/40"></div>
              <div className="absolute inset-[-1.1rem] sm:inset-[-2rem] rounded-full border border-brand-200/60 dark:border-brand-900/40"></div>
              <div className="absolute inset-[-0.55rem] sm:inset-[-1rem] rounded-full border border-brand-200/70 dark:border-brand-900/40"></div>
              <div
                onClick={handleAvatarClick}
                className={`w-32 h-32 sm:w-56 sm:h-56 rounded-full p-1.5 sm:p-2.5 bg-gradient-to-tr from-brand-900 via-brand-600 to-cyan-300 shadow-[0_18px_36px_rgba(37,99,235,0.22)] sm:shadow-[0_26px_50px_rgba(37,99,235,0.28)] relative cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-95 active:opacity-85 ${user.id === "guest" ? "cursor-not-allowed opacity-90 hover:scale-100 active:scale-100 active:opacity-90" : ""}`}
                title={user.id === "guest" ? t('guestAvatarTitle') : t('changePhoto')}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover border-[7px] sm:border-[10px] border-emerald-500 dark:border-emerald-400 bg-slate-200 ring-4 ring-emerald-500/30"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center border-[7px] sm:border-[10px] border-emerald-500 dark:border-emerald-400 ring-4 ring-emerald-500/30">
                    <span className="text-4xl sm:text-6xl font-bold text-slate-500 dark:text-slate-400">
                      {getInitials(user.name)}
                    </span>
                  </div>
                )}

                { }
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center rounded-full">
                    <Loader2 className="w-7 h-7 sm:w-9 sm:h-9 text-white animate-spin" />
                  </div>
                )}

                { }
                {user.id !== "guest" && !isUploading && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-full">
                    <Camera className="w-7 h-7 sm:w-9 sm:h-9 text-white drop-shadow-md" />
                  </div>
                )}
              </div>

              { }
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

              { }
              {user.id !== "guest" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAvatarClick();
                  }}
                  disabled={isUploading}
                  className="absolute bottom-1.5 left-1.5 sm:bottom-3 sm:left-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-900 hover:bg-brand-50 text-brand-600 flex items-center justify-center shadow-lg border border-brand-100 dark:border-slate-700 transition-all active:scale-90 hover:scale-110 cursor-pointer z-10"
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
            <h3 className="font-display font-bold text-4xl sm:text-7xl text-slate-950 dark:text-white tracking-tight leading-[0.95] break-words">
              {displayName}<span className="text-brand-600">.</span>
            </h3>
            <div className="space-y-2.5 sm:space-y-3.5">
              <p className="text-slate-950 dark:text-slate-100 text-sm sm:text-xl font-semibold flex items-center justify-center md:justify-start gap-2.5 sm:gap-4">
                <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-brand-100/85 dark:bg-brand-900/40 text-brand-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
                <span className="break-all">{user.email}</span>
              </p>
              <p className="text-slate-950 dark:text-slate-100 text-sm sm:text-xl font-semibold flex items-center justify-center md:justify-start gap-2.5 sm:gap-4">
                <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-brand-100/85 dark:bg-brand-900/40 text-brand-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
                <span>{user.city}, {user.country}</span>
              </p>
            </div>

            { }
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
              {user.emergencyPhone && (
                <span className="inline-flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700">
                  <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-400" />
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

        {/* Documento de Emergencia - Flip Card */}
        <section className="mb-8 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4 px-2">
            <h4 className="font-display font-bold text-slate-950 dark:text-white text-xl sm:text-2xl">
              Documento de Emergencia
            </h4>
            <button
              onClick={downloadQRCode}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PDF</span>
            </button>
          </div>

          {/* Contenedor Flip 3D */}
          <div className="group w-full max-w-[800px] aspect-[1.35/1] sm:aspect-[1.586/1] [perspective:1500px]">
            <div 
              className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] cursor-pointer md:group-hover:[transform:rotateY(180deg)] ${isCardFlipped ? '[transform:rotateY(180deg)]' : ''}`}
              onClick={() => setIsCardFlipped(!isCardFlipped)}
            >
              



              {/* Cara Frontal - Datos Personales */}
              <div id="card-front-face" className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-slate-50 rounded-[12px] sm:rounded-[24px] overflow-hidden shadow-2xl flex border-2 border-slate-200">
                
                {/* Fondo Decorativo */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                   {/* Ondas (Círculos concéntricos) */}
                   <div className="absolute top-[-50%] left-[0%] w-[180%] h-[180%] rounded-full border-[1px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[-35%] left-[10%] w-[150%] h-[150%] rounded-full border-[1px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[-20%] left-[20%] w-[120%] h-[120%] rounded-full border-[1px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[-5%] left-[30%] w-[90%] h-[90%] rounded-full border-[1px] border-[#1e3a8a]/10" />
                   
                   {/* Volcanes (SVG) */}
                   <svg className="absolute bottom-6 sm:bottom-8 w-[120%] left-[-10%] h-40 sm:h-64 opacity-[0.10]" viewBox="0 0 100 40" preserveAspectRatio="none">
                     <path d="M-10,40 L15,20 L40,40 Z" fill="#1e3a8a" />
                     <path d="M10,40 L40,5 L70,40 Z" fill="#1e3a8a" />
                     <path d="M50,40 L80,15 L110,40 Z" fill="#1e3a8a" />
                     <rect x="0" y="38" width="100" height="2" fill="#0D9488" />
                   </svg>
                </div>

                {/* Banda Lateral */}
                <div className="w-[18%] sm:w-[22%] h-full flex z-10 relative">
                  <div className="w-[15%] h-full bg-[#1e3a8a]"></div>
                  <div className="w-[85%] h-full bg-gradient-to-b from-[#1e3a8a] via-[#1e40af] to-[#0D9488] rounded-r-[30px] sm:rounded-r-[60px] shadow-[2px_0_15px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="relative w-[85%] max-w-[140px] aspect-square flex items-center justify-center">
                      <img src="/escudo_completo.png" className="w-full h-full object-contain -rotate-90 opacity-90 brightness-0 invert filter" alt="Escudo Nicaragua" />
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="w-[82%] sm:w-[78%] h-full p-4 sm:p-8 flex flex-col z-10 relative bg-white/50 backdrop-blur-[1px]">
                  
                  {/* Header */}
                  <div className="flex justify-between items-center mb-2 sm:mb-6 w-full">
                    <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                      <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-transparent shrink-0">
                         <img src="/app-logo-v2.jpg" alt="Salud Conecta" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <div className="text-[#0D9488] font-bold text-[8px] sm:text-[14px] leading-[1.1] tracking-widest shrink-0">
                        SALUD<br/>CONECTA
                      </div>
                    </div>
                    
                    <div className="text-center flex-1 mx-2 sm:mx-4">
                      <h2 className="text-[#0f172a] font-bold text-[12px] sm:text-[26px] tracking-wider uppercase leading-tight whitespace-nowrap">DOCUMENTO DE EMERGENCIA</h2>
                      <p className="text-slate-600 text-[6px] sm:text-[11px] font-semibold tracking-widest uppercase mt-[2px] sm:mt-1">Acceso inmediato a información médica</p>
                    </div>
                    
                    <div className="shrink-0 flex items-start">
                      <img src="/star-of-life.svg" className="w-8 h-8 sm:w-14 sm:h-14 opacity-90" alt="Star of Life" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-row gap-3 sm:gap-6 flex-1 items-start mt-2 sm:mt-6 w-full relative">
                    
                    {/* Foto */}
                    <div className="w-[75px] sm:w-[140px] shrink-0 self-start border-[3px] border-white shadow-lg rounded-md overflow-hidden bg-slate-200">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Foto" className="w-full aspect-[3/4] object-cover" />
                      ) : (
                        <div className="w-full aspect-[3/4] flex items-center justify-center text-2xl sm:text-5xl text-slate-400 font-bold">
                          {getInitials(user.name)}
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-start text-left pl-1 sm:pl-3">
                      <div className="mb-3 sm:mb-8 pb-1">
                        <p className="text-[#0f172a] font-bold text-[6px] sm:text-[11px] mb-0 sm:mb-1 uppercase tracking-wider">NOMBRE COMPLETO</p>
                        <h3 className="text-[#0f172a] font-bold text-[14px] sm:text-[32px] tracking-wide leading-none">{displayName}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-3 sm:gap-y-8 gap-x-3 sm:gap-x-6 max-w-[85%]">
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-[11px] tracking-wider uppercase mb-0.5">FECHA DE NACIMIENTO</p>
                          <p className="text-[#0f172a] font-bold text-[10px] sm:text-[18px] leading-none">
                            {user.birthDate ? user.birthDate.split('-').reverse().join('-') : '---'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-[11px] tracking-wider uppercase mb-0.5">LUGAR DE NACIMIENTO</p>
                          <p className="text-[#0f172a] font-bold text-[10px] sm:text-[18px] uppercase leading-none">{user.city || '---'}</p>
                        </div>
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-[11px] tracking-wider uppercase mb-0.5">SEXO</p>
                          <p className="text-[#0f172a] font-bold text-[10px] sm:text-[18px] uppercase leading-none">{user.sex === 'male' ? 'M' : user.sex === 'female' ? 'F' : '---'}</p>
                        </div>
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-[11px] tracking-wider uppercase mb-0.5">NÚMERO DE IDENTIDAD</p>
                          <p className="text-[#0f172a] font-bold text-[10px] sm:text-[18px] uppercase leading-none">{localMedicalData.cedula || '---'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Caja País de Residencia */}
                    <div className="absolute right-0 bottom-6 sm:bottom-12 flex flex-col items-center">
                       <div className="bg-[#0f3b73] rounded-md sm:rounded-xl px-3 py-2 sm:px-6 sm:py-4 text-center shadow-lg w-[85px] sm:w-[180px]">
                         <p className="text-white/90 font-bold text-[5px] sm:text-[10px] tracking-widest uppercase mb-1 sm:mb-2 leading-none">PAÍS DE RESIDENCIA</p>
                         <p className="text-white font-bold text-[8px] sm:text-[18px] tracking-wider uppercase leading-none">NICARAGUA</p>
                       </div>
                    </div>
                    
                  </div>

                  {/* Footer */}
                  <div className="mt-auto flex justify-between items-end pb-0 sm:pb-2 pt-2 sm:pt-4 w-full">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="w-6 h-6 sm:w-12 sm:h-12 flex items-center justify-center text-[#1e3a8a] shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                           <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="1.5" />
                           <path d="M12 8v8" strokeWidth="2.5" strokeLinecap="round" />
                           <path d="M8 12h8" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[#0f172a] font-bold text-[5px] sm:text-[10px] tracking-widest uppercase leading-[1.2]">
                          Uso exclusivo en<br/>situaciones de emergencia
                        </p>
                        <p className="text-slate-600 text-[4px] sm:text-[8px] mt-[2px] leading-[1.2]">
                          Este documento no sustituye<br/>la cédula de identidad.
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                      <p className="text-[#0f172a] font-bold text-[5px] sm:text-[9px] tracking-wider mb-[2px] sm:mb-[4px]">
                        SALUD QUE TE CONECTA, VIDA QUE TE ACOMPAÑA
                      </p>
                      <div className="h-[2px] w-full bg-slate-400 relative my-[2px] sm:my-[4px]">
                         <div className="absolute left-1/2 -translate-x-1/2 -top-[4px] sm:-top-[7px] bg-[#f8fafc] px-1 sm:px-3">
                           <p className="text-[#0D9488] font-bold text-[6px] sm:text-[10px] tracking-widest leading-none bg-clip-text">
                             SALUD CONECTA
                           </p>
                         </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
              {/* Cara Trasera - Datos Médicos */}
              <div id="card-back-face" className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-50 rounded-[12px] sm:rounded-[20px] overflow-hidden shadow-2xl flex border border-slate-200">
                
                {/* Fondo Decorativo */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                   {/* Ondas (Círculos concéntricos) */}
                   <div className="absolute top-[-30%] left-[10%] w-[150%] h-[150%] rounded-full border-[0.5px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[-20%] left-[20%] w-[130%] h-[130%] rounded-full border-[0.5px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[-10%] left-[30%] w-[110%] h-[110%] rounded-full border-[0.5px] border-[#1e3a8a]/10" />
                   
                   {/* Volcanes (SVG) */}
                   <svg className="absolute bottom-6 w-full h-24 opacity-30" viewBox="0 0 100 30" preserveAspectRatio="none">
                     <path d="M0,30 L25,10 L45,30 Z" fill="#1e3a8a" />
                     <path d="M30,30 L60,5 L85,30 Z" fill="#1e3a8a" />
                     <path d="M65,30 L85,15 L100,30 Z" fill="#1e3a8a" />
                     <rect x="0" y="28" width="100" height="2" fill="#0D9488" />
                   </svg>
                </div>

                {/* Banda Lateral */}
                <div className="w-[18%] sm:w-[22%] h-full flex z-10 relative">
                  <div className="w-[20%] h-full bg-[#1e3a8a]"></div>
                  <div className="w-[80%] h-full bg-gradient-to-b from-[#1e3a8a] via-[#1e40af] to-[#0D9488] rounded-r-[30px] sm:rounded-r-[50px] shadow-[2px_0_15px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center relative overflow-hidden">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Coat_of_arms_of_Nicaragua.svg" className="w-12 h-12 sm:w-20 sm:h-20 -rotate-90 opacity-90 brightness-0 invert filter" alt="Escudo Nicaragua" />
                  </div>
                </div>

                {/* Contenido Principal */}
                <div className="w-[82%] sm:w-[78%] h-full p-3 sm:p-5 flex flex-col z-10 relative bg-white/70 backdrop-blur-[2px]">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start mb-2 sm:mb-4 w-full">
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-transparent shrink-0">
                         <img src="/app-logo-v2.jpg" alt="Salud Conecta" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <div className="text-[#1e3a8a] font-bold text-[6px] sm:text-[10px] leading-[1.1] tracking-widest shrink-0">
                        SALUD<br/>CONECTA
                      </div>
                    </div>
                    
                    <div className="text-center flex-1 mx-1 sm:mx-4">
                      <h2 className="text-[#1e3a8a] font-bold text-[9px] sm:text-[16px] tracking-wider uppercase leading-tight whitespace-nowrap">DATOS MÉDICOS DE EMERGENCIA</h2>
                      <p className="text-slate-600 text-[5px] sm:text-[8px] font-semibold tracking-wide uppercase mt-0.5">Atención: {displayName}</p>
                    </div>
                    
                    <div className="shrink-0 flex items-start">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/5b/Star_of_life2.svg" className="w-6 h-6 sm:w-10 sm:h-10" alt="Star of Life" />
                    </div>
                  </div>

                  {/* Body - Grid */}
                  <div className="flex-1 grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1.5 sm:gap-y-3 w-full">
                    
                    <div>
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-[1px] sm:mb-1">
                        <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center text-[#1e3a8a]">
                          <Heart className="w-2 h-2 sm:w-3 sm:h-3" />
                        </div>
                        <p className="text-[#1e3a8a] font-bold text-[5px] sm:text-[8px] uppercase tracking-wide">Enfermedades</p>
                      </div>
                      <div className="bg-white/80 border border-slate-200 shadow-sm rounded p-1 sm:p-2 min-h-[16px] sm:min-h-[28px] text-slate-800 text-[7px] sm:text-[11px] font-semibold leading-tight">
                        {localMedicalData.enfermedades || 'Ninguna'}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-[1px] sm:mb-1">
                        <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center text-[#1e3a8a]">
                          <Activity className="w-2 h-2 sm:w-3 sm:h-3" />
                        </div>
                        <p className="text-[#1e3a8a] font-bold text-[5px] sm:text-[8px] uppercase tracking-wide">Alergias</p>
                      </div>
                      <div className="bg-white/80 border border-slate-200 shadow-sm rounded p-1 sm:p-2 min-h-[16px] sm:min-h-[28px] text-slate-800 text-[7px] sm:text-[11px] font-semibold leading-tight">
                        {localMedicalData.alergias || 'Ninguna'}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-[1px] sm:mb-1">
                        <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center text-[#1e3a8a]">
                          <Droplets className="w-2 h-2 sm:w-3 sm:h-3" />
                        </div>
                        <p className="text-[#1e3a8a] font-bold text-[5px] sm:text-[8px] uppercase tracking-wide">Tipo de Sangre</p>
                      </div>
                      <div className="bg-white/80 border border-slate-200 shadow-sm rounded p-1 sm:p-2 min-h-[16px] sm:min-h-[28px] text-slate-800 text-[7px] sm:text-[11px] font-semibold leading-tight">
                        {localMedicalData.tipoSangre || user.bloodType || 'O+'}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-[1px] sm:mb-1">
                        <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center text-[#1e3a8a]">
                          <Activity className="w-2 h-2 sm:w-3 sm:h-3" />
                        </div>
                        <p className="text-[#1e3a8a] font-bold text-[5px] sm:text-[8px] uppercase tracking-wide">Tratamientos</p>
                      </div>
                      <div className="bg-white/80 border border-slate-200 shadow-sm rounded p-1 sm:p-2 min-h-[16px] sm:min-h-[28px] text-slate-800 text-[7px] sm:text-[11px] font-semibold line-clamp-2 leading-tight">
                        {localMedicalData.tratamientos || localMedicalData.pastillas || 'Ninguno'}
                      </div>
                    </div>
                  </div>

                  {/* Contacto de Emergencia */}
                  <div className="mt-1 sm:mt-2 w-full">
                    <div className="flex items-center gap-1 sm:gap-1.5 mb-[1px] sm:mb-1">
                      <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center text-[#1e3a8a]">
                        <User className="w-2 h-2 sm:w-3 sm:h-3" />
                      </div>
                      <p className="text-[#1e3a8a] font-bold text-[5px] sm:text-[8px] uppercase tracking-wide">CONTACTO DE EMERGENCIA</p>
                    </div>
                    <div className="bg-white/80 border border-slate-200 shadow-sm rounded p-1 sm:p-2 text-slate-800 text-[7px] sm:text-[11px] font-semibold flex items-center">
                      <span className="font-bold mr-2 text-[#1e3a8a]">Teléfono:</span> {localMedicalData.contactoEmergencia || user.emergencyPhone || '---'}
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="mt-auto flex justify-end items-end pb-0 sm:pb-1 pt-1 w-full">
                    <div className="text-right flex flex-col items-end w-full">
                      <p className="text-[#1e3a8a] font-bold text-[4px] sm:text-[6px] tracking-wider mb-[2px]">
                        SALUD QUE TE CONECTA, VIDA QUE TE ACOMPAÑA
                      </p>
                      <div className="h-[1px] w-full bg-slate-300 relative my-[2px]">
                         <div className="absolute left-1/2 -translate-x-1/2 -top-[3px] sm:-top-[5px] bg-white px-1 sm:px-2">
                           <p className="text-[#1e3a8a] font-bold text-[5px] sm:text-[7px] tracking-widest">
                             SALUD CONECTA
                           </p>
                         </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        { }
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('accountManagement')}</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start md:max-h-[50vh] md:overflow-y-auto md:pr-2">
            { }
            {[
              {
                id: "personal",
                title: t('personalInfo'),
                subtitle: t('personalSubtitle'),
                icon: User,
                color: "text-brand-600 bg-brand-50 border border-brand-100",
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
                title: t('medicalData'),
                subtitle: t('medicalDataSubtitle'),
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
                    <ChevronRight className={`w-5 h-5 text-slate-400 transform transition-transform ${isOpen ? "rotate-90 text-brand-600" : ""}`} />
                  </button>

                  { }
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="border-t border-slate-50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20"
                      >
                        <div className="p-5 text-xs text-slate-600 space-y-4">

                          { }
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
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-400 text-xs font-semibold transition-all"
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
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-400 text-xs font-mono font-semibold transition-all"
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
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-400 text-xs font-semibold transition-all"
                                    required
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <Globe className="w-3 h-3" /> {t('country')}
                                  </label>
                                  <input
                                    type="text"
                                    value={editCountry}
                                    onChange={(e) => setEditCountry(e.target.value)}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-400 text-xs font-semibold transition-all"
                                    required
                                  />
                                </div>
                                <div className="space-y-1.5 lg:col-span-2">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" /> Fecha de Nacimiento
                                  </label>
                                  <div className="flex gap-2">
                                    <select
                                      value={editBirthDate ? editBirthDate.split('-')[2] : ''}
                                      onChange={(e) => {
                                        const parts = (editBirthDate || `${new Date().getFullYear()}-01-01`).split('-');
                                        parts[2] = e.target.value;
                                        setEditBirthDate(parts.join('-'));
                                      }}
                                      className="w-[28%] text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-400 text-xs font-semibold appearance-none"
                                    >
                                      <option value="">Día</option>
                                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                        <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>
                                      ))}
                                    </select>
                                    <select
                                      value={editBirthDate ? editBirthDate.split('-')[1] : ''}
                                      onChange={(e) => {
                                        const parts = (editBirthDate || `${new Date().getFullYear()}-01-01`).split('-');
                                        parts[1] = e.target.value;
                                        setEditBirthDate(parts.join('-'));
                                      }}
                                      className="w-[44%] text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-400 text-xs font-semibold appearance-none"
                                    >
                                      <option value="">Mes</option>
                                      <option value="01">Enero</option>
                                      <option value="02">Febrero</option>
                                      <option value="03">Marzo</option>
                                      <option value="04">Abril</option>
                                      <option value="05">Mayo</option>
                                      <option value="06">Junio</option>
                                      <option value="07">Julio</option>
                                      <option value="08">Agosto</option>
                                      <option value="09">Septiembre</option>
                                      <option value="10">Octubre</option>
                                      <option value="11">Noviembre</option>
                                      <option value="12">Diciembre</option>
                                    </select>
                                    <select
                                      value={editBirthDate ? editBirthDate.split('-')[0] : ''}
                                      onChange={(e) => {
                                        const parts = (editBirthDate || `${new Date().getFullYear()}-01-01`).split('-');
                                        parts[0] = e.target.value;
                                        setEditBirthDate(parts.join('-'));
                                      }}
                                      className="w-[28%] text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-400 text-xs font-semibold appearance-none"
                                    >
                                      <option value="">Año</option>
                                      {Array.from({ length: 110 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="space-y-1.5 lg:col-span-2">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <Phone className="w-3 h-3" /> {t('emergencyPhone')}
                                  </label>
                                  <input
                                    type="tel"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-400 text-xs font-semibold transition-all"
                                    placeholder="+505 0000-0000"
                                  />
                                </div>
                                <div className="space-y-1.5 lg:col-span-2">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <ShieldCheck className="w-3 h-3" /> {t('idCard')}
                                  </label>
                                  <input
                                    type="text"
                                    value={localMedicalData.cedula}
                                    onChange={(e) => setLocalMedicalData({ ...localMedicalData, cedula: e.target.value })}
                                    placeholder={t('idCardPlaceholder')}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5 lg:col-span-2">
                                  <label htmlFor="input-edit-usersex" className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <User className="w-3 h-3" /> {t('sex')}
                                  </label>
                                  <select
                                    id="input-edit-usersex"
                                    value={editSex}
                                    onChange={(e) => setEditSex(e.target.value)}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-400 text-xs font-semibold transition-all"
                                  >
                                    <option value="">{t('sexNotSpecified')}</option>
                                    <option value="female">{t('sexFemale')}</option>
                                    <option value="male">{t('sexMale')}</option>
                                    <option value="intersex">{t('sexIntersex')}</option>
                                    <option value="prefer_not_to_say">{t('sexPreferNotToSay')}</option>
                                  </select>
                                </div>
                              </div>

                              <button
                                id="btn-save-personal-info"
                                type="submit"
                                className="w-full bg-brand-600 hover:bg-brand-900 active:scale-[0.98] text-white font-bold py-2.5 px-5 rounded-xl border-none outline-none text-xs transition-all tracking-wide flex items-center justify-center gap-2 shadow-sm"
                              >
                                <Save className="w-3.5 h-3.5" />
                                {t('saveProfileChanges')}
                              </button>
                            </form>
                          )}

                          {/* Seguridad / 2FA */}
                          {item.id === "seguridad" && (
                            <div className="space-y-4 text-left">
                              <p className="text-slate-500 dark:text-slate-400 leading-normal text-[13px]">
                                {t('securityConfigDesc')}
                              </p>

                              {/* 2FA Setup con validación condicional de proveedor */}
                              <TwoFactorSetup
                                userId={user.id || 'guest'}
                                userProfile={{
                                  id: user.id || 'guest',
                                  email: user.email,
                                  phone: user.emergencyPhone,
                                  provider: user.provider,
                                }}
                                onNavigateToPersonalInfo={() => setActiveMenuSection('personal')}
                              />
                            </div>
                          )}

                          { }
                          {item.id === "notificaciones" && (
                            <div className="space-y-2.5 text-left">
                              <p className="text-[11px] text-slate-500 mb-2">{t('notifSelectDesc')}</p>
                              {[
                                { value: "consejo", label: t('notifTip'), desc: t('notifTipDesc') },
                                { value: "recordatorio", label: t('notifReminder'), desc: t('notifReminderDesc') },
                                { value: "ninguna", label: t('notifMute'), desc: t('notifMuteDesc') },
                              ].map((opt) => {
                                const isSelected = notifPreference.includes(opt.value);
                                return (
                                  <div
                                    key={opt.value}
                                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-colors ${isSelected
                                      ? 'bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:border-brand-900'
                                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                      }`}
                                    onClick={() => handleNotifChange(opt.value)}
                                  >
                                    <div className="flex-1 min-w-0 mr-3">
                                      <span className={`font-semibold text-xs block ${isSelected ? 'text-brand-900 dark:text-brand-200' : 'text-slate-700 dark:text-slate-200'}`}>
                                        {opt.label}
                                      </span>
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">{opt.desc}</span>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-brand-600 bg-brand-600' : 'border-slate-300 dark:border-slate-600'
                                      }`}>
                                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          { }
                          {item.id === "datos_medicos" && (
                            <form onSubmit={handleUpdateMedicalData} className="space-y-4 text-left">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    {t('diseases')}
                                  </label>
                                  <input
                                    type="text"
                                    value={localMedicalData.enfermedades}
                                    onChange={(e) => setLocalMedicalData({ ...localMedicalData, enfermedades: e.target.value })}
                                    placeholder={t('diseasesPlaceholder')}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    {t('allergies')}
                                  </label>
                                  <input
                                    type="text"
                                    value={localMedicalData.alergias}
                                    onChange={(e) => setLocalMedicalData({ ...localMedicalData, alergias: e.target.value })}
                                    placeholder={t('allergiesPlaceholder')}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    {t('bloodType')}
                                  </label>
                                  <select
                                    value={localMedicalData.tipoSangre}
                                    onChange={(e) => setLocalMedicalData({ ...localMedicalData, tipoSangre: e.target.value })}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  >
                                    <option value="">{t('selectOption')}</option>
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
                                    {t('currentTreatments')}
                                  </label>
                                  <input
                                    type="text"
                                    value={localMedicalData.tratamientos}
                                    onChange={(e) => setLocalMedicalData({ ...localMedicalData, tratamientos: e.target.value })}
                                    placeholder={t('treatmentsPlaceholder')}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    {t('pills')}
                                  </label>
                                  <input
                                    type="text"
                                    value={localMedicalData.pastillas}
                                    onChange={(e) => setLocalMedicalData({ ...localMedicalData, pastillas: e.target.value })}
                                    placeholder={t('pillsPlaceholder')}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    {t('vaccines')}
                                  </label>
                                  <input
                                    type="text"
                                    value={localMedicalData.vacunas}
                                    onChange={(e) => setLocalMedicalData({ ...localMedicalData, vacunas: e.target.value })}
                                    placeholder={t('vaccinesPlaceholder')}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    {t('weight')}
                                  </label>
                                  <input
                                    type="number"
                                    value={localMedicalData.peso}
                                    onChange={(e) => setLocalMedicalData({ ...localMedicalData, peso: e.target.value })}
                                    placeholder={t('weightPlaceholder')}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    {t('height')}
                                  </label>
                                  <input
                                    type="number"
                                    value={localMedicalData.altura}
                                    onChange={(e) => setLocalMedicalData({ ...localMedicalData, altura: e.target.value })}
                                    placeholder={t('heightPlaceholder')}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                              </div>

                              {/* Sync status indicator */}
                              {medicalSyncSource !== "none" && (
                                <div className={`flex items-center gap-2 text-[10px] font-semibold py-1.5 px-3 rounded-lg mb-1 ${medicalSyncSource === "fhir"
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40"
                                    : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40"
                                  }`}>
                                  {medicalSyncSource === "fhir" ? (
                                    <><Cloud className="w-3 h-3" /> Sincronizado con Google Cloud FHIR</>
                                  ) : (
                                    <><CloudOff className="w-3 h-3" /> Datos guardados localmente</>
                                  )}
                                </div>
                              )}

                              {/* Error message */}
                              {medicalSaveError && (
                                <div className="flex items-center gap-2 text-[10px] font-semibold py-1.5 px-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 mb-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>{medicalSaveError}</span>
                                </div>
                              )}

                              <button
                                type="submit"
                                disabled={isSavingMedical}
                                className="w-full bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold py-2.5 px-5 rounded-xl border-none outline-none text-xs transition-all tracking-wide flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {isSavingMedical ? (
                                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...</>
                                ) : (
                                  <><Save className="w-3.5 h-3.5" /> {t('saveMedicalData')}</>
                                )}
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

        { }
        <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl p-4.5 border border-slate-200/50 dark:border-slate-800 flex items-center space-x-3.5 mt-4">
          <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-100 dark:border-brand-900/50">
            <Shield className="w-5 h-5 text-brand-600" />
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

        { }
        {onGoToAdmin && (
          <button
            onClick={onGoToAdmin}
            className="w-full mt-4 bg-brand-50 dark:bg-brand-900/10 hover:bg-brand-100 dark:hover:bg-brand-900/20 text-brand-600 dark:text-brand-400 border border-brand-200/85 dark:border-brand-900/30 rounded-2xl py-3.5 px-5 font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Shield className="w-4.5 h-4.5 text-brand-400 shrink-0" />
            <span>{t('adminPanel')}</span>
          </button>
        )}

        { }
        {onLogout && (
          <button
            id="btn-profile-logout"
            onClick={onLogout}
            className="w-full mt-5 bg-red-50 dark:bg-red-900/10 hover:bg-red-100/80 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200/85 dark:border-red-900/30 rounded-2xl py-3.5 px-5 font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5 text-red-500 shrink-0" />
            <span>{t('logout')}</span>
          </button>
        )}

      </main>

      { }
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

      { }
      <AnimatePresence>
        {isNotificationInboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-6"
            onClick={() => setIsNotificationInboxOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mt-16 sm:mt-0 bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center border border-blue-100 dark:border-blue-800 shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{t('todayNotifications')}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">{t('todayNotificationsDesc')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNotificationInboxOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full px-2.5 py-1">
                  {notificationHistory.length} {t('notifications')}
                </span>
                {unreadNotifications > 0 && (
                  <button
                    onClick={handleMarkNotificationsRead}
                    className="text-[10px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full px-3 py-1.5 transition-colors"
                  >
                    {t('markAllRead')}
                  </button>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {notificationHistory.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notificationHistory.map((notification) => {
                      const TypeIcon = notification.source === "announcement"
                        ? notification.category === "alert"
                          ? AlertTriangle
                          : notification.category === "promotion"
                            ? Star
                            : Megaphone
                        : BellRing;

                      return (
                        <div key={notification.id} className="p-4 flex items-start gap-3">
                          <div className={`mt-0.5 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${notification.read
                              ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300"
                              : getNotificationTone(notification)
                            }`}>
                            <TypeIcon className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="inline-flex mb-1 text-[9px] font-black uppercase tracking-wide rounded-full px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                  {getNotificationTypeLabel(notification)}
                                </span>
                                <h5 className="text-xs font-black text-slate-800 dark:text-white leading-snug">{notification.title}</h5>
                              </div>
                              <span className={`text-[9px] font-black rounded-full px-2 py-1 shrink-0 ${notification.read
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                                  : "bg-blue-600 text-white"
                                }`}>
                                {notification.read ? t('read') : t('unread')}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] leading-normal text-slate-500 dark:text-slate-400">{notification.body}</p>
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>{formatNotificationTime(notification.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-6 py-10 text-center">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-3">
                      <Bell className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-black text-slate-800 dark:text-white">{t('noNotificationsToday')}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">{t('noNotificationsTodayDesc')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      { }
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
              { }
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

              { }
              <div className="flex flex-col items-center space-y-6">
                { }
                <div
                  ref={qrRef}
                  className="w-72 h-72 sm:w-96 sm:h-96 border-4 border-brand-200 dark:border-brand-900 p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-lg"
                >
                  <QRCodeSVG
                    value={qrTelemetryText}
                    size={320}
                    level="H"
                    className="w-full h-full text-slate-900 dark:text-white"
                  />
                </div>

                { }
                <div className="w-full space-y-3 text-center">
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {t('emergencyDesc')}
                  </p>
                </div>

                { }
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

      {/* Modal de Enrolamiento 2FA */}
      <MfaEnrollmentModal
        isOpen={showMfaEnrollment}
        onClose={() => setShowMfaEnrollment(false)}
        onSuccess={() => {
          refreshProfile();
        }}
      />
    </div>
  );
}