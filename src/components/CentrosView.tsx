import React, { useState } from "react";
import { HealthCenter } from "../types";
import { HEALTH_CENTERS } from "../data/medicalData";
import { useLanguage } from "../contexts/LanguageContext";
import { AlertTriangle, Phone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CentrosViewProps {
  onNavigate?: (tab: "home" | "consulta" | "centros" | "buscar" | "premium" | "perfil") => void;
  onTriggerEmergency?: () => void;
}

export default function CentrosView({ onNavigate, onTriggerEmergency }: CentrosViewProps) {
  const { t } = useLanguage();
  const [selectedCenter, setSelectedCenter] = useState<HealthCenter | null>(HEALTH_CENTERS[0]);
  const [activeFilter, setActiveFilter] = useState<"todos" | "hospital" | "centro" | "farmacia">("todos");
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const filteredCenters = HEALTH_CENTERS.filter((center) => {
    if (activeFilter === "hospital") return center.type.toLowerCase().includes("hospital");
    if (activeFilter === "centro") return center.type.toLowerCase().includes("centro") || center.type.toLowerCase().includes("clínica");
    return true;
  });

  // Determine marker type
  const getMarkerType = (center: HealthCenter) => {
    return center.type.toLowerCase().includes("hospital") ? "hospital" : "centro";
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 relative overflow-x-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="w-full max-w-6xl mx-auto">
        <header className="flex justify-between items-center px-6 z-30 relative bg-transparent" style={{ paddingTop: "max(env(safe-area-inset-top, 16px), 36px)", paddingBottom: "12px" }}>
          <div
            onClick={() => onNavigate && onNavigate("home")}
            className="flex items-center gap-2.5 cursor-pointer active:opacity-70 transition-opacity"
          >
            <div className="w-[34px] h-[34px] relative shrink-0">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M26.6667 13.3333C26.6667 20.6971 20.6971 26.6667 13.3333 26.6667C5.96954 26.6667 0 20.6971 0 13.3333C0 5.96954 5.96954 0 13.3333 0C20.6971 0 26.6667 5.96954 26.6667 13.3333Z" fill="#3b82f6" fillOpacity="0.12" />
                <path d="M40 26.6667C40 34.0305 34.0305 40 26.6667 40C19.3029 40 13.3333 34.0305 13.3333 26.6667C13.3333 19.3029 19.3029 13.3333 26.6667 13.3333C34.0305 13.3333 40 19.3029 40 26.6667Z" fill="#3b82f6" fillOpacity="0.12" />
                <path d="M26.6667 26.6667C26.6667 22.9566 25.1481 19.5992 22.6866 17.1378C20.2251 14.6763 16.8677 13.1577 13.1577 13.1577C13.0458 13.1577 12.9344 13.1594 12.8236 13.1627C14.0734 7.57508 19.0432 3.33333 25 3.33333C31.4427 3.33333 36.6667 8.55734 36.6667 15C36.6667 20.9568 32.4249 25.9266 26.8373 27.1764C26.8406 27.0656 26.8423 26.9542 26.8423 26.8423L26.6667 26.6667Z" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.3333 13.3333C13.3333 17.0434 14.8519 20.4008 17.3134 22.8622C19.7749 25.3237 23.1323 26.8423 26.8423 26.8423C26.9542 26.8423 27.0656 26.8406 27.1764 26.8373C25.9266 32.4249 20.9568 36.6667 15 36.6667C8.55734 36.6667 3.33333 31.4427 3.33333 25C3.33333 19.0432 7.57508 14.0734 13.1627 12.8236C13.2735 12.8269 13.3853 12.83 13.4981 12.8344L13.3333 13.3333Z" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-bold text-[19px] tracking-[-0.02em] text-slate-900 dark:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
              Salud-Conecta <span className="text-blue-500">IA</span>
            </span>
          </div>

          {/* Emergency button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onTriggerEmergency}
            className="relative flex flex-col items-center justify-center w-[50px] h-[50px] rounded-full overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              boxShadow: "0 6px 20px rgba(239,68,68,0.3)",
            }}
          >
            <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)" }} />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 mb-[1px]">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v10H2" />
              <circle cx="16.5" cy="17.5" r="2.5" />
              <circle cx="7.5" cy="17.5" r="2.5" />
              <path d="M10 10v4" />
              <path d="M8 12h4" />
            </svg>
            <span className="text-white text-[9px] font-bold relative z-10 leading-none">128</span>
          </motion.button>
        </header>
      </div>

      {/* ═══════════════ TITLE & LOCATION SELECTOR ═══════════════ */}
      <div className="px-6 pt-2 pb-3 z-10 relative w-full max-w-6xl mx-auto">
        <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-[-0.03em] leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
          {t('centros')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-[13px] mt-1.5 leading-relaxed max-w-[280px]">
          {t('findCenters')}<br />{t('nearYou')}.
        </p>

        {/* Location dropdown pill */}
        <div className="mt-4 inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 text-slate-500">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Granada, Nicaragua</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 ml-1">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:gap-8 max-w-6xl mx-auto w-full px-0 md:px-6 relative z-10 mt-2">
        {/* ═══════════════ MAP AREA ═══════════════ */}
        <div className="w-full md:w-1/2">
          <div
            className="relative overflow-hidden mx-3 md:mx-0 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800"
            style={{
              height: "340px",
              background: "linear-gradient(135deg, #e8f0fe 0%, #dce8f5 30%, #d4e3f2 60%, #cddcee 100%)",
              boxShadow: "inset 0 2px 10px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
            }}
          >
            {/* Map grid pattern */}
            <div className="absolute inset-0" style={{ background: "radial-gradient(rgba(148,163,184,0.15) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />

            {/* Water/lake area top-right */}
            <div className="absolute" style={{ top: "-20px", right: "-40px", width: "200px", height: "200px", background: "radial-gradient(ellipse at center, rgba(147,197,253,0.5) 0%, rgba(147,197,253,0.2) 50%, transparent 75%)", borderRadius: "60% 40% 55% 45% / 45% 60% 40% 55%", filter: "blur(8px)" }} />

            {/* Faint green patches for land */}
            <div className="absolute" style={{ top: "60%", left: "10%", width: "80px", height: "60px", background: "rgba(134,239,172,0.15)", borderRadius: "50%", filter: "blur(12px)" }} />
            <div className="absolute" style={{ top: "40%", left: "60%", width: "100px", height: "80px", background: "rgba(134,239,172,0.1)", borderRadius: "50%", filter: "blur(15px)" }} />

            {/* Road lines */}
            <div className="absolute" style={{ top: "45%", left: "0", right: "0", height: "1.5px", background: "rgba(148,163,184,0.2)" }} />
            <div className="absolute" style={{ top: "0", bottom: "0", left: "40%", width: "1.5px", background: "rgba(148,163,184,0.2)" }} />
            <div className="absolute" style={{ top: "0", bottom: "0", left: "65%", width: "1px", background: "rgba(148,163,184,0.12)" }} />
            <div className="absolute" style={{ top: "30%", left: "0", right: "0", height: "1px", background: "rgba(148,163,184,0.12)" }} />
            <div className="absolute" style={{ top: "70%", left: "0", right: "0", height: "1px", background: "rgba(148,163,184,0.12)" }} />

            {/* "Granada" text label on map */}
            <div className="absolute z-10 select-none pointer-events-none" style={{ top: "38%", left: "28%", transform: "translate(-50%, -50%)" }}>
              <span className="text-[16px] font-bold text-slate-700/20 dark:text-slate-300/20 tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>Granada</span>
            </div>

            {/* User location blue pulsing dot */}
            <div className="absolute z-20 select-none" style={{ top: "50%", left: "38%", transform: "translate(-50%, -50%)" }}>
              <span className="absolute inline-flex h-7 w-7 rounded-full bg-[#3b82f6]/30 animate-ping" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
              <div className="w-[14px] h-[14px] bg-[#2563eb] border-[2.5px] border-white rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)] relative z-10" />
            </div>

            {/* Map markers for health centers */}
            {filteredCenters.map((hc) => {
              const isSelected = selectedCenter?.id === hc.id;
              const markerType = getMarkerType(hc);

              return (
                <button
                  key={hc.id}
                  onClick={() => setSelectedCenter(hc)}
                  className="absolute z-20 transition-all duration-200"
                  style={{
                    top: `${hc.lat}%`,
                    left: `${hc.lng}%`,
                    transform: `translate(-50%, -50%) scale(${isSelected ? 1.15 : 1})`,
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-full transition-all"
                    style={{
                      width: markerType === "hospital" ? "36px" : "30px",
                      height: markerType === "hospital" ? "36px" : "30px",
                      background: isSelected
                        ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                        : markerType === "hospital"
                          ? "#ffffff"
                          : "#ffffff",
                      border: isSelected ? "2.5px solid #ffffff" : "2px solid " + (markerType === "hospital" ? "#93c5fd" : "#cbd5e1"),
                      boxShadow: isSelected
                        ? "0 4px 16px rgba(37,99,235,0.35)"
                        : "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  >
                    {markerType === "hospital" ? (
                      <span className={`text-[13px] font-bold ${isSelected ? "text-white" : "text-[#2563eb]"}`}>H</span>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke={isSelected ? "white" : "#64748b"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Selected center tooltip / info popup */}
            <AnimatePresence>
              {selectedCenter && (
                <motion.div
                  key={selectedCenter.id}
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-30"
                  style={{ top: "12px", right: "12px", left: "45%", maxWidth: "200px" }}
                >
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-[0_8px_24px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-800">
                    <h4 className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">{selectedCenter.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{selectedCenter.type}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[10px] font-medium text-[#10b981]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block" />
                        {selectedCenter.schedule.split("·")[0].trim()}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{selectedCenter.distance}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Map controls (GPS + Filter) */}
            <div className="absolute right-3 flex flex-col gap-2 z-20" style={{ bottom: "16px" }}>
              <button className="w-10 h-10 bg-white dark:bg-slate-900 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.08)] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 active:scale-95 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="2" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="22" y2="12" />
                </svg>
              </button>
              <button className="w-10 h-10 bg-white dark:bg-slate-900 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.08)] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 active:scale-95 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════ LIST SECTION ═══════════════ */}
        <div className="w-full md:w-1/2 px-6 md:px-0 pt-6 md:pt-0 z-10 relative flex-1 flex flex-col">
          {/* Section header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>{t('nearYou')}</h3>
            <button className="text-[13px] font-semibold text-blue-600 dark:text-blue-400">{t('all')}</button>
          </div>

          {/* Center list */}
          <div className="space-y-3">
            {filteredCenters.slice(0, 3).map((hc) => {
              const isHospital = hc.type.toLowerCase().includes("hospital");
              const isSelected = selectedCenter?.id === hc.id;

              return (
                <motion.button
                  key={hc.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCenter(hc)}
                  className={`w-full text-left flex items-center justify-between rounded-[20px] px-4 py-3.5 transition-all bg-white dark:bg-slate-900 ${
                    isSelected ? "border-1.5 border-blue-600/20" : "border-1.5 border-slate-100 dark:border-slate-800"
                  }`}
                  style={{
                    boxShadow: isSelected ? "0 4px 16px rgba(37,99,235,0.06)" : "0 1px 4px rgba(0,0,0,0.02)",
                  }}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Icon marker circle */}
                    <div
                      className="w-[44px] h-[44px] rounded-[14px] flex items-center justify-center shrink-0"
                      style={{
                        background: isHospital ? "#eff6ff" : "#f0fdf4",
                        border: isHospital ? "1.5px solid #dbeafe" : "1.5px solid #dcfce7",
                      }}
                    >
                      {isHospital ? (
                        <span className="text-[16px] font-bold text-[#2563eb]">H</span>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px]">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      )}
                    </div>

                    {/* Text content */}
                    <div className="min-w-0">
                      <h4 className="text-[14px] font-semibold text-slate-900 dark:text-white leading-tight truncate">{hc.name}</h4>
                      <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-0.5">{hc.type}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="w-[5px] h-[5px] rounded-full bg-[#10b981] inline-block" />
                        <span className="text-[10.5px] font-medium text-[#10b981]">{hc.schedule}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - distance & time */}
                  <div className="shrink-0 text-right ml-3 flex flex-col items-end gap-0.5">
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{hc.distance}</span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {hc.durationMin} min
                    </span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-0.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════ BOTTOM ACTION BAR ═══════════════ */}
      <div className="px-5 py-4 mt-4 z-10 relative w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          {/* Emergency call button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onTriggerEmergency}
            className="flex items-center gap-2.5 bg-white dark:bg-slate-900 rounded-full px-4 py-3 border border-red-200 dark:border-red-900/30 shadow-[0_2px_8px_rgba(239,68,68,0.06)]"
          >
            <div className="w-8 h-8 rounded-full bg-[#fee2e2] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-[12px] font-bold text-red-500 block leading-tight">{t('emergencies247')}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t('call128')}</span>
            </div>
          </motion.button>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveFilter(activeFilter === "hospital" ? "todos" : "hospital")}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-[11px] font-semibold transition-all ${activeFilter === "hospital"
                ? "bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)]"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                }`}
            >
              <span className={`text-[10px] font-bold ${activeFilter === "hospital" ? "text-white" : "text-blue-600"}`}>H</span>
              {t('hospitals')}
            </button>
            <button
              onClick={() => setActiveFilter(activeFilter === "centro" ? "todos" : "centro")}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-[11px] font-semibold transition-all ${activeFilter === "centro"
                ? "bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.25)]"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t('centers')}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════ EMERGENCY CONFIRMATION MODAL ═══════════════ */}
      <AnimatePresence>
        {isEmergencyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 font-sans"
            >
              <div className="p-7 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-red-100 shadow-inner">
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">¿Es una emergencia?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                  Llama de inmediato al 128 si presentas:
                </p>

                <ul className="mt-4 space-y-2.5 text-left bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                  {[
                    "Dolor o presión en el pecho",
                    "Dificultad severa para respirar",
                    "Confusión o pérdida del conocimiento",
                    "Convulsiones o parálisis súbita"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="grid grid-cols-2 gap-3 mt-7">
                  <button
                    onClick={() => setIsEmergencyModalOpen(false)}
                    className="py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs transition-colors active:scale-95"
                  >
                    Cancelar
                  </button>
                  <a
                    href="tel:128"
                    onClick={() => setTimeout(() => setIsEmergencyModalOpen(false), 500)}
                    className="py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all active:scale-95"
                  >
                    <Phone className="w-4 h-4 fill-current" />
                    Llamar al 128
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
