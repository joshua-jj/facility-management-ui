import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface ActionMenuItem {
   label: string;
   icon?: React.ReactNode;
   onClick: () => void;
   variant?: 'default' | 'danger';
   hidden?: boolean;
}

interface ActionMenuProps {
   items: ActionMenuItem[];
   className?: string;
}

/**
 * Three-dot kebab action menu. Renders the dropdown via portal
 * so it escapes overflow containers (tables, modals, etc).
 */
const ActionMenu: React.FC<ActionMenuProps> = ({ items, className = '' }) => {
   const [open, setOpen] = useState(false);
   const [position, setPosition] = useState<{ top?: number; bottom?: number; right: number }>({ right: 0 });
   const buttonRef = useRef<HTMLButtonElement>(null);
   const menuRef = useRef<HTMLDivElement>(null);
   const [isClient, setIsClient] = useState(false);

   useEffect(() => setIsClient(true), []);

   const visibleItems = items.filter((i) => !i.hidden);

   const toggleMenu = useCallback(() => {
      if (!open && buttonRef.current) {
         const rect = buttonRef.current.getBoundingClientRect();
         const spaceBelow = window.innerHeight - rect.bottom;
         const menuHeight = visibleItems.length * 38 + 16;

         const pos: typeof position = {
            right: window.innerWidth - rect.right,
         };

         if (spaceBelow < menuHeight && rect.top > menuHeight) {
            pos.bottom = window.innerHeight - rect.top + 4;
         } else {
            pos.top = rect.bottom + 4;
         }

         setPosition(pos);
      }
      setOpen((p) => !p);
   }, [open, visibleItems.length]);

   // Close on outside click
   useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
         if (
            menuRef.current && !menuRef.current.contains(e.target as Node) &&
            buttonRef.current && !buttonRef.current.contains(e.target as Node)
         ) {
            setOpen(false);
         }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
   }, [open]);

   // Close on Escape
   useEffect(() => {
      if (!open) return;
      const handler = (e: KeyboardEvent) => {
         if (e.key === 'Escape') setOpen(false);
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
   }, [open]);

   if (visibleItems.length === 0) return null;

   const menu = (
      <div
         ref={menuRef}
         className="animate-dropdown-enter"
         style={{
            position: 'fixed',
            top: position.top,
            bottom: position.bottom,
            right: position.right,
            zIndex: 9999,
         }}
      >
         <div
            className="py-1 rounded-lg min-w-[160px]"
            style={{
               background: 'var(--surface-paper)',
               border: '1px solid var(--border-default)',
               boxShadow: 'var(--shadow-lg)',
            }}
            role="menu"
         >
            {visibleItems.map((item, i) => (
               <button
                  key={i}
                  role="menuitem"
                  onClick={() => {
                     setOpen(false);
                     item.onClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer"
                  style={{
                     color: item.variant === 'danger' ? '#ef4444' : 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => {
                     e.currentTarget.style.background = item.variant === 'danger'
                        ? 'rgba(239,68,68,0.06)'
                        : 'var(--surface-low)';
                  }}
                  onMouseLeave={(e) => {
                     e.currentTarget.style.background = 'transparent';
                  }}
               >
                  {item.icon && (
                     <span className="w-4 h-4 flex items-center justify-center shrink-0 opacity-70">
                        {item.icon}
                     </span>
                  )}
                  {item.label}
               </button>
            ))}
         </div>
      </div>
   );

   return (
      <>
         <button
            ref={buttonRef}
            type="button"
            onClick={(e) => {
               e.stopPropagation();
               toggleMenu();
            }}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${className}`}
            style={{ color: 'var(--text-hint)' }}
            onMouseEnter={(e) => {
               e.currentTarget.style.background = 'var(--surface-medium)';
               e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
               e.currentTarget.style.background = 'transparent';
               e.currentTarget.style.color = 'var(--text-hint)';
            }}
            aria-haspopup="true"
            aria-expanded={open}
         >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
               <circle cx="12" cy="5" r="2" />
               <circle cx="12" cy="12" r="2" />
               <circle cx="12" cy="19" r="2" />
            </svg>
         </button>
         {open && isClient && createPortal(menu, document.body)}
      </>
   );
};

export default ActionMenu;
