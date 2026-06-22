import React, { useState, useRef, useEffect } from "react";
import { UserProfile, ChatMessage } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { motion, AnimatePresence } from "motion/react";
import { Siren, Mic, MicOff, History, X, CalendarDays, Clock3, MessageCircle } from "lucide-react";
import { getOfflineTriageResponse } from "../lib/offlineTriage";
import { getMiskitoTriageResponse } from "../lib/miskitoTriage";
import { getKriolTriageResponse } from "../lib/kriolTriage";
interface ConsultaViewProps {
  user: UserProfile;
  onNavigate?: (tab: "home" | "consulta" | "buscar" | "premium" | "perfil") => void;
  isPremium?: boolean;
  onTriggerEmergency?: () => void;
}

const SYMPTOM_CHIPS = [
  {
    id: "fiebre",
    labelKey: "sympFiebre",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]" stroke="currentColor">
        <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
      </svg>
    ),
  },
  {
    id: "dolor-cabeza",
    labelKey: "sympDolorCabeza",
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
    labelKey: "sympTos",
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
    labelKey: "sympNauseas",
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
    labelKey: "sympDolorGarganta",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]" stroke="currentColor">
        <path d="M12 2a5 5 0 0 0-5 5v4a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z" />
        <path d="M12 18v2M9 15h6M6 11h12" />
      </svg>
    ),
  },
  {
    id: "congestion-nasal",
    labelKey: "sympCongestionNasal",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]" stroke="currentColor">
        <path d="M12 3c-1.2 0-2.4.5-3.2 1.3L4 9v4c0 3 2.5 5.5 5.5 5.5h5c3 0 5.5-2.5 5.5-5.5V9l-4.8-4.7C14.4 3.5 13.2 3 12 3Z" />
        <path d="M9 12h6M12 9v6" />
      </svg>
    ),
  },
  {
    id: "cansancio",
    labelKey: "sympCansancio",
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
    labelKey: "sympDolorMuscular",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]" stroke="currentColor">
        <path d="M6.5 6.5h11M6.5 12h11M6.5 17.5h11" />
        <path d="m3 21 18-18" />
      </svg>
    ),
  },
  {
    id: "dificultad-respirar",
    labelKey: "sympDificultadRespirar",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]" stroke="currentColor">
        <path d="M12 2v6M12 16v6M4.9 4.9l4.3 4.3M14.8 14.8l4.3 4.3M2 12h6M16 12h6M4.9 19.1l4.3-4.3M14.8 9.2l4.3-4.3" />
      </svg>
    ),
  },
];

const TRIAGE_HISTORY_DAYS = 14;
const TRIAGE_HISTORY_MS = TRIAGE_HISTORY_DAYS * 24 * 60 * 60 * 1000;

const getTriageHistoryKey = (userId?: string) => `triageHistory_${userId || "guest"}`;

const getMessageDate = (message: ChatMessage) => {
  const explicitDate = message.createdAt ? new Date(message.createdAt) : null;
  if (explicitDate && !Number.isNaN(explicitDate.getTime())) return explicitDate;

  const timestampFromId = Number(message.id);
  if (Number.isFinite(timestampFromId) && timestampFromId > 0) {
    const idDate = new Date(timestampFromId);
    if (!Number.isNaN(idDate.getTime())) return idDate;
  }

  return new Date();
};

