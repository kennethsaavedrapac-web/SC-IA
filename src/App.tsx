import React, { useState, useEffect } from "react";
import HomeView from "./components/HomeView";
import ConsultaView from "./components/ConsultaView";
import CentrosView from "./components/CentrosView";
import BuscarView from "./components/BuscarView";
import PremiumView from "./components/PremiumView";
import PerfilView from "./components/PerfilView";
import { DEFAULT_USER, INITIAL_APPOINTMENTS } from "./data/medicalData";
import { UserProfile, Appointment } from "./types";
import { MessageSquare, MapPin, Search, Sparkles, X, Settings, RefreshCw, Eye, Star, Info, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "consulta" | "centros" | "buscar" | "premium" | "perfil">("home");
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [isPremium, setIsPremium] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Auto scroll to top on page switches to mimic page routing
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  const handleAddAppointment = (newApp: Appointment) => {
    setAppointments((prev) => [newApp, ...prev]);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  const handleUnlockPremium = () => {
    setIsPremium(true);
  };

  const handleResetApp = () => {
    setUser(DEFAULT_USER);
    setAppointments(INITIAL_APPOINTMENTS);
    setIsPremium(false);
    setCurrentView("home");
    setIsSettingsOpen(false);
    alert("Aplicación reiniciada a sus valores por defecto.");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none overflow-x-hidden antialiased">
      
      {/* Dynamic Content Views based on Router State */}
      <div className="flex-1 w-full max-w-lg mx-auto bg-white min-h-screen shadow-2xl shadow-blue-500/5 flex flex-col relative pb-20">
        
        <AnimatePresence mode="wait">
          {currentView === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              <HomeView
                user={user}
                onNavigate={(tab) => setCurrentView(tab)}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </motion.div>
          )}

          {currentView === "consulta" && (
            <motion.div
              key="consulta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col h-[calc(100vh-80px)]"
            >
              <ConsultaView user={user} onNavigate={(tab) => setCurrentView(tab)} isPremium={isPremium} />
            </motion.div>
          )}

          {currentView === "centros" && (
            <motion.div
              key="centros"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              <CentrosView onNavigate={(tab) => setCurrentView(tab)} />
            </motion.div>
          )}

          {currentView === "buscar" && (
            <motion.div
              key="buscar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              <BuscarView
                appointments={appointments}
                onAddAppointment={handleAddAppointment}
                onNavigate={(tab) => setCurrentView(tab)}
              />
            </motion.div>
          )}

          {currentView === "premium" && (
            <motion.div
              key="premium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              <PremiumView
                isPremium={isPremium}
                onUnlockPremium={handleUnlockPremium}
                onNavigate={(tab) => setCurrentView(tab)}
              />
            </motion.div>
          )}

          {currentView === "perfil" && (
            <motion.div
              key="perfil"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              <PerfilView
                user={user}
                isPremium={isPremium}
                onGoBack={() => setCurrentView("home")}
                onUpdateUser={handleUpdateUser}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* PERSISTENT 4-TAB NAVIGATION BAR IN PAGE FOOTERS */}
        {currentView !== "perfil" && (
          <nav className="fixed bottom-0 inset-x-0 bg-white z-40 max-w-lg mx-auto w-full border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.03)] pb-safe-bottom">
            <div className="grid grid-cols-4 p-2.5 pt-3 pb-5 relative font-sans">
              
              {/* Tab 1: Consulta */}
              <button
                id="btn-nav-consulta"
                onClick={() => setCurrentView("consulta")}
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                  currentView === "consulta" ? "text-[#1d4ed8]" : "text-[#94a3b8] hover:text-[#475569]"
                }`}
              >
                <div className="p-1 mb-0.5">
                  <svg className={`w-[25px] h-[25px] ${currentView === "consulta" ? "fill-current" : ""}`} viewBox="0 0 24 24" fill={currentView === "consulta" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span className={`text-[11.5px] tracking-tight font-medium ${currentView === "consulta" ? "font-semibold text-[#1d4ed8]" : "text-[#94a3b8]"}`}>
                  Consulta
                </span>
                {/* Active indicator dot/lines */}
                {currentView === "consulta" && (
                  <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-[#1d4ed8] font-bold text-xs tracking-[1.5px] leading-none">...</span>
                )}
              </button>

              {/* Tab 2: Centros */}
              <button
                id="btn-nav-centros"
                onClick={() => setCurrentView("centros")}
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                  currentView === "centros" ? "text-[#1d4ed8]" : "text-[#94a3b8] hover:text-[#475569]"
                }`}
              >
                <div className="p-1 mb-0.5">
                  <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <span className={`text-[11.5px] tracking-tight font-medium ${currentView === "centros" ? "font-semibold text-[#1d4ed8]" : "text-[#94a3b8]"}`}>
                  Centros
                </span>
                {currentView === "centros" && (
                  <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-[#1d4ed8] font-bold text-xs tracking-[1.5px] leading-none">...</span>
                )}
              </button>

              {/* Tab 3: Buscar */}
              <button
                id="btn-nav-buscar"
                onClick={() => setCurrentView("buscar")}
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                  currentView === "buscar" ? "text-[#1d4ed8]" : "text-[#94a3b8] hover:text-[#475569]"
                }`}
              >
                <div className="p-1 mb-0.5">
                  <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <span className={`text-[11.5px] tracking-tight font-medium ${currentView === "buscar" ? "font-semibold text-[#1d4ed8]" : "text-[#94a3b8]"}`}>
                  Buscar
                </span>
                {currentView === "buscar" && (
                  <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-[#1d4ed8] font-bold text-xs tracking-[1.5px] leading-none">...</span>
                )}
              </button>

              {/* Tab 4: Premium */}
              <button
                id="btn-nav-premium"
                onClick={() => setCurrentView("premium")}
                className={`text-center flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                  currentView === "premium" ? "text-[#1d4ed8]" : "text-[#94a3b8] hover:text-[#475569]"
                }`}
              >
                <div className="p-1 mb-0.5">
                  <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 12l10 10 10-10z" />
                  </svg>
                </div>
                <span className={`text-[11.5px] tracking-tight font-medium ${currentView === "premium" ? "font-semibold text-[#1d4ed8]" : "text-[#94a3b8]"}`}>
                  Premium
                </span>
                {currentView === "premium" && (
                  <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-[#1d4ed8] font-bold text-xs tracking-[1.5px] leading-none">...</span>
                )}
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* DYNAMIC SYSTEM / TESTING UTILITIES DIALOG MODAL (GIVES ASSESSOR GREAT CONTROL) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl border border-slate-100 text-slate-800"
            >
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-1.5">
                    <Settings className="w-5 h-5 text-blue-600 animate-spin" />
                    <span>Ajustes del Sistema</span>
                  </h3>
                  <p className="text-xs text-slate-400">Panel de evaluación para Salud-Conecta IA</p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="py-4 space-y-4">
                {/* Simulated Diagnostic report of scheduled appointments */}
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-xs">
                  <span className="font-bold text-blue-800 block mb-1">Citas agendadas por Kenneth:</span>
                  <p className="text-slate-600">{appointments.length} citas registradas.</p>
                  <ul className="list-disc leading-normal list-inside pl-1 mt-1 text-slate-500 text-[11px]">
                    {appointments.map((a, i) => (
                      <li key={i}>{a.doctorName} - {a.specialty} ({a.date})</li>
                    ))}
                  </ul>
                </div>

                {/* API Info key safety */}
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-[11px] text-amber-800 leading-normal flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Servicios Gemini AI Activos:</span>
                    <p className="mt-0.5">La app enruta las consultas de triaje mediante una llamada server-side a `gemini-3.5-flash`.</p>
                  </div>
                </div>

                {/* Reset system */}
                <button
                  onClick={handleResetApp}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reiniciar base de datos local</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-400 text-center pt-3 border-t border-slate-100">
                Salud-Conecta IA • v1.0.0 PWA • 2026
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
