import React, { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { SearchIcon } from '@/components/Icons';

export interface ComboBoxOption {
   value: string;
   label: string;
}

export interface ComboBoxProps {
   value: string;
   onChange: (value: string) => void;
   options: ComboBoxOption[];
   placeholder?: string;
   searchable?: boolean;
   disabled?: boolean;
   error?: boolean;
   className?: string;
   searchPlaceholder?: string;
   noResultsText?: string;
}

type Rect = { top: number; left: number; width: number; openUp: boolean; maxHeight: number };

const ComboBox: React.FC<ComboBoxProps> = ({
   value,
   onChange,
   options,
   placeholder = 'Select an option',
   searchable = true,
   disabled = false,
   error = false,
   className,
   searchPlaceholder = 'Search...',
   noResultsText = 'No results found',
}) => {
   const [open, setOpen] = useState(false);
   const [search, setSearch] = useState('');
   const [rect, setRect] = useState<Rect | null>(null);
   const [mounted, setMounted] = useState(false);
   const triggerRef = useRef<HTMLButtonElement>(null);
   const dropdownRef = useRef<HTMLDivElement>(null);
   const searchRef = useRef<HTMLInputElement>(null);

   const selectedOption = options.find((o) => o.value === value);

   useEffect(() => {
      setMounted(true);
   }, []);

   const measure = useCallback(() => {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      const margin = 6;
      const preferredHeight = 320;
      const spaceBelow = window.innerHeight - r.bottom - margin;
      const spaceAbove = r.top - margin;
      const openUp = spaceBelow < preferredHeight && spaceAbove > spaceBelow;
      const maxHeight = Math.max(160, Math.min(preferredHeight, openUp ? spaceAbove : spaceBelow));
      setRect({
         top: openUp ? r.top - margin : r.bottom + margin,
         left: r.left,
         width: r.width,
         openUp,
         maxHeight,
      });
   }, []);

   useLayoutEffect(() => {
      if (open) measure();
   }, [open, measure]);

   useEffect(() => {
      if (!open) return;
      const onResize = () => measure();
      const onScroll = () => measure();
      window.addEventListener('resize', onResize);
      window.addEventListener('scroll', onScroll, true);
      return () => {
         window.removeEventListener('resize', onResize);
         window.removeEventListener('scroll', onScroll, true);
      };
   }, [open, measure]);

   // Close on outside click (trigger OR portaled dropdown)
   useEffect(() => {
      if (!open) return;
      const handleClick = (e: MouseEvent) => {
         const target = e.target as Node;
         const insideTrigger = triggerRef.current?.contains(target);
         const insideDropdown = dropdownRef.current?.contains(target);
         if (!insideTrigger && !insideDropdown) {
            setOpen(false);
            setSearch('');
         }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
   }, [open]);

   useEffect(() => {
      if (open && searchable && searchRef.current) {
         searchRef.current.focus();
      }
   }, [open, searchable]);

   const filteredOptions = useMemo(() => {
      if (!search) return options;
      return options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
   }, [options, search]);

   const handleSelect = useCallback(
      (opt: ComboBoxOption) => {
         onChange(opt.value);
         setOpen(false);
         setSearch('');
      },
      [onChange],
   );

   const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
         setOpen(false);
         setSearch('');
      }
   }, []);

   const handleToggle = useCallback(() => {
      if (!disabled) setOpen((prev) => !prev);
   }, [disabled]);

   const dropdown =
      open && rect ? (
         <div
            ref={dropdownRef}
            onKeyDown={handleKeyDown}
            className="rounded-lg overflow-hidden animate-dropdown-enter"
            style={{
               position: 'fixed',
               top: rect.openUp ? undefined : rect.top,
               bottom: rect.openUp ? window.innerHeight - rect.top : undefined,
               left: rect.left,
               width: rect.width,
               zIndex: 1000,
               background: 'var(--surface-paper)',
               border: '1px solid var(--border-default)',
               boxShadow: 'var(--shadow-lg)',
               maxHeight: rect.maxHeight,
               display: 'flex',
               flexDirection: 'column',
            }}
         >
            {searchable && (
               <div
                  className="px-2.5 pt-2.5 pb-1.5 shrink-0"
                  style={{ borderBottom: '1px solid var(--border-default)' }}
               >
                  <div className="relative">
                     <SearchIcon
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                        style={{ color: 'var(--text-hint)' }}
                     />
                     <input
                        ref={searchRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-md outline-none"
                        style={{
                           background: 'var(--surface-low)',
                           border: '1px solid var(--border-default)',
                           color: 'var(--text-primary)',
                        }}
                     />
                  </div>
               </div>
            )}

            <ul className="overflow-y-auto py-1 flex-1 min-h-0">
               {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => {
                     const isSelected = opt.value === value;
                     return (
                        <li
                           key={opt.value}
                           onClick={() => handleSelect(opt)}
                           className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors"
                           style={{
                              background: isSelected ? 'var(--surface-medium)' : 'transparent',
                              color: 'var(--text-primary)',
                           }}
                           onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'var(--surface-low)';
                           }}
                           onMouseLeave={(e) => {
                              e.currentTarget.style.background = isSelected
                                 ? 'var(--surface-medium)'
                                 : 'transparent';
                           }}
                        >
                           <span className="w-4 shrink-0">
                              {isSelected && (
                                 <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ color: 'var(--color-secondary)' }}
                                 >
                                    <polyline points="20 6 9 17 4 12" />
                                 </svg>
                              )}
                           </span>
                           <span className={isSelected ? 'font-semibold' : 'font-normal'}>{opt.label}</span>
                        </li>
                     );
                  })
               ) : (
                  <li className="px-3 py-4 text-xs text-center" style={{ color: 'var(--text-hint)' }}>
                     {noResultsText}
                  </li>
               )}
            </ul>
         </div>
      ) : null;

   return (
      <div className={cn('relative w-full', className)}>
         <button
            ref={triggerRef}
            type="button"
            onClick={handleToggle}
            disabled={disabled}
            className={cn(
               'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-all',
               disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            )}
            style={{
               background: 'var(--surface-low)',
               border: error ? '1.5px solid #ef4444' : '1px solid var(--border-strong)',
               color: selectedOption ? 'var(--text-primary)' : 'var(--text-hint)',
            }}
         >
            <span className="truncate">{selectedOption?.label ?? placeholder}</span>
            <svg
               width="14"
               height="14"
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               strokeWidth="2"
               strokeLinecap="round"
               strokeLinejoin="round"
               className={cn('shrink-0 ml-2 transition-transform duration-200', open ? 'rotate-180' : '')}
               style={{ color: 'var(--text-hint)' }}
            >
               <polyline points="6 9 12 15 18 9" />
            </svg>
         </button>

         {mounted && dropdown ? createPortal(dropdown, document.body) : null}
      </div>
   );
};

export { ComboBox };
