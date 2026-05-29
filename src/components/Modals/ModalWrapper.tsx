import React from 'react';
import FullscreenModal from './index';

interface ModalWrapperProps {
   open: boolean;
   onClose: () => void;
   title: string;
   subtitle?: string;
   children: React.ReactNode;
   width?: string;
   /**
    * Optional pinned footer (e.g. Cancel / Submit row). Rendered OUTSIDE
    * the scrollable body so it stays visible regardless of how much the
    * form scrolls. Modals that render their footer inside `children`
    * keep working unchanged (the body scroll then includes the footer
    * the way it did before this prop existed), but new code should
    * prefer this slot so action buttons never scroll off-screen on
    * short viewports.
    */
   footer?: React.ReactNode;
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
   footer,
}) => {
   return (
      <FullscreenModal open={open} onClickAway={onClose}>
         <div
            className={`rounded-xl shadow-xl mx-auto w-[90vw] flex flex-col max-h-[90vh] ${width}`}
            style={{
               background: 'var(--surface-paper)',
               border: '1px solid var(--border-default)',
            }}
         >
            {/* Header */}
            <div
               className="flex items-start justify-between px-6 py-4 shrink-0"
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

            {/* Body — flex-1 + min-h-0 lets the body claim the remaining
                height inside the max-h-[90vh] outer flex column and scroll
                internally when content overflows. The pinned footer (when
                present) stays visible regardless of scroll position. */}
            <div className="px-6 py-5 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
               {children}
            </div>

            {footer && (
               <div
                  className="px-6 py-4 shrink-0 flex justify-end gap-2"
                  style={{ borderTop: '1px solid var(--border-default)' }}
               >
                  {footer}
               </div>
            )}
         </div>
      </FullscreenModal>
   );
};

export default ModalWrapper;
