import React from "react";
import { UserProfile } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { motion } from "motion/react";
import { Settings } from "lucide-react";

interface HomeViewProps {
  user: UserProfile;
  onNavigate: (tab: "consulta" | "buscar" | "premium" | "perfil") => void;
  onOpenSettings: () => void;
}

export default function HomeView({ user, onNavigate, onOpenSettings }: HomeViewProps) {
  const { t } = useLanguage();
  const isGuest = user.id === "guest" || user.name === "Invitado";
  const firstName = isGuest ? t('guest') : user.name.split(" ")[0];

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* Background Decorators - Organic shapes */}
      <div
        className="absolute pointer-events-none z-0"
        style={{
          top: "-5%",
          right: "-10%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute pointer-events-none z-0"
        style={{
          bottom: "10%",
          left: "-10%",
          width: "450px",
          height: "450px",
          background: "radial-gradient(ellipse at center, rgba(37,99,235,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(50px)",
        }}
      />

      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="flex justify-between items-center px-6 pt-[env(safe-area-inset-top,44px)] pb-4 z-30 relative bg-transparent w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <img
            src="/app-logo-v1.jpg"
            alt="Logo"
            className="w-9 h-9 rounded-lg shadow-sm object-cover border border-slate-200/60 dark:border-slate-700/60"
          />
          <span className="font-bold text-[19px] tracking-[-0.02em] text-slate-900 dark:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            Salud-Conecta <span className="text-blue-600 dark:text-blue-400">IA</span>
          </span>
        </div>

        <button
          id="btn-settings"
          onClick={onOpenSettings}
          className="w-11 h-11 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all rounded-full active:scale-90 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-sm"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* ═══════════════ MAIN HERO CONTAINER ═══════════════ */}
      <main className="flex-1 px-6 pt-5 pb-10 max-w-6xl mx-auto w-full z-10 relative">

        {/* Welcome Section / Profile Header Area */}
        <div className="flex justify-between items-start md:items-center mb-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 p-6 md:p-10 rounded-[32px] md:rounded-[36px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] relative overflow-hidden group">
          {/* Inner Glow Decor */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4 group-hover:bg-blue-500/15 transition-colors duration-700"></div>

          <div className="flex-1 pr-4 relative z-10">
            <span className="text-slate-500 dark:text-slate-400 text-[17px] md:text-lg font-medium leading-[1.3] block">{t('welcome')},</span>
            <h2 className="text-blue-600 dark:text-blue-400 text-[40px] md:text-[48px] font-bold tracking-[-0.03em] leading-[1.1] mt-1 md:mt-2 drop-shadow-sm">
              {firstName}.
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-[14px] md:text-[15.5px] font-normal leading-relaxed mt-4 max-w-[240px] md:max-w-sm">
              {t('healthConnected')}<br className="md:hidden" />
              <span className="hidden md:inline"> </span>{t('clearAnswers')}<br className="md:hidden" />
              <span className="hidden md:inline"> </span>{t('safeDecisions')}
            </p>
          </div>

          {/* Avatar side */}
          <div className="flex flex-col items-center shrink-0 relative z-10">
            {/* Glossy ring avatar */}
            <div className="w-[104px] h-[104px] md:w-[120px] md:h-[120px] rounded-full p-[4px] bg-gradient-to-tr from-blue-600 via-cyan-400 to-blue-600 shadow-[0_8px_30px_rgba(29,78,216,0.25)] flex items-center justify-center relative transform md:hover:scale-105 transition-transform duration-300">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover border-[3px] border-white dark:border-slate-900"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold border-[3px] border-white dark:border-slate-900 shadow-inner select-none">
                  {user.name ? user.name.split(" ")[0].charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>
            {/* Pill style Ver perfil button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate("perfil")}
              className="mt-4 px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white font-semibold text-[13px] tracking-wide rounded-[100px] shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:bg-blue-700 dark:hover:bg-blue-600 transition-all border border-blue-500/50"
            >
              {t('viewProfile')}
            </motion.button>
          </div>
        </div>

        {/* ═══════════════ MAIN LIST MENU ITEMS ═══════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-4">

          {/* Card 1: Consulta con IA */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate("consulta")}
            className="w-full bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/80 rounded-[28px] p-5 lg:p-6 border border-slate-200/80 dark:border-slate-700/60 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-5 w-full relative z-10">
              {/* Icon box light blue */}
              <div className="w-[56px] h-[56px] lg:w-[64px] lg:h-[64px] rounded-[20px] bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-blue-100 dark:border-blue-800/50">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[26px] h-[26px] lg:w-[30px] lg:h-[30px]">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M8 10h.01" />
                  <path d="M12 10h.01" />
                  <path d="M16 10h.01" />
                </svg>
              </div>
              <div className="flex-1 lg:w-full">
                <h3 className="font-bold text-slate-900 dark:text-white text-[16px] lg:text-[18px] tracking-tight">{t('aiConsultation')}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[13px] lg:text-[14px] font-normal mt-1 lg:mt-2 lg:min-h-[44px] leading-relaxed">{t('howYouFeel')}</p>
              </div>
            </div>
            {/* Arrow key box */}
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800/60 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0 lg:absolute lg:bottom-6 lg:right-6 lg:opacity-0 lg:-translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px]">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </motion.button>

          {/* Card 2: Buscador */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate("buscar")}
            className="w-full bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/80 rounded-[28px] p-5 lg:p-6 border border-slate-200/80 dark:border-slate-700/60 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-5 w-full relative z-10">
              {/* Icon box light green */}
              <div className="w-[56px] h-[56px] lg:w-[64px] lg:h-[64px] rounded-[20px] bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[26px] h-[26px] lg:w-[30px] lg:h-[30px]">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div className="flex-1 lg:w-full">
                <h3 className="font-bold text-slate-900 dark:text-white text-[16px] lg:text-[18px] tracking-tight">Buscador</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[13px] lg:text-[14px] font-normal mt-1 lg:mt-2 lg:min-h-[44px] leading-relaxed">Encuentra hospitales, centros de salud, farmacias y médicos cerca de ti.</p>
              </div>
            </div>
            {/* Arrow key box */}
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0 lg:absolute lg:bottom-6 lg:right-6 lg:opacity-0 lg:-translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px]">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </motion.button>

          {/* Card 3: Security Shield Badge */}
          <div className="w-full bg-gradient-to-br from-slate-100 to-slate-200/50 dark:from-slate-900 dark:to-slate-800/90 rounded-[28px] p-5 lg:p-6 border border-slate-200/80 dark:border-slate-700/60 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start shadow-sm hover:shadow-lg transition-all text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-400/5 dark:bg-slate-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-5 w-full relative z-10">
              {/* Shield Icon Box */}
              <div className="w-[50px] h-[50px] lg:w-[64px] lg:h-[64px] rounded-full lg:rounded-[20px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px] lg:w-[28px] lg:h-[28px]">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" className="fill-slate-600/10 dark:fill-slate-400/10" />
                  <polyline points="9 11 12 14 22 4" strokeWidth="2.5" />
                </svg>
              </div>
              <div className="flex-1 lg:w-full">
                <h4 className="font-bold text-slate-900 dark:text-white text-[14px] lg:text-[17px] leading-tight">{t('infoProtected')}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-[12.5px] lg:text-[14px] font-normal mt-1 lg:mt-2 lg:min-h-[44px] leading-relaxed">{t('privacyFirst')}</p>
              </div>
            </div>
            {/* Padlock indicator */}
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 lg:absolute lg:bottom-6 lg:right-6 lg:opacity-30 group-hover:opacity-100 transition-opacity duration-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px]">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
