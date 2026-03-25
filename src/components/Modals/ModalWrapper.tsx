import React from 'react';
import FullscreenModal from './index';

interface ModalWrapperProps {
   open: boolean;
   onClose: () => void;
   title: string;
   subtitle?: string;
   children: React.ReactNode;
   width?: string;
}

/**
 * Centralized modal wrapper for consistent styling across all dialogs.
 *
 * Usage:
 * ```tsx
 * <ModalWrapper open={isOpen} onClose={close} title="Create Item">
 *    <form> ... </form>
 * </ModalWrapper>
 * ```
 */
const ModalWrapper: React.FC<ModalWrapperProps> = ({
   open,
   onClose,
   title,
   subtitle,
   children,
   width = 'sm:w-[28rem]',
}) => {
   return (
      <FullscreenModal open={open} onClickAway={onClose}>
         <div
            className={`rounded-xl shadow-xl mx-auto w-[90vw] ${width}`}
            style={{
               background: 'var(--surface-paper)',
               border: '1px solid var(--border-default)',
            }}
         >
            {/* Header */}
            <div
               className="flex items-start justify-between px-6 py-4"
               style={{ borderBottom: '1px solid var(--border-default)' }}
            >
               <div>
                  <h2
                     className="text-lg font-semibold"
                     style={{ color: 'var(--text-primary)' }}
                  >
                     {title}
                  </h2>
                  {subtitle && (
                     <p
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        {subtitle}
                     </p>
                  )}
               </div>
               <button
                  onClick={onClose}
                  className="shrink-0 p-1 rounded-md transition-colors cursor-pointer"
                  style={{ color: 'var(--text-disabled)' }}
                  onMouseEnter={(e) => {
                     e.currentTarget.style.color = 'var(--text-secondary)';
                     e.currentTarget.style.background = 'var(--surface-medium)';
                  }}
                  onMouseLeave={(e) => {
                     e.currentTarget.style.color = 'var(--text-disabled)';
                     e.currentTarget.style.background = 'transparent';
                  }}
                  aria-label="Close"
               >
                  <svg
                     width="18"
                     height="18"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="2"
                     strokeLinecap="round"
                  >
                     <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
               </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">{children}</div>
         </div>
      </FullscreenModal>
   );
};

export default ModalWrapper;