const normalizeStoredMessages = (messages: ChatMessage[]) => {
  const cutoff = Date.now() - TRIAGE_HISTORY_MS;
  return messages
    .filter((message) => {
      const messageDate = getMessageDate(message);
      return messageDate.getTime() >= cutoff;
    })
    .map((message) => {
      const messageDate = getMessageDate(message);
      return {
        ...message,
        createdAt: message.createdAt || messageDate.toISOString(),
        timestamp: message.timestamp || messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
    });
};

const loadTriageHistory = (userId?: string): ChatMessage[] => {
  try {
    const stored = localStorage.getItem(getTriageHistoryKey(userId));
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return normalizeStoredMessages(parsed);
  } catch (err) {
    console.warn("No se pudo cargar el historial de triaje:", err);
    return [];
  }
};

const saveTriageHistory = (userId: string | undefined, messages: ChatMessage[]) => {
  try {
    const normalized = normalizeStoredMessages(messages);
    localStorage.setItem(getTriageHistoryKey(userId), JSON.stringify(normalized));
    return normalized;
  } catch (err) {
    console.warn("No se pudo guardar el historial de triaje:", err);
    return messages;
  }
};

const buildHistoryForApi = (messages: ChatMessage[]) => {
  return normalizeStoredMessages(messages).map((message) => {
    const messageDate = getMessageDate(message);
    const dateLabel = messageDate.toLocaleString("es-NI", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return {
      ...message,
      text: `[${dateLabel}] ${message.text}`,
    };
  });
};

const mergeMessagesById = (messages: ChatMessage[]) => {
  const map = new Map<string, ChatMessage>();
  messages.forEach((message) => map.set(message.id, message));
  return normalizeStoredMessages(Array.from(map.values())).sort(
    (a, b) => getMessageDate(a).getTime() - getMessageDate(b).getTime()
  );
};

export default function ConsultaView({ user, onNavigate, onTriggerEmergency }: ConsultaViewProps) {
  const { t, language } = useLanguage();
  const [activeChip, setActiveChip] = useState("fiebre");
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // --- CHAT STATE ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [storedHistory, setStoredHistory] = useState<ChatMessage[]>(() => loadTriageHistory(user.id));
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- SPEECH RECOGNITION ---
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setMessages([]);
    setStoredHistory(loadTriageHistory(user.id));
  }, [user.id]);

  const persistTriageMessages = (nextMessages: ChatMessage[]) => {
    const nextHistory = saveTriageHistory(user.id, mergeMessagesById([...storedHistory, ...nextMessages]));
    setStoredHistory(nextHistory);
  };

  useEffect(() => {
    if (messages.length === 0) return;
    persistTriageMessages(messages);
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => setIsRecording(true);
      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(prev => (prev ? `${prev} ${transcript}` : transcript));
      };
    }
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === "es" ? "es-NI" : "en-US";
    }
  }, [language]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error al iniciar reconocimiento de voz:", e);
      }
    }
  };

  
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
  }, [messages.length]); 

  
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue("");
    setIsLoading(true);

    if (language === 'mi') {
      setTimeout(() => {
        const miskitoResponse = getMiskitoTriageResponse(userText, user);
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: miskitoResponse,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMsg]);
        setIsLoading(false);
      }, 800);
      return;
    }

    if (language === 'kr') {
      setTimeout(() => {
        const kriolResponse = getKriolTriageResponse(userText, user);
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: kriolResponse,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMsg]);
        setIsLoading(false);
      }, 800);
      return;
    }

    if (!navigator.onLine) {
      setTimeout(() => {
        const offlineResponse = getOfflineTriageResponse(userText, user);
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: offlineResponse,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMsg]);
        setIsLoading(false);
      }, 800);
      return;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, userProfile: user, language })
      });
      
      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { error: text || `Error del servidor (${response.status})` };
      }
      
      if (!response.ok) {
        console.error("API Error Response:", data);
        console.error("Response status:", response.status);
        const offlineResponse = getOfflineTriageResponse(userText, user);
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: offlineResponse,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }
      
      
      if (data.simulated) {
        console.warn("[ConsultaView] Simulated response received:", data.warning);
      }
      
      let botText = data.text || "Lo siento, no pude procesar la respuesta.";
      
      
      if (data.simulated && data.warning) {
        botText = `📋 ${data.warning}\n\n${botText}`;
      }
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Fetch error:", error);
      const offlineResponse = getOfflineTriageResponse(userText, user);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: offlineResponse,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString()
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

  const handleResetChat = () => {
    setMessages([]);
  };

  const handleClearHistory = () => {
    setMessages([]);
    setStoredHistory([]);
    setIsHistoryOpen(false);
    try {
      localStorage.removeItem(getTriageHistoryKey(user.id));
    } catch (err) {
      console.warn("No se pudo limpiar el historial de triaje:", err);
    }
  };

  const firstName = user.name.split(" ")[0];
  const isChatMode = messages.length > 0;
  const historyMessages = normalizeStoredMessages(storedHistory);

  const formatHistoryDate = (value?: string) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("es-NI", { weekday: "long", day: "numeric", month: "long" });
  };

  const formatHistoryTime = (value?: string) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "--:--";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  
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
    <div className="flex flex-col min-h-dvh relative overflow-hidden font-sans bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full border border-blue-200/55 dark:border-blue-900/30"></div>
        <div className="absolute top-28 -left-8 w-72 h-72 rounded-full border border-blue-200/45 dark:border-blue-900/30"></div>
        <div className="absolute top-72 right-[-8rem] w-72 h-72 rounded-full bg-blue-100/45 dark:bg-blue-950/30 blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_28%,rgba(56,189,248,0.08),transparent_28%),linear-gradient(135deg,transparent_0%,transparent_60%,rgba(59,130,246,0.08)_60%,transparent_78%)]"></div>
      </div>

      {}
      <div className="absolute pointer-events-none z-0" style={{ top: "-8%", right: "-15%", width: "420px", height: "420px", background: "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.03) 50%, transparent 75%)", borderRadius: "55% 45% 60% 40% / 45% 55% 40% 60%", filter: "blur(40px)" }} />
      <div className="absolute pointer-events-none z-0" style={{ top: "5%", left: "-8%", width: "220px", height: "220px", background: "radial-gradient(ellipse at center, rgba(99,102,241,0.06) 0%, transparent 70%)", borderRadius: "40% 60% 55% 45% / 55% 45% 60% 40%", filter: "blur(35px)" }} />
      <div className="absolute pointer-events-none z-0" style={{ top: "35%", right: "-5%", width: "280px", height: "280px", background: "radial-gradient(ellipse at center, rgba(37,99,235,0.04) 0%, transparent 70%)", borderRadius: "50% 50% 40% 60% / 60% 40% 50% 50%", filter: "blur(50px)" }} />
      <div className="absolute pointer-events-none z-0" style={{ bottom: "15%", left: "-12%", width: "350px", height: "350px", background: "radial-gradient(ellipse at center, rgba(147,197,253,0.07) 0%, transparent 70%)", borderRadius: "60% 40% 45% 55% / 45% 55% 50% 50%", filter: "blur(45px)" }} />
      <div className="absolute pointer-events-none z-0" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "500px", height: "500px", background: "radial-gradient(ellipse at center, rgba(219,234,254,0.15) 0%, transparent 60%)", borderRadius: "50%", filter: "blur(60px)" }} />

      {}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`flex justify-between items-center px-6 pt-[env(safe-area-inset-top,44px)] pb-2 z-20 relative w-full max-w-5xl mx-auto ${isChatMode ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0" : ""}`}
        style={{ paddingTop: "max(env(safe-area-inset-top, 20px), 40px)" }}
      >
        {}
        <div
          className="flex items-center gap-2.5 cursor-pointer active:opacity-70 transition-opacity"
          onClick={() => onNavigate && onNavigate("home")}
        >
          <img
            src="/app-logo-v1.jpg"
            alt="Logo"
            className="w-9 h-9 rounded-lg shadow-sm object-cover border border-blue-100 dark:border-blue-900/30"
          />
          <span className="font-bold text-[19px] tracking-[-0.02em] text-slate-900 dark:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            Salud-Conecta <span className="text-blue-500">IA</span>
          </span>
        </div>

        {}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsHistoryOpen(true)}
            className="relative flex items-center justify-center w-[44px] h-[44px] rounded-full bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 shadow-[0_8px_24px_rgba(37,99,235,0.10)] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Historial de triaje"
          >
            <History className="w-5 h-5" />
            {historyMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[9px] font-black border-2 border-white dark:border-slate-900 flex items-center justify-center">
                {historyMessages.length > 9 ? "9+" : historyMessages.length}
              </span>
            )}
          </motion.button>
          {isChatMode && (
            <button
              onClick={handleResetChat}
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
              background: "#fb7185",
              boxShadow: "0 6px 20px rgba(251,113,133,0.25)",
            }}
          >
            {}
            <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)" }} />
            <Siren className="w-5 h-5 text-white relative z-10 mb-[1px]" />
            <span className="text-white text-[10px] font-bold relative z-10 leading-none mt-[-1px]">128</span>
          </motion.button>
        </div>
      </motion.header>

      {}
      {!isChatMode ? (
        <AnimatePresence>
          <motion.div exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            {}
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
                <span className="text-blue-600 dark:text-blue-400 font-medium">virtual.</span>
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

            {}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
              className="w-full max-w-5xl mx-auto relative mt-12 mb-4 z-20 group"
            >
              {}
              <AnimatePresence>
                {showLeftArrow && (
                  <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => scrollByAmount(-220)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors z-20 cursor-pointer active:scale-95" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </motion.button>
                )}
              </AnimatePresence>

              {}
              <AnimatePresence>
                {showRightArrow && (
                  <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => scrollByAmount(220)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors z-20 cursor-pointer active:scale-95" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </motion.button>
                )}
              </AnimatePresence>

              {}
              <div className="absolute left-0 top-0 bottom-0 pointer-events-none z-10 transition-opacity duration-300" style={{ width: "80px", background: "linear-gradient(90deg, var(--tw-gradient-from) 0%, rgba(248,250,255,0) 100%)", opacity: showLeftArrow ? 1 : 0 }} />
              <div className="absolute right-0 top-0 bottom-0 pointer-events-none z-10 transition-opacity duration-300" style={{ width: "80px", background: "linear-gradient(270deg, var(--tw-gradient-from) 0%, rgba(248,250,255,0) 100%)", opacity: showRightArrow ? 1 : 0 }} />

              {}
              <div ref={scrollRef} onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} className="chips-scroll flex px-7 gap-3 pb-2 overflow-x-auto select-none" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch", cursor: isDragging ? "grabbing" : "grab" }}>
                <style>{`.chips-scroll::-webkit-scrollbar { display: none; }`}</style>
                {SYMPTOM_CHIPS.map((chip) => {
                  const isActive = activeChip === chip.id;
                  const translatedLabel = t(chip.labelKey as any) || chip.labelKey;
                  return (
                    <motion.button key={chip.id} whileTap={{ scale: 0.95 }} onClick={(e) => { if (dragMoved) { e.preventDefault(); return; } setActiveChip(chip.id); setInputValue(language === 'mi' ? `Yang brisna ${translatedLabel.toLowerCase()}` : `Tengo ${translatedLabel.toLowerCase()}`); }} className={`flex items-center gap-2 shrink-0 transition-all duration-300 ease-out ${isActive ? "bg-blue-600 text-white border-transparent" : "bg-white dark:bg-slate-900 text-blue-800 dark:text-blue-400 border-slate-200 dark:border-slate-800"}`} style={{ padding: "12px 22px", borderRadius: "100px", fontSize: "14px", fontWeight: 600, fontFamily: "'Inter', sans-serif", letterSpacing: "0.01em", borderWidth: "1.5px", boxShadow: isActive ? "0 8px 24px rgba(37,99,235,0.28), 0 2px 8px rgba(37,99,235,0.12)" : "0 2px 6px rgba(0,0,0,0.04)" }}>
                      <span className="flex items-center justify-center" style={{ opacity: isActive ? 1 : 0.7 }}>{chip.icon}</span>
                      <span className="mt-[-0.5px]">{translatedLabel}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      ) : (
        
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

      {}
      {!isChatMode && <div className="flex-1 min-h-[40px]" />}

      {}
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
          {}
          <div className="absolute inset-0 pointer-events-none opacity-50 dark:opacity-10" style={{ background: "linear-gradient(180deg, rgba(248,250,252,0.5) 0%, transparent 40%)", borderRadius: "28px" }} />

          {}
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

          {}
          <div className="flex justify-between items-center relative z-10 mt-1">
            {}
            <motion.button whileTap={{ scale: 0.9 }} className="flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" style={{ width: "42px", height: "42px", borderRadius: "50%", color: "#64748b" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px" }}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
            </motion.button>

            {}
            <div className="flex items-center gap-2">
              <motion.button 
                whileTap={{ scale: 0.9 }} 
                onClick={toggleRecording}
                className={`flex items-center justify-center transition-colors ${isRecording ? "text-rose-500 bg-rose-50 dark:bg-rose-900/20" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`} 
                style={{ width: "42px", height: "42px", borderRadius: "50%" }}
              >
                {isRecording ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
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

      {}
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

      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
            onClick={() => setIsHistoryOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 22, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 330, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-2xl max-h-[86dvh] bg-white dark:bg-slate-900 rounded-t-[30px] sm:rounded-[30px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="px-5 sm:px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-[0_14px_28px_rgba(37,99,235,0.25)] shrink-0">
                    <History className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
                      Historial de triaje
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Últimos 14 días con fecha y hora
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-slate-700 flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/25 rounded-full px-3 py-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{historyMessages.length} mensajes</span>
                </div>
                {historyMessages.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-[11px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-full px-3 py-1.5 transition-colors"
                  >
                    Limpiar historial
                  </button>
                )}
              </div>

              <div className="max-h-[58dvh] overflow-y-auto px-4 sm:px-6 py-4 bg-slate-50/70 dark:bg-slate-950/30">
                {historyMessages.length > 0 ? (
                  <div className="space-y-3">
                    {historyMessages.map((message) => (
                      <div
                        key={`history-${message.id}`}
                        className={`rounded-2xl border p-4 shadow-sm ${
                          message.sender === "user"
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <div className={`flex flex-wrap items-center gap-2 mb-2 text-[10px] font-black ${
                          message.sender === "user" ? "text-blue-100" : "text-slate-400 dark:text-slate-500"
                        }`}>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                            message.sender === "user" ? "bg-white/15" : "bg-slate-100 dark:bg-slate-800"
                          }`}>
                            <CalendarDays className="w-3 h-3" />
                            {formatHistoryDate(message.createdAt)}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                            message.sender === "user" ? "bg-white/15" : "bg-slate-100 dark:bg-slate-800"
                          }`}>
                            <Clock3 className="w-3 h-3" />
                            {formatHistoryTime(message.createdAt)}
                          </span>
                          <span className={`ml-auto rounded-full px-2 py-1 ${
                            message.sender === "user"
                              ? "bg-white/15 text-white"
                              : "bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400"
                          }`}>
                            {message.sender === "user" ? "Tú" : "Salud-Conecta IA"}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-blue-500 shadow-sm mb-4">
                      <History className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">Sin historial todavía</h4>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Cuando hagas una consulta, aparecerá aquí con su fecha y hora durante 14 días.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
