import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';

interface FullscreenModalProps {
   open: boolean;
   onClickAway?: () => void;
   hidden?: boolean;
   notification?: boolean;
   download?: boolean;
   className?: string;
   children?: ReactNode;
}

const FullscreenModal: React.FC<FullscreenModalProps> = ({
   open,
   onClickAway,
   hidden,
   download,
   className,
   children,
}) => {
   const [isClient, setIsClient] = useState(false);

   useEffect(() => {
      setIsClient(true);
   }, []);

   useEffect(() => {
      if (!open) return;
      const handleEscape = (e: KeyboardEvent) => {
         if (e.key === 'Escape' && onClickAway) onClickAway();
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
   }, [open, onClickAway]);

   if (!open || !isClient) return null;

   return createPortal(
      <div
         role="dialog"
         aria-modal="true"
         className={classNames(
            'fixed inset-0 z-[6001] flex items-center justify-center pt-10 animate-modal-backdrop',
            {
               hidden: hidden,
               'bg-[#000000b0] bg-opacity-30': !download,
            },
         )}
      >
         <div onClick={onClickAway} className="absolute inset-0" aria-hidden="true" />
         <div
            className={classNames(
               'relative max-h-[90vh] max-w-[90vw] overflow-visible rounded-xl shadow-xl animate-modal-content',
               className,
            )}
         >
            {children}
         </div>
      </div>,
      document.body,
   );
};

export default FullscreenModal;
