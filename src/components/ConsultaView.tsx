import React, { useState, useRef, useEffect } from "react";
import { UserProfile, ChatMessage } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { motion, AnimatePresence } from "motion/react";

interface ConsultaViewProps {
  user: UserProfile;
  onNavigate?: (tab: "home" | "consulta" | "centros" | "buscar" | "premium" | "perfil") => void;
  isPremium?: boolean;
  onTriggerEmergency?: () => void;
}

const SYMPTOM_CHIPS = [
  {
    id: "fiebre",
    label: "Fiebre",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]" stroke="currentColor">
        <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
      </svg>
    ),
  },
  {
    id: "dolor-cabeza",
    label: "Dolor de cabeza",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]" stroke="currentColor">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4" />
        <path d="M9.5 14.5l1.5-1.5" />
        <path d="M14.5 14.5l-1.5-1.5" />
        <path d="M8 10l2 1" />
        <path d="M16 10l-2 1" />
      </svg>
    ),
  },
  {
    id: "tos",
    label: "Tos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]" stroke="currentColor">
        <path d="M18 8c0-3.3-2.7-6-6-6S6 4.7 6 8c0 3 2 5.1 4 6v2h4v-2c2-.9 4-3 4-6Z" />
        <path d="M10 16v2a2 2 0 0 0 4 0v-2" />
        <circle cx="9" cy="21" r="1" />
        <circle cx="15" cy="21" r="1" />
      </svg>
    ),
  },
  {
    id: "nauseas",
    label: "Náuseas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]" stroke="currentColor">
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9" />
        <path d="M12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9" />
        <path d="M3 12h18" />
        <path d="M8 8c.5-.3 1-.5 1.5-.5S11 8 11 8" />
        <path d="M13 8c.5-.3 1-.5 1.5-.5S16 8 16 8" />
        <path d="M9 15c.6.8 1.5 1.5 3 1.5s2.4-.7 3-1.5" />
      </svg>
    ),
  },
  {
    id: "dolor-garganta",
    label: "Dolor de garganta",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]" stroke="currentColor">
        <path d="M12 2a5 5 0 0 0-5 5v4a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z" />
        <path d="M12 18v2M9 15h6M6 11h12" />
      </svg>
    ),
  },
  {
    id: "congestion-nasal",
    label: "Congestión nasal",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]" stroke="currentColor">
        <path d="M12 3c-1.2 0-2.4.5-3.2 1.3L4 9v4c0 3 2.5 5.5 5.5 5.5h5c3 0 5.5-2.5 5.5-5.5V9l-4.8-4.7C14.4 3.5 13.2 3 12 3Z" />
        <path d="M9 12h6M12 9v6" />
      </svg>
    ),
  },
  {
    id: "cansancio",
    label: "Cansancio",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]" stroke="currentColor">
        <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
        <line x1="22" y1="11" x2="22" y2="13" />
        <line x1="6" y1="10" x2="6" y2="14" />
        <line x1="9" y1="10" x2="9" y2="14" />
      </svg>
    ),
  },
  {
    id: "dolor-muscular",
    label: "Dolor muscular",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]" stroke="currentColor">
        <path d="M6.5 6.5h11M6.5 12h11M6.5 17.5h11" />
        <path d="m3 21 18-18" />
      </svg>
    ),
  },
  {
    id: "dificultad-respirar",
    label: "Falta de aire",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]" stroke="currentColor">
        <path d="M12 2v6M12 16v6M4.9 4.9l4.3 4.3M14.8 14.8l4.3 4.3M2 12h6M16 12h6M4.9 19.1l4.3-4.3M14.8 9.2l4.3-4.3" />
      </svg>
    ),
  },
];

