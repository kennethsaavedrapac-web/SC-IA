import React from "react";
import { UserProfile } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { motion } from "motion/react";
import { Settings } from "lucide-react";

interface HomeViewProps {
  user: UserProfile;
  onNavigate: (tab: "consulta" | "centros" | "buscar" | "premium" | "perfil") => void;
  onOpenSettings: () => void;
}

export default function HomeView({ user, onNavigate, onOpenSettings }: HomeViewProps) {
  const { t } = useLanguage();
  const isGuest = user.id === "guest" || user.name === "Invitado";
  const firstName = isGuest ? t('guest') : user.name.split(" ")[0];

  return (
    <div className="flex flex-col min-h-screen pb-24 relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* Background Decorators - Organic shapes */}
      <div
        className="absolute pointer-events-none z-0"
        style={{
          top: "-5%",
          right: "-10%",
          width: "360px",
          height: "360px",
          background: "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute pointer-events-none z-0"
        style={{
          bottom: "20%",
          left: "-10%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(ellipse at center, rgba(37,99,235,0.04) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(50px)",
        }}
      />

      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="flex justify-between items-center px-6 pt-[env(safe-area-inset-top,44px)] pb-4 z-30 relative bg-transparent w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] relative shrink-0">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M26.6667 13.3333C26.6667 20.6971 20.6971 26.6667 13.3333 26.6667C5.96954 26.6667 0 20.6971 0 13.3333C0 5.96954 5.96954 0 13.3333 0C20.6971 0 26.6667 5.96954 26.6667 13.3333Z" fill="#1d4ed8" fillOpacity="0.2" />
              <path d="M40 26.6667C40 34.0305 34.0305 40 26.6667 40C19.3029 40 13.3333 34.0305 13.3333 26.6667C13.3333 19.3029 19.3029 13.3333 26.6667 13.3333C34.0305 13.3333 40 19.3029 40 26.6667Z" fill="#1d4ed8" fillOpacity="0.2" />
              <path d="M26.6667 26.6667C26.6667 22.9566 25.1481 19.5992 22.6866 17.1378C20.2251 14.6763 16.8677 13.1577 13.1577 13.1577C13.0458 13.1577 12.9344 13.1594 12.8236 13.1627C14.0734 7.57508 19.0432 3.33333 25 3.33333C31.4427 3.33333 36.6667 8.55734 36.6667 15C36.6667 20.9568 32.4249 25.9266 26.8373 27.1764C26.8406 27.0656 26.8423 26.9542 26.8423 26.8423L26.6667 26.6667Z" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.3333 13.3333C13.3333 17.0434 14.8519 20.4008 17.3134 22.8622C19.7749 25.3237 23.1323 26.8423 26.8423 26.8423C26.9542 26.8423 27.0656 26.8406 27.1764 26.8373C25.9266 32.4249 20.9568 36.6667 15 36.6667C8.55734 36.6667 3.33333 31.4427 3.33333 25C3.33333 19.0432 7.57508 14.0734 13.1627 12.8236C13.2735 12.8269 13.3853 12.83 13.4981 12.8344L13.3333 13.3333Z" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-bold text-[19px] tracking-[-0.02em] text-slate-900 dark:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            Salud-Conecta <span className="text-blue-600 dark:text-blue-400">IA</span>
          </span>
        </div>

        <button
          id="btn-settings"
          onClick={onOpenSettings}
          className="w-11 h-11 flex items-center justify-center text-[#556982] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white transition-all rounded-full active:scale-90 bg-white/40 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          <Settings className="w-6 h-6" />
        </button>
      </header>

      {/* ═══════════════ MAIN HERO CONTAINER ═══════════════ */}
      <main className="flex-1 px-6 pt-5 max-w-6xl mx-auto w-full z-10 relative">

        {/* Welcome Section / Profile Header Area */}
        <div className="flex justify-between items-start md:items-center mb-9 md:bg-white/60 dark:md:bg-slate-900/60 md:backdrop-blur-xl md:border md:border-slate-200/60 dark:md:border-slate-800/60 md:p-10 md:rounded-[36px] md:shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative overflow-hidden group">
          {/* Desktop Inner Glow Decor */}
          <div className="hidden md:block absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4 group-hover:bg-blue-500/10 transition-colors duration-700"></div>

          <div className="flex-1 pr-4 relative z-10">
            <span className="text-slate-500 dark:text-slate-400 text-[17px] md:text-lg font-medium leading-[1.3] block">{t('welcome')},</span>
            <h2 className="text-blue-600 dark:text-blue-400 text-[40px] md:text-[48px] font-bold tracking-[-0.03em] leading-[1.1] mt-1 md:mt-2">
              {firstName}.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-[14px] md:text-[15.5px] font-normal leading-relaxed mt-4 max-w-[240px] md:max-w-sm">
              {t('healthConnected')}<br className="md:hidden" />
              <span className="hidden md:inline"> </span>{t('clearAnswers')}<br className="md:hidden" />
              <span className="hidden md:inline"> </span>{t('safeDecisions')}
            </p>
          </div>

          {/* Avatar side */}
          <div className="flex flex-col items-center shrink-0 relative z-10">
            {/* Glossy ring avatar */}
            <div className="w-[104px] h-[104px] md:w-[120px] md:h-[120px] rounded-full p-[3px] bg-gradient-to-tr from-[#1d4ed8] via-[#06b6d4] to-[#1d4ed8] shadow-[0_8px_30px_rgba(29,78,216,0.15)] flex items-center justify-center relative transform md:hover:scale-105 transition-transform duration-300">
              <img
                src={user.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                alt={user.name}
                className="w-full h-full rounded-full object-cover border-[3px] border-white"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Pill style Ver perfil button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate("perfil")}
              className="mt-3.5 px-5 py-2.5 bg-[#0272b7] text-white font-semibold text-[13px] tracking-wide rounded-[100px] shadow-[0_4px_12px_rgba(2,114,183,0.25)] hover:bg-[#02629d] transition-all"
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
            className="w-full bg-white dark:bg-slate-900 rounded-[24px] p-4.5 lg:p-6 border border-slate-100 dark:border-slate-800 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all text-left group relative overflow-hidden"
          >
            <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-5 w-full relative z-10">
              {/* Icon box light blue */}
              <div className="w-[54px] h-[54px] lg:w-[60px] lg:h-[60px] rounded-[18px] lg:rounded-[20px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[24px] h-[24px] lg:w-[28px] lg:h-[28px]">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M8 10h.01" />
                  <path d="M12 10h.01" />
                  <path d="M16 10h.01" />
                </svg>
              </div>
              <div className="flex-1 lg:w-full">
                <h3 className="font-bold text-slate-900 dark:text-white text-[15.5px] lg:text-[17px] tracking-tight">{t('aiConsultation')}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[12.5px] lg:text-[13.5px] font-normal mt-0.5 lg:mt-1.5 lg:min-h-[40px]">{t('howYouFeel')}</p>
              </div>
            </div>
            {/* Arrow key box */}
            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 lg:absolute lg:bottom-6 lg:right-6 lg:opacity-0 lg:-translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </motion.button>

          {/* Card 2: Hospitales y centros de salud */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate("centros")}
            className="w-full bg-white dark:bg-slate-900 rounded-[24px] p-4.5 lg:p-6 border border-slate-100 dark:border-slate-800 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all text-left group relative overflow-hidden"
          >
            <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-5 w-full relative z-10">
              {/* Icon box light green */}
              <div className="w-[54px] h-[54px] lg:w-[60px] lg:h-[60px] rounded-[18px] lg:rounded-[20px] bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[24px] h-[24px] lg:w-[28px] lg:h-[28px]">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <div className="flex-1 lg:w-full">
                <h3 className="font-bold text-slate-900 dark:text-white text-[15.5px] lg:text-[17px] tracking-tight">{t('publicHealth')}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[12.5px] lg:text-[13.5px] font-normal mt-0.5 lg:mt-1.5 lg:min-h-[40px]">{t('officialServices')}</p>
              </div>
            </div>
            {/* Arrow key box */}
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 lg:absolute lg:bottom-6 lg:right-6 lg:opacity-0 lg:-translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </motion.button>

          {/* Card 3: Buscar */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate("buscar")}
            className="w-full bg-white dark:bg-slate-900 rounded-[24px] p-4.5 lg:p-6 border border-slate-100 dark:border-slate-800 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all text-left group relative overflow-hidden"
          >
            <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-5 w-full relative z-10">
              {/* Icon box light purple */}
              <div className="w-[54px] h-[54px] lg:w-[60px] lg:h-[60px] rounded-[18px] lg:rounded-[20px] bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[24px] h-[24px] lg:w-[28px] lg:h-[28px]">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div className="flex-1 lg:w-full">
                <h3 className="font-bold text-slate-900 dark:text-white text-[15.5px] lg:text-[17px] tracking-tight">{t('myAppointments')}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[12.5px] lg:text-[13.5px] font-normal mt-0.5 lg:mt-1.5 lg:min-h-[40px]">{t('manageAppointments')}</p>
              </div>
            </div>
            {/* Arrow key box */}
            <div className="w-9 h-9 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 lg:absolute lg:bottom-6 lg:right-6 lg:opacity-0 lg:-translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </motion.button>

          {/* Card 4: Security Shield Badge */}
          <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-[24px] p-4.5 lg:p-6 border border-slate-100 dark:border-slate-800 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all text-left relative overflow-hidden group">
            <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-5 w-full relative z-10">
              {/* Shield Icon Box */}
              <div className="w-[48px] h-[48px] lg:w-[60px] lg:h-[60px] rounded-full lg:rounded-[20px] bg-white dark:bg-slate-900 border border-blue-50 dark:border-blue-900/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px] lg:w-[26px] h-[26px]">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" className="fill-blue-600/10 dark:fill-blue-400/10" />
                  <polyline points="9 11 12 14 22 4" strokeWidth="2.5" />
                </svg>
              </div>
              <div className="flex-1 lg:w-full">
                <h4 className="font-bold text-slate-900 dark:text-white text-[13.5px] lg:text-[16px] leading-tight">{t('infoProtected')}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-[12px] lg:text-[13.5px] font-normal mt-0.5 lg:mt-1.5 lg:min-h-[40px]">{t('privacyFirst')}</p>
              </div>
            </div>
            {/* Blue padlock lock circle indicator */}
            <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 lg:absolute lg:bottom-6 lg:right-6 lg:opacity-30 group-hover:opacity-100 transition-opacity duration-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
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
