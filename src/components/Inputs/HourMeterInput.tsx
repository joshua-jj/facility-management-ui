import React, { useState, useEffect, useCallback } from 'react';
import { withFormsy } from 'formsy-react';

/**
 * Generator hour meter input — mimics the XXXX.X format used on
 * industrial diesel generators (Mikano, Caterpillar, Cummins, etc.)
 *
 * - Displays with one decimal place (tenths of an hour = 6 min)
 * - Shows a visual hour meter gauge
 * - Helper text shows hours + minutes interpretation
 */

interface HourMeterInputProps {
   label?: string;
   name: string;
   value?: string;
   required?: boolean;
   className?: string;
   placeholder?: string;
   setValue: (value: string) => void;
   onValueChange?: (value: string) => void;
   errorMessage?: string;
   isPristine?: boolean;
}

function formatHourMeter(raw: string): string {
   const cleaned = raw.replace(/[^0-9.]/g, '');
   const parts = cleaned.split('.');
   const whole = parts[0] || '';
   const decimal = parts.length > 1 ? parts[1].slice(0, 1) : '';
   if (decimal) return `${whole}.${decimal}`;
   if (cleaned.endsWith('.')) return `${whole}.`;
   return whole;
}

function hoursToReadable(val: string): string {
   const num = parseFloat(val);
   if (isNaN(num) || num <= 0) return '';
   const wholeHours = Math.floor(num);
   const tenths = Math.round((num - wholeHours) * 10);
   const minutes = tenths * 6;

   const parts: string[] = [];
   if (wholeHours > 0) {
      parts.push(`${wholeHours.toLocaleString()} hr${wholeHours !== 1 ? 's' : ''}`);
   }
   if (minutes > 0) {
      parts.push(`${minutes} min`);
   }
   return parts.join(' ') || '0 hrs';
}

const HourMeterInput: React.FC<HourMeterInputProps> = (props) => {
   const { label, required, className, placeholder, errorMessage, isPristine } = props;

   const [displayValue, setDisplayValue] = useState('');

   useEffect(() => {
      if (props.value) {
         setDisplayValue(formatHourMeter(String(props.value)));
      }
   }, []); // eslint-disable-line react-hooks/exhaustive-deps

   const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
         const formatted = formatHourMeter(e.target.value);
         setDisplayValue(formatted);
         props.setValue(formatted);
         props.onValueChange?.(formatted);
      },
      [props],
   );

   const readable = hoursToReadable(displayValue);
   const hasError = errorMessage && !isPristine;

   // Visual gauge percentage (0-9999.9 range)
   const numVal = parseFloat(displayValue) || 0;
   const gaugePercent = Math.min((numVal / 10000) * 100, 100);

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
            {/* Hour meter icon */}
            <div
               className="flex items-center justify-center px-2.5 py-2.5 shrink-0"
               style={{ borderRight: '1px solid var(--border-default)', background: 'var(--surface-medium)' }}
            >
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-hint)' }}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
               </svg>
            </div>

            {/* Input */}
            <input
               type="text"
               inputMode="decimal"
               value={displayValue}
               onChange={handleChange}
               placeholder={placeholder ?? '0000.0'}
               required={required}
               className="flex-1 px-3 py-2.5 text-sm font-mono tracking-wider outline-none bg-transparent"
               style={{ color: 'var(--text-primary)' }}
               maxLength={7}
            />

            {/* Unit label */}
            <span
               className="pr-3 text-[0.65rem] font-semibold uppercase shrink-0"
               style={{ color: 'var(--text-hint)' }}
            >
               HRS
            </span>
         </div>

         {/* Gauge bar */}
         {numVal > 0 && (
            <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-medium)' }}>
               <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                     width: `${gaugePercent}%`,
                     background: gaugePercent > 80 ? '#ef4444' : gaugePercent > 50 ? '#f59e0b' : 'var(--color-secondary)',
                  }}
               />
            </div>
         )}

         {/* Error */}
         {hasError && <span className="text-red-500 text-xs mt-1 block">{errorMessage}</span>}

         {/* Helper text — readable interpretation */}
         {readable && (
            <p className="text-[0.65rem] mt-1 italic" style={{ color: 'var(--text-hint)' }}>
               {displayValue} = {readable} of runtime
            </p>
         )}
      </div>
   );
};

export default withFormsy(HourMeterInput);
