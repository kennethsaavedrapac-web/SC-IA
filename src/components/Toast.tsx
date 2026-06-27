import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';


export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; 
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}


const TOAST_CONFIG: Record<ToastType, { icon: typeof CheckCircle; bg: string; border: string; text: string; iconColor: string }> = {
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-50 dark:bg-emerald-950/80',
    border: 'border-emerald-200/60 dark:border-emerald-800/60',
    text: 'text-emerald-800 dark:text-emerald-200',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-950/80',
    border: 'border-red-200/60 dark:border-red-800/60',
    text: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/80',
    border: 'border-amber-200/60 dark:border-amber-800/60',
    text: 'text-amber-800 dark:text-amber-200',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    icon: Info,
    bg: 'bg-brand-50 dark:bg-brand-900/80',
    border: 'border-brand-200/60 dark:border-brand-900/60',
    text: 'text-brand-900 dark:text-brand-200',
    iconColor: 'text-brand-600 dark:text-brand-400',
  },
};


function Toast({ toast, onDismiss }: ToastProps) {
  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`w-full max-w-sm mx-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-md ${config.bg} ${config.border}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <p className={`flex-1 text-[13px] font-semibold leading-snug ${config.text}`}>
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className={`shrink-0 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${config.text} opacity-60 hover:opacity-100`}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}


export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full max-w-sm">
            <Toast toast={toast} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}


let toastCounter = 0;
export function createToast(message: string, type: ToastType, duration?: number): ToastData {
  return {
    id: `toast-${++toastCounter}-${Date.now()}`,
    message,
    type,
    duration,
  };
}
