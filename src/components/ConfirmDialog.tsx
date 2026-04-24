import React, { useEffect } from 'react';
import FullscreenModal from './Modals';

export type ConfirmTone = 'primary' | 'danger' | 'success' | 'warning';

interface ConfirmDialogProps {
   open: boolean;
   onClose: () => void;
   onConfirm: () => void;
   title: string;
   description?: React.ReactNode;
   confirmLabel?: string;
   cancelLabel?: string;
   tone?: ConfirmTone;
   loading?: boolean;
   icon?: React.ReactNode;
}

const TONE_CONFIG: Record<
   ConfirmTone,
   { accent: string; bg: string; border: string; ring: string }
> = {
   primary: {
      accent: '#1F6FB2',
      bg: 'rgba(31,111,178,0.12)',
      border: 'rgba(31,111,178,0.35)',
      ring: 'rgba(31,111,178,0.18)',
   },
   success: {
      accent: '#10B981',
      bg: 'rgba(16,185,129,0.12)',
      border: 'rgba(16,185,129,0.35)',
      ring: 'rgba(16,185,129,0.18)',
   },
   warning: {
      accent: '#F59E0B',
      bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.35)',
      ring: 'rgba(245,158,11,0.18)',
   },
   danger: {
      accent: '#EF4444',
      bg: 'rgba(239,68,68,0.12)',
      border: 'rgba(239,68,68,0.35)',
      ring: 'rgba(239,68,68,0.18)',
   },
};

const DEFAULT_ICONS: Record<ConfirmTone, React.ReactNode> = {
   primary: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
         <circle cx="12" cy="12" r="10" />
         <line x1="12" y1="16" x2="12" y2="12" />
         <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
   ),
   success: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
         <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
         <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
   ),
   warning: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
         <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
         <line x1="12" y1="9" x2="12" y2="13" />
         <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
   ),
   danger: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
         <circle cx="12" cy="12" r="10" />
         <line x1="15" y1="9" x2="9" y2="15" />
         <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
   ),
};

/**
 * Reusable confirmation dialog. Prefer this over window.confirm() so the
 * experience matches the rest of the app and respects the design tokens.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
   open,
   onClose,
   onConfirm,
   title,
   description,
   confirmLabel = 'Confirm',
   cancelLabel = 'Cancel',
   tone = 'primary',
   loading = false,
   icon,
}) => {
   const cfg = TONE_CONFIG[tone];

   // Dismiss on Escape so keyboard users aren't trapped.
   useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => {
         if (e.key === 'Escape' && !loading) onClose();
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
   }, [open, loading, onClose]);

   return (
      <FullscreenModal open={open} onClickAway={loading ? () => {} : onClose}>
         <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            className="rounded-2xl shadow-2xl mx-auto w-[90vw] sm:w-[26rem] overflow-hidden"
            style={{
               background: 'var(--surface-paper)',
               border: '1px solid var(--border-default)',
            }}
         >
            <div className="px-6 pt-6 pb-4 flex items-start gap-4">
               <div
                  className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                  style={{
                     background: cfg.bg,
                     border: `1px solid ${cfg.border}`,
                     color: cfg.accent,
                     boxShadow: `0 0 0 4px ${cfg.ring}`,
                  }}
               >
                  {icon ?? DEFAULT_ICONS[tone]}
               </div>
               <div className="min-w-0 flex-1 pt-0.5">
                  <h2
                     id="confirm-dialog-title"
                     className="text-base font-semibold tracking-tight"
                     style={{ color: 'var(--text-primary)' }}
                  >
                     {title}
                  </h2>
                  {description && (
                     <div
                        className="text-sm mt-1.5"
                        style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}
                     >
                        {description}
                     </div>
                  )}
               </div>
            </div>

            <div
               className="px-6 py-3 flex items-center justify-end gap-2"
               style={{
                  background: 'var(--surface-low)',
                  borderTop: '1px solid var(--border-default)',
               }}
            >
               <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                     color: 'var(--text-secondary)',
                     border: '1px solid var(--border-strong)',
                     background: 'transparent',
                  }}
               >
                  {cancelLabel}
               </button>
               <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  autoFocus
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: cfg.accent }}
               >
                  {loading ? (
                     <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Working…
                     </span>
                  ) : (
                     confirmLabel
                  )}
               </button>
            </div>
         </div>
      </FullscreenModal>
   );
};

export default ConfirmDialog;
