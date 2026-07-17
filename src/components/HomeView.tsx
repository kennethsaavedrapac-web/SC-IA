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
    <div className="flex flex-col min-h-dvh relative overflow-x-hidden transition-colors duration-300">

      { }
      <header className="flex justify-between items-center px-6 pt-[env(safe-area-inset-top,44px)] pb-4 z-30 relative bg-transparent w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <img
            src="/app-logo-v2.jpg"
            alt="Logo"
            className="w-9 h-9 rounded-lg shadow-sm object-cover border border-slate-200/60 dark:border-slate-700/60"
          />
          <span className="font-bold text-[19px] tracking-[-0.02em] text-slate-900 dark:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            Salud-Conecta <span className="text-brand-600 dark:text-brand-400">IA</span>
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

      { }
      <main className="flex-1 px-6 pt-5 pb-10 max-w-6xl mx-auto w-full z-10 relative">

        { }
        <div className="home-welcome-card flex justify-between items-start md:items-center mb-8 dark:bg-slate-900/70 backdrop-blur-xl border border-white/70 dark:border-slate-800/50 p-5 sm:p-6 md:p-10 rounded-[28px] md:rounded-[36px] shadow-[0_8px_32px_rgba(15,23,42,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] relative overflow-hidden group">

          <div className="flex-1 pr-2 sm:pr-4 relative z-10 min-w-0">
            <span className="text-slate-500 dark:text-slate-400 text-[16px] md:text-lg font-medium leading-[1.3] block truncate">{t('welcome')},</span>
            <h2 className="text-brand-600 dark:text-brand-400 text-[32px] sm:text-[40px] md:text-[48px] font-bold tracking-[-0.03em] leading-[1.1] mt-1 md:mt-2 drop-shadow-sm break-words">
              {firstName}.
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-[13px] md:text-[15.5px] font-normal leading-relaxed mt-3 md:mt-4 max-w-[200px] sm:max-w-[240px] md:max-w-sm">
              {t('healthConnected')}<br className="md:hidden" />
              <span className="hidden md:inline"> </span>{t('clearAnswers')}<br className="md:hidden" />
              <span className="hidden md:inline"> </span>{t('safeDecisions')}
            </p>
          </div>

          { }
          <div className="flex flex-col items-center shrink-0 relative z-10 ml-2">
            { }
            <div className="health-avatar-ring w-[84px] h-[84px] sm:w-[104px] sm:h-[104px] md:w-[120px] md:h-[120px] rounded-full p-[5px] sm:p-[6px] flex items-center justify-center relative">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="relative z-10 w-full h-full rounded-full object-cover border-[3px] border-white dark:border-slate-900"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-brand-700 flex items-center justify-center text-white text-4xl font-bold border-[3px] border-white dark:border-slate-900 shadow-inner select-none">
                  {user.name ? user.name.split(" ")[0].charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>
            { }
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate("perfil")}
              className="mt-4 px-5 py-2.5 gradient-accent text-white font-semibold text-[13px] tracking-wide rounded-[100px] shadow-[0_4px_14px_rgba(0,212,170,0.3)] hover:brightness-110 transition-all border border-transparent"
            >
              {t('viewProfile')}
            </motion.button>
          </div>
        </div>

        { }
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-4">

          { }
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate("consulta")}
            className="w-full bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/80 rounded-[28px] p-5 lg:p-6 border border-slate-200/80 dark:border-slate-700/60 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/5 dark:bg-brand-400/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-5 w-full relative z-10">
              { }
              <div className="w-[56px] h-[56px] lg:w-[64px] lg:h-[64px] rounded-[20px] bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/40 dark:to-brand-900/40 flex items-center justify-center shrink-0 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-brand-100 dark:border-brand-900/50">
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
            { }
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/60 flex items-center justify-center text-brand-900 dark:text-brand-200 shrink-0 lg:absolute lg:bottom-6 lg:right-6 lg:opacity-0 lg:-translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px]">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </motion.button>

          { }
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate("buscar")}
            className="w-full bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/80 rounded-[28px] p-5 lg:p-6 border border-slate-200/80 dark:border-slate-700/60 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-5 w-full relative z-10">
              { }
              <div className="w-[56px] h-[56px] lg:w-[64px] lg:h-[64px] rounded-[20px] bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[26px] h-[26px] lg:w-[30px] lg:h-[30px]">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div className="flex-1 lg:w-full">
                <h3 className="font-bold text-slate-900 dark:text-white text-[16px] lg:text-[18px] tracking-tight">{t('buscar')}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[13px] lg:text-[14px] font-normal mt-1 lg:mt-2 lg:min-h-[44px] leading-relaxed">{t('homeSearchDesc')}</p>
              </div>
            </div>
            { }
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0 lg:absolute lg:bottom-6 lg:right-6 lg:opacity-0 lg:-translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px]">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </motion.button>

          { }
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = 'tel:128'}
            className="w-full bg-gradient-to-br from-white to-rose-50/50 dark:from-slate-900 dark:to-slate-800/80 rounded-[28px] p-5 lg:p-6 border border-rose-200/80 dark:border-rose-900/40 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 dark:bg-rose-400/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-5 w-full relative z-10">
              { }
              <div className="w-[56px] h-[56px] lg:w-[64px] lg:h-[64px] rounded-[20px] bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/40 dark:to-rose-800/40 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-rose-100 dark:border-rose-800/50">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[26px] h-[26px] lg:w-[30px] lg:h-[30px]">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className="flex-1 lg:w-full">
                <h3 className="font-bold text-slate-900 dark:text-white text-[16px] lg:text-[18px] tracking-tight">{t('emergencyCard')}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[13px] lg:text-[14px] font-normal mt-1 lg:mt-2 lg:min-h-[44px] leading-relaxed">{t('homeEmergDesc')}</p>
              </div>
            </div>
            { }
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-800/60 flex items-center justify-center text-rose-700 dark:text-rose-300 shrink-0 lg:absolute lg:bottom-6 lg:right-6 lg:opacity-0 lg:-translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px]">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </motion.button>

        </div>

      </main>

    </div>
  );
}
