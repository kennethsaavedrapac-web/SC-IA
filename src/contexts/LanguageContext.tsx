import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "es" | "en";

export interface Translations {
  navHome: string;
  navConsulta: string;
  navCentros: string;
  navBuscar: string;
  navPremium: string;
  navPerfil: string;
  welcome: string;
  subtitle: string;
  viewProfile: string;
  aiTriage: string;
  aiTriageDesc: string;
  publicHealth: string;
  publicHealthDesc: string;
  myAppointments: string;
  myAppointmentsDesc: string;
  infoProtected: string;
  infoProtectedDesc: string;
  hello: string;
  helloGranada: string;
  howFeel: string;
  hereToHelp: string;
  describeSymptoms: string;
  complyRegs: string;
  emergencyCall: string;
  emergencyTitle: string;
  emergencyCallBtn: string;
  cancel: string;
  whenCall: string;
  whenCallDesc1: string;
  whenCallDesc2: string;
  whenCallDesc3: string;
  whenCallDesc4: string;
  whenTriage: string;
  whenTriageDesc1: string;
  whenTriageDesc2: string;
  whenTriageDesc3: string;
  settingsTitle: string;
  settingsSubtitle: string;
  darkMode: string;
  darkModeDesc: string;
  fontSize: string;
  fontSizeDesc: string;
  fontSizeSmall: string;
  fontSizeMedium: string;
  fontSizeLarge: string;
  language: string;
  languageDesc: string;
  languageEs: string;
  languageEn: string;
  terms: string;
  termsDesc: string;
  privacy: string;
  privacyDesc: string;
  userGuide: string;
  userGuideDesc: string;
  devTools: string;
  devToolsDesc: string;
  appointmentsLength: string;
  supabaseStatus: string;
  supabaseActive: string;
  supabaseInactive: string;
  geminiActive: string;
  geminiActiveDesc: string;
  resetDb: string;
  appVersion: string;
  back: string;
  guideStep1Title: string;
  guideStep1Desc: string;
  guideStep2Title: string;
  guideStep2Desc: string;
  guideStep3Title: string;
  guideStep3Desc: string;
  guideStep4Title: string;
  guideStep4Desc: string;
}

