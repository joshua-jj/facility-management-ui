import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { withFormsy } from 'formsy-react';

// ── Country data ──

interface Country {
   code: string;
   name: string;
   dial: string;
   flag: string;
   format: string; // placeholder mask
   maxDigits: number;
}

const COUNTRIES: Country[] = [
   { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬', format: '803 000 0000', maxDigits: 10 },
   { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸', format: '(201) 555-0123', maxDigits: 10 },
   { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧', format: '7911 123456', maxDigits: 10 },
   { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭', format: '23 123 4567', maxDigits: 9 },
   { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪', format: '712 345678', maxDigits: 9 },
   { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦', format: '71 234 5678', maxDigits: 9 },
   { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳', format: '98765 43210', maxDigits: 10 },
   { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦', format: '(604) 555-0123', maxDigits: 10 },
   { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪', format: '50 123 4567', maxDigits: 9 },
   { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪', format: '170 1234567', maxDigits: 11 },
];

// ── Format helpers ──

function formatPhone(raw: string, country: Country): string {
   const digits = raw.replace(/\D/g, '').slice(0, country.maxDigits);

   if (country.code === 'NG') {
      // Format: 803 000 0000
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
   }

   if (country.code === 'US' || country.code === 'CA') {
      // Format: (201) 555-0123
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
   }

   // Generic: group by 3s
   return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

function stripFormat(val: string): string {
   return val.replace(/\D/g, '');
}

// ── Component ──

interface PhoneInputProps {
   label?: string;
   name: string;
   value?: string;
   required?: boolean;
   className?: string;
   placeholder?: string;
   defaultCountry?: string;
   /** 'international' → +234803..., 'local' → 0803..., 'raw' → 234803... */
   outputFormat?: 'international' | 'local' | 'raw';
   setValue: (value: string) => void;
   onValueChange?: (value: string) => void;
   errorMessage?: string;
   isPristine?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = (props) => {
   const { label, required, className, errorMessage, isPristine, defaultCountry = 'NG', outputFormat = 'local' } = props;

   const buildOutput = (digits: string, c: Country): string => {
      if (!digits) return '';
      const dialDigits = c.dial.replace('+', '');
      switch (outputFormat) {
         case 'international': return `${c.dial}${digits}`;
         case 'raw': return `${dialDigits} ${formatPhone(digits, c)}`;
         case 'local':
         default: return `0${digits}`;
      }
   };

   const [country, setCountry] = useState<Country>(
      () => COUNTRIES.find((c) => c.code === defaultCountry) ?? COUNTRIES[0],
   );
   const [displayValue, setDisplayValue] = useState('');
   const [dropdownOpen, setDropdownOpen] = useState(false);
   const [search, setSearch] = useState('');
   const wrapperRef = useRef<HTMLDivElement>(null);

   // Init from props. Round-tripped values can carry the country dial
   // digits as a leading prefix (e.g., 'raw' output writes '234 818 ...'
   // for NG). Strip the dial digits and any leading 0 (local-format
   // prefix) so we end up with a clean national subscriber number that
   // formatPhone can render against the country's mask.
   useEffect(() => {
      if (props.value) {
         let raw = stripFormat(String(props.value));
         const dialDigits = country.dial.replace('+', '');
         if (dialDigits && raw.startsWith(dialDigits)) {
            raw = raw.slice(dialDigits.length);
         }
         if (raw.startsWith('0')) {
            raw = raw.slice(1);
         }
         setDisplayValue(formatPhone(raw, country));
         props.setValue(buildOutput(raw, country));
      }
   }, []); // eslint-disable-line react-hooks/exhaustive-deps

   // Close dropdown on outside click
   useEffect(() => {
      const handler = (e: MouseEvent) => {
         if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
            setDropdownOpen(false);
            setSearch('');
         }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
   }, []);

   const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
         const raw = stripFormat(e.target.value);
         const formatted = formatPhone(raw, country);
         setDisplayValue(formatted);

         const output = buildOutput(raw, country);
         props.setValue(output);
         props.onValueChange?.(output);
      },
      [country, props],
   );

   const handleCountrySelect = (c: Country) => {
      setCountry(c);
      setDropdownOpen(false);
      setSearch('');
      // Re-format with new country
      const raw = stripFormat(displayValue);
      const formatted = formatPhone(raw, c);
      setDisplayValue(formatted);
      const output = buildOutput(raw, c);
      props.setValue(output);
      props.onValueChange?.(output);
   };

   const filteredCountries = useMemo(() => {
      if (!search) return COUNTRIES;
      const q = search.toLowerCase();
      return COUNTRIES.filter(
         (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q),
      );
   }, [search]);

   const digits = stripFormat(displayValue);
   const isValid = digits.length >= 7;
   const hasError = errorMessage && !isPristine;

   return (
      <div ref={wrapperRef} className={`my-3 w-full relative ${className ?? ''}`}>
         {label && (
            <label className="block md:text-sm text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
               {required ? `${label}*` : label}
            </label>
         )}

         <div
            className="flex items-center rounded-lg overflow-visible transition-all"
            style={{
               border: hasError ? '1.5px solid #ef4444' : '1px solid var(--border-strong)',
               background: 'var(--surface-low)',
            }}
         >
            {/* Country selector */}
            <button
               type="button"
               onClick={() => setDropdownOpen((p) => !p)}
               className="flex items-center gap-1.5 px-2.5 py-2.5 shrink-0 cursor-pointer transition-colors"
               style={{ borderRight: '1px solid var(--border-default)', background: 'var(--surface-medium)' }}
            >
               <span className="text-base leading-none">{country.flag}</span>
               <span className="text-[0.65rem] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {country.dial}
               </span>
               <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--text-hint)' }}
               >
                  <polyline points="6 9 12 15 18 9" />
               </svg>
            </button>

            {/* Phone input */}
            <input
               type="tel"
               inputMode="tel"
               value={displayValue}
               onChange={handleChange}
               placeholder={country.format}
               required={required}
               className="flex-1 px-3 py-2.5 text-sm tracking-wide outline-none bg-transparent"
               style={{ color: 'var(--text-primary)' }}
            />

            {/* Validation indicator */}
            {digits.length > 0 && (
               <span className="pr-3 shrink-0">
                  {isValid ? (
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                     </svg>
                  ) : (
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--text-disabled)' }}>
                        <circle cx="12" cy="12" r="10" /><path d="M12 8h.01M12 12v4" />
                     </svg>
                  )}
               </span>
            )}
         </div>

         {/* Error */}
         {hasError && <span className="text-red-500 text-xs mt-1 block">{errorMessage}</span>}

         {/* Helper text */}
         {digits.length > 0 && (
            <p className="text-[0.65rem] mt-1 italic" style={{ color: 'var(--text-hint)' }}>
               {country.flag} {country.dial} {displayValue}
               {isValid && ' — Valid number'}
            </p>
         )}

         {/* Country dropdown */}
         {dropdownOpen && (
            <div
               className="absolute z-50 mt-1.5 left-0 rounded-lg overflow-hidden animate-dropdown-enter"
               style={{
                  background: 'var(--surface-paper)',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-lg)',
                  width: 280,
                  top: '100%',
               }}
            >
               {/* Search */}
               <div className="px-2.5 pt-2.5 pb-1.5" style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <input
                     type="text"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     placeholder="Search country..."
                     autoFocus
                     className="w-full px-3 py-2 text-xs rounded-md outline-none"
                     style={{
                        background: 'var(--surface-low)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                     }}
                  />
               </div>

               {/* Country list */}
               <ul className="max-h-52 overflow-y-auto py-1">
                  {filteredCountries.map((c) => {
                     const isSelected = c.code === country.code;
                     return (
                        <li
                           key={c.code}
                           onClick={() => handleCountrySelect(c)}
                           className="flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer transition-colors"
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
                           <span className="text-base leading-none">{c.flag}</span>
                           <span className="flex-1 font-medium">{c.name}</span>
                           <span style={{ color: 'var(--text-hint)' }}>{c.dial}</span>
                           {isSelected && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: 'var(--color-secondary)' }}>
                                 <polyline points="20 6 9 17 4 12" />
                              </svg>
                           )}
                        </li>
                     );
                  })}
                  {filteredCountries.length === 0 && (
                     <li className="px-3 py-4 text-xs text-center" style={{ color: 'var(--text-hint)' }}>
                        No countries found
                     </li>
                  )}
               </ul>
            </div>
         )}
      </div>
   );
};

export default withFormsy(PhoneInput);
