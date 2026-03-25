import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { appActions } from '@/actions';
import { UnknownAction } from 'redux';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastEntry {
   id: number;
   message: string;
   variant: ToastVariant;
   exiting: boolean;
}

const TOAST_DURATION = 4000;

let toastId = 0;

const variantConfig: Record<
   ToastVariant,
   { bg: string; border: string; icon: React.ReactNode; progressColor: string }
> = {
   success: {
      bg: 'bg-white dark:bg-[#1a2e1a]',
      border: 'border-l-[3px] border-l-emerald-500',
      progressColor: '#10b981',
      icon: (
         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <circle cx="12" cy="12" r="10" fill="#10b981" />
            <path d="M8 12l2.5 2.5L16 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
         </svg>
      ),
   },
   error: {
      bg: 'bg-white dark:bg-[#2e1a1a]',
      border: 'border-l-[3px] border-l-red-500',
      progressColor: '#ef4444',
      icon: (
         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <circle cx="12" cy="12" r="10" fill="#ef4444" />
            <path d="M15 9l-6 6M9 9l6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
         </svg>
      ),
   },
   warning: {
      bg: 'bg-white dark:bg-[#2e2a1a]',
      border: 'border-l-[3px] border-l-amber-500',
      progressColor: '#f59e0b',
      icon: (
         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M12 2L1 21h22L12 2z" fill="#f59e0b" />
            <path d="M12 9v4M12 16h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
         </svg>
      ),
   },
   info: {
      bg: 'bg-white dark:bg-[#1a1a2e]',
      border: 'border-l-[3px] border-l-blue-500',
      progressColor: '#3b82f6',
      icon: (
         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <circle cx="12" cy="12" r="10" fill="#3b82f6" />
            <path d="M12 8h.01M12 11v5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
         </svg>
      ),
   },
};

const ToastItem: React.FC<{
   toast: ToastEntry;
   onDismiss: (id: number) => void;
}> = ({ toast, onDismiss }) => {
   const [progress, setProgress] = useState(100);
   const config = variantConfig[toast.variant] || variantConfig.info;

   useEffect(() => {
      const start = Date.now();
      const interval = setInterval(() => {
         const elapsed = Date.now() - start;
         const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
         setProgress(remaining);
         if (remaining <= 0) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
   }, []);

   useEffect(() => {
      const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION);
      return () => clearTimeout(timer);
   }, [toast.id, onDismiss]);

   return (
      <div
         className={`
            toast-enter ${toast.exiting ? 'toast-exit' : ''}
            ${config.bg} ${config.border}
            rounded-lg px-4 py-3
            flex items-start gap-3
            min-w-[320px] max-w-[420px]
            shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]
            border border-[rgba(15,37,82,0.08)] dark:border-white/10
            pointer-events-auto
            relative overflow-hidden
            transition-colors duration-300
         `}
      >
         {config.icon}
         <p className="flex-1 text-sm font-medium text-[#0F2552] dark:text-white/90 leading-snug break-words">
            {toast.message}
         </p>
         <button
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 mt-0.5 text-[#0F2552]/30 dark:text-white/30 hover:text-[#0F2552]/60 dark:hover:text-white/60 transition-colors cursor-pointer"
            aria-label="Dismiss"
         >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
               <path d="M18 6L6 18M6 6l12 12" />
            </svg>
         </button>
         {/* Progress bar */}
         <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/5 dark:bg-white/5">
            <div
               className="h-full transition-none"
               style={{
                  width: `${progress}%`,
                  backgroundColor: config.progressColor,
               }}
            />
         </div>
      </div>
   );
};

const ToastContainer: React.FC = () => {
   const dispatch = useDispatch();
   const { message } = useSelector((s: RootState) => s.snackbar);
   const [toasts, setToasts] = useState<ToastEntry[]>([]);

   // Listen for redux snackbar changes and create toast entries
   useEffect(() => {
      if (message.message && message.message !== '') {
         const variant = (['success', 'error', 'warning', 'info'].includes(message.variant)
            ? message.variant
            : 'info') as ToastVariant;

         setToasts((prev) => [
            ...prev,
            {
               id: ++toastId,
               message: message.message,
               variant,
               exiting: false,
            },
         ]);

         // Clear redux state so the same message can re-trigger
         dispatch(appActions.clearSnackBar() as unknown as UnknownAction);
      }
   }, [message, dispatch]);

   const handleDismiss = useCallback((id: number) => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      setTimeout(() => {
         setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
   }, []);

   if (toasts.length === 0) return null;

   return (
      <div
         className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
         aria-live="polite"
         aria-atomic="false"
      >
         {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
         ))}
      </div>
   );
};

export default ToastContainer;