const translations: Record<Language, Translations> = {
  es: {
    navHome: "Inicio",
    navConsulta: "Consulta IA",
    navCentros: "Centros Médicos",
    navBuscar: "Buscador / Citas",
    navPremium: "Premium",
    navPerfil: "Mi perfil",
    welcome: "Bienvenido,",
    subtitle: "Tu salud, conectada. Respuestas claras, decisiones seguras.",
    viewProfile: "Ver perfil",
    aiTriage: "Consulta con IA",
    aiTriageDesc: "Cuéntanos cómo te sientes",
    publicHealth: "Salud pública",
    publicHealthDesc: "Información y servicios oficiales",
    myAppointments: "Mis citas",
    myAppointmentsDesc: "Gestiona tus próximas citas",
    infoProtected: "Tu información está protegida.",
    infoProtectedDesc: "Privacidad y seguridad primero.",
    hello: "Hola",
    helloGranada: "Soy tu asistente de salud en Granada.",
    howFeel: "Contame cómo te sentís hoy.",
    hereToHelp: "Estoy aquí para ayudarte.",
    describeSymptoms: "Describe tus síntomas…",
    complyRegs: "Cumplimos con normativas de salud internacionales.",
    emergencyCall: "Llamada de Emergencia",
    emergencyTitle: "Cruz Roja • Línea 128",
    emergencyCallBtn: "Llamar al 128 ahora",
    cancel: "Cancelar",
    whenCall: "¿Cuándo sí debes llamar?",
    whenCallDesc1: "Dificultad respiratoria severa o asfixia.",
    whenCallDesc2: "Dolor opresivo en el pecho (sospecha de infarto).",
    whenCallDesc3: "Pérdida de conocimiento o convulsiones.",
    whenCallDesc4: "Accidentes graves o sangrado incontrolable.",
    whenTriage: "¿Cuándo usar la Consulta IA en su lugar?",
    whenTriageDesc1: "Fiebre moderada o síntomas de gripe.",
    whenTriageDesc2: "Dolores corporales leves o de garganta.",
    whenTriageDesc3: "Consultas sobre dosis de medicamentos o triaje.",
    settingsTitle: "Ajustes del Sistema",
    settingsSubtitle: "Configura tus preferencias para Salud-Conecta IA",
    darkMode: "Modo Oscuro",
    darkModeDesc: "Cambiar entre tema claro y oscuro",
    fontSize: "Tamaño de Fuente",
    fontSizeDesc: "Ajustar el tamaño de la letra de la app",
    fontSizeSmall: "Pequeño",
    fontSizeMedium: "Mediano",
    fontSizeLarge: "Grande",
    language: "Idioma",
    languageDesc: "Seleccionar el idioma de la aplicación",
    languageEs: "Español",
    languageEn: "Inglés",
    terms: "Términos y Condiciones",
    termsDesc: "Términos de servicio y uso",
    privacy: "Políticas de Privacidad",
    privacyDesc: "Cumplimiento HIPAA / GDPR",
    userGuide: "Guía de Uso",
    userGuideDesc: "Manual interactivo de la app",
    devTools: "Herramientas de Desarrollador",
    devToolsDesc: "Diagnósticos de Supabase y Base de Datos",
    appointmentsLength: "Citas registradas",
    supabaseStatus: "Estado de Autenticación Supabase:",
    supabaseActive: "Sesión activa",
    supabaseInactive: "Sin sesión activa (modo invitado)",
    geminiActive: "Servicios Gemini AI Activos:",
    geminiActiveDesc: "La app enruta las consultas de triaje mediante una llamada server-side a gemini-3.5-flash.",
    resetDb: "Reiniciar base de datos local",
    appVersion: "Salud-Conecta IA • v1.0.0 PWA • 2026",
    back: "Volver",
    guideStep1Title: "Paso 1: Consulta Virtual",
    guideStep1Desc: "Cuéntale a la Inteligencia Artificial tus síntomas para recibir un pre-diagnóstico y recomendaciones personalizadas en segundos.",
    guideStep2Title: "Paso 2: Centros Médicos",
    guideStep2Desc: "Localiza hospitales, clínicas y farmacias en Granada, obteniendo sus ubicaciones exactas e información de contacto.",
    guideStep3Title: "Paso 3: Gestión de Citas",
    guideStep3Desc: "Agenda y mantén un control de tus próximas consultas médicas con especialistas desde el panel de citas.",
    guideStep4Title: "Paso 4: Emergencias 128",
    guideStep4Desc: "Usa el botón de emergencia rojo si estás ante un peligro vital para comunicarte directamente con la Cruz Roja de Granada."
  },
  en: {
    navHome: "Home",
    navConsulta: "AI Triage",
    navCentros: "Medical Centers",
    navBuscar: "Search / Appointments",
    navPremium: "Premium",
    navPerfil: "My Profile",
    welcome: "Welcome,",
    subtitle: "Your health, connected. Clear answers, safe decisions.",
    viewProfile: "View profile",
    aiTriage: "Consult with AI",
    aiTriageDesc: "Tell us how you feel",
    publicHealth: "Public Health",
    publicHealthDesc: "Official info and services",
    myAppointments: "My Appointments",
    myAppointmentsDesc: "Manage your upcoming appointments",
    infoProtected: "Your info is protected.",
    infoProtectedDesc: "Privacy and security first.",
    hello: "Hello",
    helloGranada: "I am your health assistant in Granada.",
    howFeel: "Tell me how you feel today.",
    hereToHelp: "I am here to help you.",
    describeSymptoms: "Describe your symptoms...",
    complyRegs: "We comply with international health standards.",
    emergencyCall: "Emergency Call",
    emergencyTitle: "Red Cross • Line 128",
    emergencyCallBtn: "Call 128 now",
    cancel: "Cancel",
    whenCall: "When should you call?",
    whenCallDesc1: "Severe breathing difficulty or choking.",
    whenCallDesc2: "Oppressive chest pain (suspected heart attack).",
    whenCallDesc3: "Loss of consciousness or seizures.",
    whenCallDesc4: "Severe accidents or uncontrolled bleeding.",
    whenTriage: "When to use AI Consultation instead?",
    whenTriageDesc1: "Moderate fever or flu symptoms.",
    whenTriageDesc2: "Mild body aches or sore throat.",
    whenTriageDesc3: "Queries about medication dosages or triage.",
    settingsTitle: "System Settings",
    settingsSubtitle: "Configure your preferences for Salud-Conecta IA",
    darkMode: "Dark Mode",
    darkModeDesc: "Toggle between light and dark theme",
    fontSize: "Font Size",
    fontSizeDesc: "Adjust application text size",
    fontSizeSmall: "Small",
    fontSizeMedium: "Medium",
    fontSizeLarge: "Large",
    language: "Language",
    languageDesc: "Select application language",
    languageEs: "Spanish",
    languageEn: "English",
    terms: "Terms & Conditions",
    termsDesc: "Terms of service and usage",
    privacy: "Privacy Policy",
    privacyDesc: "HIPAA / GDPR Compliance",
    userGuide: "User Guide",
    userGuideDesc: "Interactive app manual",
    devTools: "Developer Tools",
    devToolsDesc: "Supabase and Database diagnostics",
    appointmentsLength: "Registered appointments",
    supabaseStatus: "Supabase Authentication Status:",
    supabaseActive: "Active session",
    supabaseInactive: "No active session (guest mode)",
    geminiActive: "Active Gemini AI Services:",
    geminiActiveDesc: "The app routes triage consultations through a server-side call to gemini-3.5-flash.",
    resetDb: "Reset local database",
    appVersion: "Salud-Conecta IA • v1.0.0 PWA • 2026",
    back: "Back",
    guideStep1Title: "Step 1: Virtual Triage",
    guideStep1Desc: "Describe your symptoms to the AI to receive a pre-diagnosis and personalized recommendations in seconds.",
    guideStep2Title: "Step 2: Medical Centers",
    guideStep2Desc: "Locate hospitals, clinics, and pharmacies in Granada, getting their exact locations and contact info.",
    guideStep3Title: "Step 3: Appointment Booking",
    guideStep3Desc: "Schedule and keep track of your upcoming medical appointments with specialists from the appointments panel.",
    guideStep4Title: "Step 4: Emergency 128",
    guideStep4Desc: "Use the red emergency button if you face a life-threatening situation to contact the Granada Red Cross directly."
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const savedLang = localStorage.getItem("language");
      if (savedLang === "es" || savedLang === "en") {
        return savedLang;
      }
    } catch (e) {
      console.warn("localStorage reading is blocked:", e);
    }
    return "es"; // default is Spanish
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("language", lang);
    } catch (e) {
      console.warn("localStorage saving is blocked:", e);
    }
  };

  const t = (key: keyof Translations): string => {
    return translations[language][key] || translations["es"][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
