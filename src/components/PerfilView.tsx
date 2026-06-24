import React, { useState, useRef, useCallback, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Bell, User, Shield, Key, BellRing, Heart, ChevronRight, CheckCircle, LogOut, Camera, Loader2, Mail, MapPin, QrCode, Lock, ShieldCheck, Download, X, Maximize2, Phone, Globe, Droplets, Plus, Trash2, Save, Activity, Cloud, CloudOff, AlertTriangle, Clock, Megaphone, Star } from "lucide-react";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import { uploadAvatar } from "../lib/avatarService";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { saveMedicalData, loadMedicalData, getEmptyMedicalForm, type MedicalFormData } from "../lib/fhirService";
import { getTodaysNotificationHistory, markTodaysNotificationsRead, type AppNotificationRecord } from "../lib/notificationService";

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
  const [editBloodType, setEditBloodType] = useState(user.bloodType || "O+");
  const [editConditions, setEditConditions] = useState<string[]>(user.healthConditions);
  const [newCondition, setNewCondition] = useState("");
  const [isSavedAlertOpen, setIsSavedAlertOpen] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<AppNotificationRecord[]>([]);
  const [isNotificationInboxOpen, setIsNotificationInboxOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

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
    setNotificationHistory(getTodaysNotificationHistory(user.id));
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
    const updatedHistory = markTodaysNotificationsRead(user.id);
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

      
      const primaryColor = [30, 58, 138]; 
      const secondaryColor = [13, 148, 136]; 
      const accentColor = [56, 189, 248]; 
      const slateDark = [15, 23, 42]; 
      const slateLight = [100, 116, 139]; 
      const bgPage = [255, 255, 255]; 
      const sectionBg = [248, 250, 252]; 

      
      const drawBackground = (pageDoc: any) => {
        
        pageDoc.setFillColor(bgPage[0], bgPage[1], bgPage[2]);
        pageDoc.rect(0, 0, 210, 297, 'F');

        
        pageDoc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pageDoc.rect(0, 0, 210, 35, 'F');

        
        pageDoc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        pageDoc.rect(0, 35, 210, 2, 'F');

        
        pageDoc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        pageDoc.rect(10, 45, 1.5, 240, 'F');

        
        pageDoc.setFillColor(241, 245, 249); 
        pageDoc.rect(0, 285, 210, 12, 'F');
        pageDoc.setFontSize(8);
        pageDoc.setFont("helvetica", "italic");
        pageDoc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
        pageDoc.text(t('pdfFooterText'), 105, 292, { align: "center" });
      };

      drawBackground(doc);

      
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(t('pdfMedicalCard'), 15, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 215, 255);
      doc.text(t('pdfConfidential'), 15, 28);

      
      let yPos = 55;

      
      doc.setFillColor(sectionBg[0], sectionBg[1], sectionBg[2]);
      doc.roundedRect(15, yPos - 8, 180, 40, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240); 
      doc.roundedRect(15, yPos - 8, 180, 40, 3, 3, 'S');

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(t('pdfPersonalInfo'), 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text(t('pdfPatient'), 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${user.name}`, 40, yPos);

      doc.setFont("helvetica", "bold");
      doc.text(t('idCard').replace(" de Identidad", "") + ":", 110, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${localMedicalData.cedula || t('pdfNotRegistered')}`, 130, yPos);
      yPos += 7;

      doc.setFont("helvetica", "bold");
      doc.text(t('pdfBlood'), 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(225, 29, 72); 
      doc.text(`${localMedicalData.tipoSangre || editBloodType || user.bloodType || t('pdfNotSpecified')}`, 40, yPos);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text(t('pdfEmergContact'), 110, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${localMedicalData.contactoEmergencia || user.emergencyPhone || "+505 8888-9999"}`, 140, yPos);
      yPos += 7;

      doc.setFont("helvetica", "bold");
      doc.text(t('pdfWeight'), 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${localMedicalData.peso ? localMedicalData.peso + ' kg' : t('pdfNotRegistered')}`, 40, yPos);

      doc.setFont("helvetica", "bold");
      doc.text(t('pdfHeight'), 110, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`${localMedicalData.altura ? localMedicalData.altura + ' cm' : t('pdfNotRegistered')}`, 130, yPos);
      yPos += 18;

      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(t('pdfSpecializedData'), 15, yPos);
      yPos += 8;

      doc.setFontSize(10);

      const renderMedicalItem = (label: string, value: string) => {
        
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(15, yPos - 5, 180, 12, 2, 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(15, yPos - 5, 180, 12, 2, 2, 'S');

        doc.setFont("helvetica", "bold");
        doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
        doc.text(`${label}:`, 20, yPos + 2);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);

        
        const splitText = doc.splitTextToSize(value || t('pdfNoneRegistered'), 120);
        doc.text(splitText, 60, yPos + 2);
        yPos += (splitText.length * 5) + 8;
      };

      renderMedicalItem(t('pdfDiseases'), localMedicalData.enfermedades);
      renderMedicalItem(t('pdfAllergies'), localMedicalData.alergias);
      renderMedicalItem(t('pdfTreatments'), localMedicalData.tratamientos);
      renderMedicalItem(t('pdfPills'), localMedicalData.pastillas);
      renderMedicalItem(t('pdfVaccines'), localMedicalData.vacunas);

      
      if (user.healthConditions && user.healthConditions.length > 0) {
        renderMedicalItem(t('pdfOtherCond'), user.healthConditions.join(", "));
      }

      
      yPos += 5;
      if (yPos > 210) {
        doc.addPage();
        drawBackground(doc);
        yPos = 55;
      }

      
      doc.setFillColor(sectionBg[0], sectionBg[1], sectionBg[2]);
      doc.roundedRect(15, yPos, 180, 50, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, yPos, 180, 50, 3, 3, 'S');

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(t('pdfQrTitle'), 85, yPos + 15);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
      doc.text(t('pdfQrDesc'), 85, yPos + 22);

      doc.setFontSize(8);
      doc.setTextColor(225, 29, 72); 
      doc.text(t('pdfQrFooter'), 85, yPos + 38);

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
          
          doc.addImage(pngData, 'PNG', 25, yPos + 5, 40, 40);

          doc.save(`${t('pdfFileName')}-${user.name}.pdf`);
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
      } else {
        doc.save(`${t('pdfFileName')}-${user.name}.pdf`);
      }
    }).catch(err => {
      console.error("Error cargando jsPDF", err);
    });
  };

  return (
    <div className="flex flex-col min-h-dvh bg-[#f3f8ff] dark:bg-slate-950 transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full border border-blue-200/55 dark:border-blue-900/30"></div>
        <div className="absolute top-28 -left-8 w-72 h-72 rounded-full border border-blue-200/45 dark:border-blue-900/30"></div>
        <div className="absolute top-72 right-[-8rem] w-72 h-72 rounded-full bg-blue-100/45 dark:bg-blue-950/30 blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_28%,rgba(56,189,248,0.08),transparent_28%),linear-gradient(135deg,transparent_0%,transparent_60%,rgba(59,130,246,0.08)_60%,transparent_78%)]"></div>
      </div>

      {}
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

      {}
      <main className="relative z-10 px-4 sm:px-8 pt-4 sm:pt-8 flex-1 space-y-5 sm:space-y-7 max-w-5xl mx-auto w-full">

        {}
        <section className="grid grid-cols-1 md:grid-cols-[minmax(220px,0.9fr)_minmax(280px,1.1fr)] items-center gap-5 sm:gap-8 md:gap-12 md:min-h-[330px]">

          {}
          <div className="flex justify-center md:justify-end">
            <div className="relative group shrink-0 select-none">
              <div className="absolute inset-[-1.75rem] sm:inset-[-3rem] rounded-full border border-blue-200/60 dark:border-blue-900/40"></div>
              <div className="absolute inset-[-1.1rem] sm:inset-[-2rem] rounded-full border border-blue-200/60 dark:border-blue-900/40"></div>
              <div className="absolute inset-[-0.55rem] sm:inset-[-1rem] rounded-full border border-blue-200/70 dark:border-blue-900/40"></div>
              <div
                onClick={handleAvatarClick}
                className={`w-32 h-32 sm:w-56 sm:h-56 rounded-full p-1.5 sm:p-2.5 bg-gradient-to-tr from-blue-700 via-blue-500 to-cyan-300 shadow-[0_18px_36px_rgba(37,99,235,0.22)] sm:shadow-[0_26px_50px_rgba(37,99,235,0.28)] relative cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-95 active:opacity-85 ${user.id === "guest" ? "cursor-not-allowed opacity-90 hover:scale-100 active:scale-100 active:opacity-90" : ""}`}
                title={user.id === "guest" ? t('guestAvatarTitle') : t('changePhoto')}
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

                {}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center rounded-full">
                    <Loader2 className="w-7 h-7 sm:w-9 sm:h-9 text-white animate-spin" />
                  </div>
                )}

                {}
                {user.id !== "guest" && !isUploading && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-full">
                    <Camera className="w-7 h-7 sm:w-9 sm:h-9 text-white drop-shadow-md" />
                  </div>
                )}
              </div>

              {}
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

              {}
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
            <h3 className="font-display font-bold text-4xl sm:text-7xl text-slate-950 dark:text-white tracking-tight leading-[0.95] break-words">
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

            {}
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

        {}
        <section className="bg-white/95 dark:bg-slate-900/95 rounded-[1.5rem] sm:rounded-[2.75rem] p-3.5 sm:p-8 border border-white/80 dark:border-slate-800 shadow-[0_18px_46px_rgba(37,99,235,0.1)] sm:shadow-[0_24px_70px_rgba(37,99,235,0.12)]">
          <div className="flex flex-row items-center gap-3 sm:gap-8 justify-between">
            {}
            <div className="flex flex-col gap-2 flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2 sm:gap-5">
                <h4 className="font-display font-bold text-slate-950 dark:text-white text-base sm:text-3xl leading-tight truncate">
                  {t('shareProfile')}
                </h4>
              </div>
              <p className="hidden sm:block text-slate-600 dark:text-slate-300 text-sm sm:text-lg leading-relaxed max-w-md">
                {t('emergencyDesc')}
              </p>
            </div>

            {}
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

        {}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('accountManagement')}</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start md:max-h-[50vh] md:overflow-y-auto md:pr-2">
            {}
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
                    <ChevronRight className={`w-5 h-5 text-slate-400 transform transition-transform ${isOpen ? "rotate-90 text-blue-600" : ""}`} />
                  </button>

                  {}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="border-t border-slate-50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20"
                      >
                        <div className="p-5 text-xs text-slate-600 space-y-4">

                          {}
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
                                    <Globe className="w-3 h-3" /> {t('country')}
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
                                {t('saveProfileChanges')}
                              </button>
                            </form>
                          )}

                          {}
                          {item.id === "seguridad" && (
                            <div className="space-y-3 text-left">
                              <p className="text-slate-500 dark:text-slate-400 leading-normal text-[13px]">
                                {t('securityConfigDesc')}
                              </p>
                              <div className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center p-2">
                                    <svg viewBox="0 0 24 24" className="w-full h-full">
                                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{t('googleAccount')}</h4>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('googleAccountDesc')}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {}
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
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'
                                      }`}>
                                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {}
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
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    {t('idCard')}
                                  </label>
                                  <input
                                    type="text"
                                    value={localMedicalData.cedula}
                                    onChange={(e) => setLocalMedicalData({ ...localMedicalData, cedula: e.target.value })}
                                    placeholder={t('idCardPlaceholder')}
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    {t('emergencyPhone')}
                                  </label>
                                  <input
                                    type="tel"
                                    value={localMedicalData.contactoEmergencia}
                                    onChange={(e) => setLocalMedicalData({ ...localMedicalData, contactoEmergencia: e.target.value })}
                                    placeholder="+505 0000-0000"
                                    className="w-full text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 text-xs font-semibold transition-all"
                                  />
                                </div>
                              </div>

                              {/* Sync status indicator */}
                              {medicalSyncSource !== "none" && (
                                <div className={`flex items-center gap-2 text-[10px] font-semibold py-1.5 px-3 rounded-lg mb-1 ${
                                  medicalSyncSource === "fhir"
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

        {}
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

        {}
        {onGoToAdmin && (
          <button
            onClick={onGoToAdmin}
            className="w-full mt-4 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200/85 dark:border-blue-900/30 rounded-2xl py-3.5 px-5 font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Shield className="w-4.5 h-4.5 text-blue-500 shrink-0" />
            <span>{t('adminPanel')}</span>
          </button>
        )}

        {}
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

      {}
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

      {}
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
                          <div className={`mt-0.5 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                            notification.read
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
                              <span className={`text-[9px] font-black rounded-full px-2 py-1 shrink-0 ${
                                notification.read
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

      {}
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
              {}
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

              {}
              <div className="flex flex-col items-center space-y-6">
                {}
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

                {}
                <div className="w-full space-y-3 text-center">
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {t('emergencyDesc')}
                  </p>
                </div>

                {}
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
