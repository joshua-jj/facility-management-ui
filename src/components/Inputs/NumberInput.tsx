import React, { useState, useCallback, useEffect } from 'react';
import { withFormsy } from 'formsy-react';

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
   'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const SCALES = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

function chunkToWords(n: number): string {
   if (n === 0) return '';
   if (n < 20) return ONES[n];
   if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`;
   return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ' and ' + chunkToWords(n % 100) : ''}`;
}

function numberToWords(num: number): string {
   if (num === 0) return 'Zero';
   if (num < 0) return `Negative ${numberToWords(Math.abs(num))}`;

   const chunks: number[] = [];
   let n = Math.floor(num);
   while (n > 0) {
      chunks.push(n % 1000);
      n = Math.floor(n / 1000);
   }

   const parts = chunks
      .map((chunk, i) => {
         if (chunk === 0) return '';
         return `${chunkToWords(chunk)}${SCALES[i] ? ' ' + SCALES[i] : ''}`;
      })
      .filter(Boolean)
      .reverse();

   return parts.join(', ');
}

function formatWithCommas(value: string, allowDecimal: boolean): string {
   const cleaned = allowDecimal ? value.replace(/[^0-9.]/g, '') : value.replace(/[^0-9]/g, '');
   if (!cleaned) return '';
   const [whole, decimal] = cleaned.split('.');
   const formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
   return allowDecimal && decimal !== undefined ? `${formatted}.${decimal}` : formatted;
}

function stripCommas(value: string): string {
   return value.replace(/,/g, '');
}

interface NumberInputProps {
   label?: string;
   name: string;
   value?: string | number;
   required?: boolean;
   className?: string;
   inputClass?: string;
   placeholder?: string;
   min?: number;
   max?: number;
   allowDecimal?: boolean;
   showWords?: boolean;
   unitLabel?: string;
   setValue: (value: string) => void;
   onValueChange?: (value: string) => void;
   errorMessage?: string;
   isPristine?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = (props) => {
   const {
      label,
      required,
      className,
      inputClass,
      placeholder,
      allowDecimal = false,
      showWords = true,
      unitLabel,
      errorMessage,
      isPristine,
   } = props;

   const [displayValue, setDisplayValue] = useState('');

   useEffect(() => {
      if (props.value !== undefined && props.value !== null && props.value !== '') {
         const raw = stripCommas(String(props.value));
         setDisplayValue(formatWithCommas(raw, allowDecimal));
      }
   }, []); // eslint-disable-line react-hooks/exhaustive-deps

   const rawNumber = parseFloat(stripCommas(displayValue)) || 0;
   const wordsText =
      showWords && rawNumber > 0
         ? `${numberToWords(rawNumber)}${unitLabel ? ` ${unitLabel}${rawNumber !== 1 ? 's' : ''}` : ''}`
         : '';

   const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
         const formatted = formatWithCommas(e.target.value, allowDecimal);
         setDisplayValue(formatted);
         const numeric = stripCommas(formatted);
         props.setValue(numeric);
         props.onValueChange?.(numeric);
      },
      [props, allowDecimal],
   );

   const hasError = Boolean(errorMessage) && !isPristine;

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
            <input
               type="text"
               inputMode={allowDecimal ? 'decimal' : 'numeric'}
               value={displayValue}
               onChange={handleChange}
               placeholder={placeholder ?? '0'}
               required={required}
               className={`flex-1 px-3 py-2.5 text-sm outline-none bg-transparent ${inputClass ?? ''}`}
               style={{ color: 'var(--text-primary)' }}
            />
         </div>

         {hasError && <span className="text-red-500 text-xs mt-1 block">{errorMessage}</span>}

         {wordsText && (
            <p
               className="text-[0.65rem] mt-1.5 italic leading-snug"
               style={{ color: 'var(--color-secondary)' }}
            >
               {displayValue} — {wordsText}
            </p>
         )}
      </div>
   );
};

export default withFormsy(NumberInput);