export default function ConsultaView({ user, onNavigate, onTriggerEmergency }: ConsultaViewProps) {
  const { t } = useLanguage();
  const [activeChip, setActiveChip] = useState("fiebre");
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // --- CHAT STATE ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Carousel scroll ref and state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftVal, setScrollLeftVal] = useState(0);
  const [dragMoved, setDragMoved] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (el) {
      setShowLeftArrow(el.scrollLeft > 5);
      const maxScroll = el.scrollWidth - el.clientWidth;
      setShowRightArrow(el.scrollLeft < maxScroll - 5);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      checkScroll();
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [messages.length]); // Re-attach if DOM changes due to messages length

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const scrollByAmount = (offset: number) => {
    const el = scrollRef.current;
    if (el) {
      el.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftVal(el.scrollLeft);
    setDragMoved(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    el.scrollLeft = scrollLeftVal - walk;

    if (Math.abs(x - startX) > 5) {
      setDragMoved(true);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      text: userText,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history: messages })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // API returned an error status - show the actual error details
        const errorDetail = data.details || data.error || `Error del servidor (${response.status})`;
        console.error("API Error Response:", data);
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: `⚠️ Error del servidor: ${errorDetail}`,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.text || "Lo siento, no pude procesar la respuesta.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Fetch error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Error de red. Verifica tu conexión a internet o intenta de nuevo más tarde.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const firstName = user.name.split(" ")[0];
  const isChatMode = messages.length > 0;

  // Simple formatting for bold text
  const formatMessageText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden font-sans bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* ═══════════════ ORGANIC BACKGROUND BLOBS ═══════════════ */}
      <div className="absolute pointer-events-none z-0" style={{ top: "-8%", right: "-15%", width: "420px", height: "420px", background: "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.03) 50%, transparent 75%)", borderRadius: "55% 45% 60% 40% / 45% 55% 40% 60%", filter: "blur(40px)" }} />
      <div className="absolute pointer-events-none z-0" style={{ top: "5%", left: "-8%", width: "220px", height: "220px", background: "radial-gradient(ellipse at center, rgba(99,102,241,0.06) 0%, transparent 70%)", borderRadius: "40% 60% 55% 45% / 55% 45% 60% 40%", filter: "blur(35px)" }} />
      <div className="absolute pointer-events-none z-0" style={{ top: "35%", right: "-5%", width: "280px", height: "280px", background: "radial-gradient(ellipse at center, rgba(37,99,235,0.04) 0%, transparent 70%)", borderRadius: "50% 50% 40% 60% / 60% 40% 50% 50%", filter: "blur(50px)" }} />
      <div className="absolute pointer-events-none z-0" style={{ bottom: "15%", left: "-12%", width: "350px", height: "350px", background: "radial-gradient(ellipse at center, rgba(147,197,253,0.07) 0%, transparent 70%)", borderRadius: "60% 40% 45% 55% / 45% 55% 50% 50%", filter: "blur(45px)" }} />
      <div className="absolute pointer-events-none z-0" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "500px", height: "500px", background: "radial-gradient(ellipse at center, rgba(219,234,254,0.15) 0%, transparent 60%)", borderRadius: "50%", filter: "blur(60px)" }} />

      {/* ═══════════════ HEADER ═══════════════ */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`flex justify-between items-center px-6 pt-[env(safe-area-inset-top,44px)] pb-2 z-20 relative w-full max-w-5xl mx-auto ${isChatMode ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0" : ""}`}
        style={{ paddingTop: "max(env(safe-area-inset-top, 20px), 40px)" }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer active:opacity-70 transition-opacity"
          onClick={() => onNavigate && onNavigate("home")}
        >
          <div className="w-[36px] h-[36px] relative shrink-0">
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

        {/* Action Buttons: Reset Chat / Emergency Button */}
        <div className="flex items-center gap-3">
          {isChatMode && (
            <button
              onClick={() => setMessages([])}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              Reiniciar
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onTriggerEmergency}
            className="relative flex flex-col items-center justify-center w-[52px] h-[52px] rounded-full overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              boxShadow: "0 6px 24px rgba(239,68,68,0.35), 0 2px 8px rgba(239,68,68,0.2)",
            }}
          >
            {/* Inner glow */}
            <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)" }} />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 mb-[1px]">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v10H2" />
              <circle cx="16.5" cy="17.5" r="2.5" />
              <circle cx="7.5" cy="17.5" r="2.5" />
              <path d="M10 10v4" />
              <path d="M8 12h4" />
            </svg>
            <span className="text-white text-[10px] font-bold relative z-10 leading-none mt-[-1px]">128</span>
          </motion.button>
        </div>
      </motion.header>

      {/* ═══════════════ CONDITIONAL RENDER: HERO VS CHAT ═══════════════ */}
      {!isChatMode ? (
        <AnimatePresence>
          <motion.div exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            {/* ═══════════════ MAIN TEXT CONTENT ═══════════════ */}
            <motion.main
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
              className="px-7 pt-10 z-10 relative w-full max-w-5xl mx-auto"
            >
              <h1 className="text-slate-900 dark:text-white tracking-[-0.03em]" style={{ fontSize: "clamp(36px, 9vw, 44px)", lineHeight: 1.08, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                {t('hello')} {firstName}.
              </h1>
              <h2 className="text-slate-700 dark:text-slate-300 mt-3 tracking-[-0.015em]" style={{ fontSize: "clamp(24px, 6.5vw, 30px)", lineHeight: 1.3, fontWeight: 400, fontFamily: "'Inter', sans-serif" }}>
                {t('assistant')}<br />
                {t('in')} <span className="text-blue-600 dark:text-blue-400 font-medium">Granada.</span>
              </h2>
              <div className="mt-8 mb-7 rounded-full bg-slate-200 dark:bg-slate-800" style={{ width: "36px", height: "2.5px" }} />
              <div className="space-y-[6px]" style={{ fontFamily: "'Inter', sans-serif" }}>
                <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: "clamp(15px, 4vw, 17px)", lineHeight: 1.5, fontWeight: 300, letterSpacing: "0.01em" }}>
                  {t('howFeel')}
                </p>
                <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "clamp(15px, 4vw, 17px)", lineHeight: 1.5, fontWeight: 300, letterSpacing: "0.01em" }}>
                  {t('hereToHelp')}
                </p>
              </div>
            </motion.main>

            {/* ═══════════════ SYMPTOM CHIPS CAROUSEL ═══════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
              className="w-full max-w-5xl mx-auto relative mt-12 mb-4 z-20 group"
            >
              {/* Left Arrow */}
              <AnimatePresence>
                {showLeftArrow && (
                  <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => scrollByAmount(-220)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors z-20 cursor-pointer active:scale-95" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Right Arrow */}
              <AnimatePresence>
                {showRightArrow && (
                  <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => scrollByAmount(220)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors z-20 cursor-pointer active:scale-95" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Overlays */}
              <div className="absolute left-0 top-0 bottom-0 pointer-events-none z-10 transition-opacity duration-300" style={{ width: "80px", background: "linear-gradient(90deg, var(--tw-gradient-from) 0%, rgba(248,250,255,0) 100%)", opacity: showLeftArrow ? 1 : 0 }} />
              <div className="absolute right-0 top-0 bottom-0 pointer-events-none z-10 transition-opacity duration-300" style={{ width: "80px", background: "linear-gradient(270deg, var(--tw-gradient-from) 0%, rgba(248,250,255,0) 100%)", opacity: showRightArrow ? 1 : 0 }} />

              {/* Scroll Container */}
              <div ref={scrollRef} onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} className="chips-scroll flex px-7 gap-3 pb-2 overflow-x-auto select-none" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch", cursor: isDragging ? "grabbing" : "grab" }}>
                <style>{`.chips-scroll::-webkit-scrollbar { display: none; }`}</style>
                {SYMPTOM_CHIPS.map((chip) => {
                  const isActive = activeChip === chip.id;
                  return (
                    <motion.button key={chip.id} whileTap={{ scale: 0.95 }} onClick={(e) => { if (dragMoved) { e.preventDefault(); return; } setActiveChip(chip.id); setInputValue(`Tengo ${chip.label.toLowerCase()}`); }} className={`flex items-center gap-2 shrink-0 transition-all duration-300 ease-out ${isActive ? "bg-blue-600 text-white border-transparent" : "bg-white dark:bg-slate-900 text-blue-800 dark:text-blue-400 border-slate-200 dark:border-slate-800"}`} style={{ padding: "12px 22px", borderRadius: "100px", fontSize: "14px", fontWeight: 600, fontFamily: "'Inter', sans-serif", letterSpacing: "0.01em", borderWidth: "1.5px", boxShadow: isActive ? "0 8px 24px rgba(37,99,235,0.28), 0 2px 8px rgba(37,99,235,0.12)" : "0 2px 6px rgba(0,0,0,0.04)" }}>
                      <span className="flex items-center justify-center" style={{ opacity: isActive ? 1 : 0.7 }}>{chip.icon}</span>
                      <span className="mt-[-0.5px]">{chip.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      ) : (
        /* ═══════════════ CHAT MESSAGES LIST ═══════════════ */
        <div className="flex-1 w-full max-w-5xl mx-auto px-5 py-4 overflow-y-auto z-10 flex flex-col gap-4">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-[15px] leading-[1.6] whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-sm"
                  }`}
                >
                  {formatMessageText(msg.text)}
                  <div className={`text-[10px] mt-1.5 opacity-70 text-right ${msg.sender === "user" ? "text-blue-100" : "text-slate-400"}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex w-full justify-start"
              >
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm px-5 py-4 flex gap-1.5 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Flexible spacer (only when not chatting) */}
      {!isChatMode && <div className="flex-1 min-h-[40px]" />}

      {/* ═══════════════ CHAT INPUT CARD ═══════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
        className={`w-full max-w-5xl mx-auto px-5 relative z-20 ${isChatMode ? "pb-6 pt-2" : "mb-5"}`}
      >
        <div
          className={`relative overflow-hidden transition-all duration-300 bg-white dark:bg-slate-900 rounded-[28px] p-[20px_18px_14px_18px] border-1.5 ${
            isFocused ? "border-blue-600 shadow-[0_12px_35px_rgba(37,99,235,0.15)]" : "border-slate-200 dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
          }`}
        >
          {/* Subtle inner gradient for premium feel */}
          <div className="absolute inset-0 pointer-events-none opacity-50 dark:opacity-10" style={{ background: "linear-gradient(180deg, rgba(248,250,252,0.5) 0%, transparent 40%)", borderRadius: "28px" }} />

          {/* Textarea */}
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={isChatMode ? "Escribe tu consulta aquí..." : "Describe tus síntomas…"}
            disabled={isLoading}
            className="relative z-10 w-full bg-transparent outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-200 disabled:opacity-50"
            style={{ height: "56px", fontSize: "15px", lineHeight: 1.5, fontWeight: 400, fontFamily: "'Inter', sans-serif", paddingLeft: "4px", paddingRight: "4px" }}
          />

          {/* Action buttons row */}
          <div className="flex justify-between items-center relative z-10 mt-1">
            {/* Attach button */}
            <motion.button whileTap={{ scale: 0.9 }} className="flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" style={{ width: "42px", height: "42px", borderRadius: "50%", color: "#64748b" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px" }}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
            </motion.button>

            {/* Right side: Mic + Send */}
            <div className="flex items-center gap-2">
              <motion.button whileTap={{ scale: 0.9 }} className="flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" style={{ width: "42px", height: "42px", borderRadius: "50%", color: "#64748b" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px" }}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.9 }} 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105" 
                style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)", boxShadow: "0 6px 20px rgba(37,99,235,0.32), 0 2px 6px rgba(37,99,235,0.15)", color: "#ffffff" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px", marginLeft: "-1px" }}><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════ TRUST BADGE ═══════════════ */}
      {!isChatMode && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.45 }} className="flex items-center justify-center gap-3.5 mb-24 z-10 w-full max-w-5xl mx-auto relative px-6">
          <div className="relative shrink-0" style={{ width: "32px", height: "34px" }}>
            <svg viewBox="0 0 24 24" className="w-full h-full" style={{ color: "#2563eb" }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" /></svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: "-1px" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "16px", height: "16px" }}><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400" style={{ fontSize: "13px", fontWeight: 500, lineHeight: 1.35, fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em" }}>
            {t('internationalNorms')}<br />{t('internationalNorms2')}
          </p>
        </motion.div>
      )}
    </div>
  );
}
