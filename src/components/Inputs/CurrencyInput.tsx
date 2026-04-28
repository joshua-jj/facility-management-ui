import React, { useState, useCallback, useEffect } from 'react';
import { withFormsy } from 'formsy-react';

// ── Number to words converter ──

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

// ── Currency symbols ──

type CurrencyCode = 'NGN' | 'USD';

const CURRENCIES: { code: CurrencyCode; symbol: string; label: string }[] = [
   { code: 'NGN', symbol: '₦', label: 'Naira' },
   { code: 'USD', symbol: '$', label: 'Dollar' },
];

// ── Format number with commas ──

function formatWithCommas(value: string): string {
   const num = value.replace(/[^0-9.]/g, '');
   const [whole, decimal] = num.split('.');
   const formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
   return decimal !== undefined ? `${formatted}.${decimal}` : formatted;
}

function stripCommas(value: string): string {
   return value.replace(/,/g, '');
}

// ── Component ──

interface CurrencyInputProps {
   label?: string;
   name: string;
   value?: string;
   required?: boolean;
   className?: string;
   inputClass?: string;
   placeholder?: string;
   defaultCurrency?: CurrencyCode;
   setValue: (value: string) => void;
   onValueChange?: (value: string) => void;
   errorMessage?: string;
   isPristine?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = (props) => {
   const [currency, setCurrency] = useState<CurrencyCode>(props.defaultCurrency ?? 'NGN');
   const [displayValue, setDisplayValue] = useState('');

   const currencyInfo = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

   // Initialize from props.value. Without calling setValue here, Formsy
   // boots the field as "empty" and edits to a prefilled cost silently fail to save.
   useEffect(() => {
      if (props.value) {
         const cleaned = stripCommas(String(props.value));
         setDisplayValue(formatWithCommas(cleaned));
         props.setValue(cleaned);
      }
   }, []); // eslint-disable-line react-hooks/exhaustive-deps

   const rawNumber = parseFloat(stripCommas(displayValue)) || 0;
   // Currency names are invariant in the plural — 'Twenty Thousand Naira',
   // not 'Nairas'. Drop the auto-pluralization here.
   const wordsText =
      rawNumber > 0 ? `${numberToWords(rawNumber)} ${currencyInfo.label}` : '';

   const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
         const raw = e.target.value.replace(/[^0-9.,]/g, '');
         const formatted = formatWithCommas(raw);
         setDisplayValue(formatted);

         // Send the raw number (no commas) to Formsy
         const numericValue = stripCommas(raw);
         props.setValue(numericValue);
         props.onValueChange?.(numericValue);
      },
      [props],
   );

   const errorMessage = props.errorMessage;

   return (
      <div className={`my-3 w-full ${props.className ?? ''}`}>
         <label
            className="block md:text-sm text-xs mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
         >
            {props.required ? `${props.label}*` : props.label}
         </label>

         <div
            className="flex items-center rounded-lg overflow-hidden transition-all"
            style={{
               border: errorMessage && !props.isPristine ? '1.5px solid #ef4444' : '1px solid var(--border-strong)',
               background: 'var(--surface-low)',
            }}
         >
            {/* Currency selector */}
            <select
               value={currency}
               onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
               className="h-full px-2.5 py-2.5 text-sm font-semibold border-none outline-none cursor-pointer"
               style={{
                  background: 'var(--surface-medium)',
                  color: 'var(--text-primary)',
                  borderRight: '1px solid var(--border-default)',
               }}
            >
               {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                     {c.symbol} {c.code}
                  </option>
               ))}
            </select>

            {/* Number input */}
            <input
               type="text"
               inputMode="decimal"
               value={displayValue}
               onChange={handleChange}
               placeholder={props.placeholder ?? '0'}
               required={props.required}
               className={`flex-1 px-3 py-2.5 text-sm outline-none bg-transparent ${props.inputClass ?? ''}`}
               style={{ color: 'var(--text-primary)' }}
            />
         </div>

         {/* Error message */}
         {errorMessage && !props.isPristine && (
            <span className="text-red-500 text-xs mt-1 block">{errorMessage}</span>
         )}

         {/* Helper text — number in words */}
         {wordsText && (
            <p
               className="text-[0.65rem] mt-1.5 italic leading-snug"
               style={{ color: 'var(--color-secondary)' }}
            >
               {currencyInfo.symbol} {displayValue} — {wordsText}
            </p>
         )}
      </div>
   );
};

export default withFormsy(CurrencyInput);
