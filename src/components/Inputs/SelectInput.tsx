import React, { useState, useRef, useEffect, useMemo } from 'react';
import { withFormsy } from 'formsy-react';
import { SearchIcon } from '@/components/Icons';

interface Option {
   value: string;
   label: string;
}

interface SelectInputProps {
   label?: string;
   name: string;
   value?: string;
   required?: boolean;
   className?: string;
   placeholder?: string;
   options: Option[];
   searchable?: boolean;
   setValue: (value: string) => void;
   onValueChange?: (value: string) => void;
   errorMessage?: string;
   isPristine?: boolean;
}

const SelectInput: React.FC<SelectInputProps> = (props) => {
   const {
      label,
      required,
      className,
      placeholder = 'Select an option',
      options,
      searchable = true,
      errorMessage,
      isPristine,
   } = props;

   const [open, setOpen] = useState(false);
   const [search, setSearch] = useState('');
   const wrapperRef = useRef<HTMLDivElement>(null);

   const selectedOption = options.find((o) => o.value === props.value);

   // Close on outside click
   useEffect(() => {
      const handleClick = (e: MouseEvent) => {
         if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
            setOpen(false);
            setSearch('');
         }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
   }, []);

   const filteredOptions = useMemo(() => {
      if (!search) return options;
      return options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
   }, [options, search]);

   const handleSelect = (opt: Option) => {
      props.setValue(opt.value);
      props.onValueChange?.(opt.value);
      setOpen(false);
      setSearch('');
   };

   const hasError = errorMessage && !isPristine;

   return (
      <div ref={wrapperRef} className={`my-3 w-full relative ${className ?? ''}`}>
         {label && (
            <label className="block md:text-sm text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
               {required ? `${label}*` : label}
            </label>
         )}

         {/* Trigger */}
         <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-all cursor-pointer"
            style={{
               background: 'var(--surface-low)',
               border: hasError ? '1.5px solid #ef4444' : '1px solid var(--border-strong)',
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
               className={`shrink-0 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
               style={{ color: 'var(--text-hint)' }}
            >
               <polyline points="6 9 12 15 18 9" />
            </svg>
         </button>

         {hasError && <span className="text-red-500 text-xs mt-1 block">{errorMessage}</span>}

         {/* Dropdown */}
         {open && (
            <div
               className="absolute z-50 mt-1.5 w-full rounded-lg overflow-hidden animate-dropdown-enter"
               style={{
                  background: 'var(--surface-paper)',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-lg)',
               }}
            >
               {/* Search */}
               {searchable && (
                  <div className="px-2.5 pt-2.5 pb-1.5" style={{ borderBottom: '1px solid var(--border-default)' }}>
                     <div className="relative">
                        <SearchIcon
                           className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                           style={{ color: 'var(--text-hint)' }}
                        />
                        <input
                           type="text"
                           value={search}
                           onChange={(e) => setSearch(e.target.value)}
                           placeholder="Search..."
                           autoFocus
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

               {/* Options list */}
               <ul className="max-h-48 overflow-y-auto py-1">
                  {filteredOptions.length > 0 ? (
                     filteredOptions.map((opt) => {
                        const isSelected = opt.value === props.value;
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
                                 e.currentTarget.style.background = isSelected ? 'var(--surface-medium)' : 'transparent';
                              }}
                           >
                              {/* Check mark for selected */}
                              <span className="w-4 shrink-0">
                                 {isSelected && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-secondary)' }}>
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
                        No results found
                     </li>
                  )}
               </ul>
            </div>
         )}
      </div>
   );
};

export default withFormsy(SelectInput);
