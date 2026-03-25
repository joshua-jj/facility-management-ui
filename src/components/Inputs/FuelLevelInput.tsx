import React, { useState, useEffect, useCallback } from 'react';
import { withFormsy } from 'formsy-react';

/**
 * Diesel fuel level input — records tank level in litres
 * as read from the generator's fuel gauge.
 *
 * - Formats with thousand separator for large tanks
 * - Shows a visual fuel gauge bar
 * - Helper text shows the litre value
 */

interface FuelLevelInputProps {
   label?: string;
   name: string;
   value?: string;
   required?: boolean;
   className?: string;
   placeholder?: string;
   maxCapacity?: number;
   setValue: (value: string) => void;
   onValueChange?: (value: string) => void;
   errorMessage?: string;
   isPristine?: boolean;
}

function formatLitres(raw: string): string {
   const cleaned = raw.replace(/[^0-9]/g, '');
   return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function stripCommas(val: string): string {
   return val.replace(/,/g, '');
}

const FuelLevelInput: React.FC<FuelLevelInputProps> = (props) => {
   const { label, required, className, placeholder, maxCapacity = 2000, errorMessage, isPristine } = props;

   const [displayValue, setDisplayValue] = useState('');

   useEffect(() => {
      if (props.value) {
         setDisplayValue(formatLitres(stripCommas(String(props.value))));
      }
   }, []); // eslint-disable-line react-hooks/exhaustive-deps

   const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
         const raw = e.target.value.replace(/[^0-9,]/g, '');
         const formatted = formatLitres(stripCommas(raw));
         setDisplayValue(formatted);

         const numericValue = stripCommas(formatted);
         props.setValue(numericValue);
         props.onValueChange?.(numericValue);
      },
      [props],
   );

   const numVal = parseInt(stripCommas(displayValue)) || 0;
   const fillPercent = Math.min((numVal / maxCapacity) * 100, 100);
   const hasError = errorMessage && !isPristine;

   // Fuel gauge color
   const gaugeColor =
      fillPercent <= 15 ? '#ef4444' : fillPercent <= 30 ? '#f59e0b' : '#22c55e';

   return (
      <div className={`my-3 w-full ${className ?? ''}`}>
         {label && (
            <label className="block md:text-sm text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
               {required ? `${label}*` : label}
            </label>
         )}

         <div
            className="flex items-center rounded-lg overflow-hidden transition-all"
            style={{
               border: hasError ? '1.5px solid #ef4444' : '1px solid var(--border-strong)',
               background: 'var(--surface-low)',
            }}
         >
            {/* Fuel pump icon */}
            <div
               className="flex items-center justify-center px-2.5 py-2.5 shrink-0"
               style={{ borderRight: '1px solid var(--border-default)', background: 'var(--surface-medium)' }}
            >
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-hint)' }}>
                  <path d="M3 22V6a2 2 0 012-2h8a2 2 0 012 2v16" />
                  <path d="M3 22h12" />
                  <path d="M15 10h2a2 2 0 012 2v2a2 2 0 002 2h0" />
                  <path d="M7 10h4" />
                  <path d="M21 6v10" />
               </svg>
            </div>

            {/* Input */}
            <input
               type="text"
               inputMode="numeric"
               value={displayValue}
               onChange={handleChange}
               placeholder={placeholder ?? '0'}
               required={required}
               className="flex-1 px-3 py-2.5 text-sm font-mono tracking-wider outline-none bg-transparent"
               style={{ color: 'var(--text-primary)' }}
            />

            {/* Unit label */}
            <span
               className="pr-3 text-[0.65rem] font-semibold uppercase shrink-0"
               style={{ color: 'var(--text-hint)' }}
            >
               Litres
            </span>
         </div>

         {/* Fuel gauge bar */}
         {numVal > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
               <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-medium)' }}>
                  <div
                     className="h-full rounded-full transition-all duration-500"
                     style={{ width: `${fillPercent}%`, background: gaugeColor }}
                  />
               </div>
               <span className="text-[0.55rem] font-semibold tabular-nums shrink-0" style={{ color: gaugeColor }}>
                  {Math.round(fillPercent)}%
               </span>
            </div>
         )}

         {/* Error */}
         {hasError && <span className="text-red-500 text-xs mt-1 block">{errorMessage}</span>}

         {/* Helper text */}
         {numVal > 0 && (
            <p className="text-[0.65rem] mt-1 italic" style={{ color: 'var(--text-hint)' }}>
               {displayValue} litres {fillPercent <= 15 ? '— Low fuel!' : fillPercent <= 30 ? '— Getting low' : ''}
            </p>
         )}
      </div>
   );
};

export default withFormsy(FuelLevelInput);
