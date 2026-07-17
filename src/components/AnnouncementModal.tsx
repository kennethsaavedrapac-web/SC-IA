import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Megaphone, Star, ChevronRight, ChevronLeft } from 'lucide-react';

interface Announcement {
  id: string;
  tipo: 'alert' | 'banner' | 'promotion';
  titulo: string;
  mensaje: string;
}

interface Props {
  announcements: Announcement[];
  onDismiss: (id: string) => void;
}

export default function AnnouncementModal({ announcements, onDismiss }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!announcements || announcements.length === 0) return null;

  const currentAnn = announcements[currentIndex];
  const isAlert = currentAnn.tipo === 'alert';
  const isPromo = currentAnn.tipo === 'promotion';

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleDismissCurrent = () => {
    onDismiss(currentAnn.id);
    if (currentIndex >= announcements.length - 1) {
      setCurrentIndex(Math.max(0, announcements.length - 2));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
      >
        <div className={`p-8 flex flex-col items-center text-center relative overflow-hidden ${
          isAlert ? 'bg-gradient-to-br from-rose-500 to-rose-700' :
          isPromo ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
          'bg-gradient-to-br from-brand-900 to-brand-900'
        }`}>
          {/* Elementos decorativos */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-black/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/30">
            {isAlert ? <AlertTriangle className="w-10 h-10 text-white" /> :
             isPromo ? <Star className="w-10 h-10 text-white" /> :
             <Megaphone className="w-10 h-10 text-white" />}
          </div>
          
          <div className="relative z-10 mb-2">
            <span className="inline-block px-3 py-1 bg-black/20 text-white/90 text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 shadow-inner">
              {isAlert ? 'Alerta Importante' : isPromo ? 'Promoción' : 'Anuncio Oficial'}
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{currentAnn.titulo}</h2>
          </div>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 flex-1 flex flex-col">
          <p className="text-slate-600 dark:text-slate-300 text-[15px] leading-relaxed mb-8 text-center font-medium">
            {currentAnn.mensaje}
          </p>

          <div className="mt-auto flex flex-col gap-4">
            <button
              onClick={handleDismissCurrent}
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-2xl transition-all active:scale-[0.98] text-[15px] shadow-sm hover:shadow"
            >
              Entendido
            </button>
            
            {announcements.length > 1 && (
              <div className="flex items-center justify-between mt-2 px-2">
                <button 
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  {announcements.map((_, idx) => (
                    <div key={idx} className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-brand-600' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
                  ))}
                </div>
                <button 
                  onClick={handleNext}
                  disabled={currentIndex === announcements.length - 1}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
