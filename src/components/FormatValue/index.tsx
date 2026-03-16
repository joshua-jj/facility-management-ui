import React from 'react';

/**
 * Format a phone number for display.
 * Converts local formats to international:
 *   08170761459   → +234 817 076 1459
 *   234 817 076 1459 → +234 817 076 1459
 *   +2348170761459 → +234 817 076 1459
 */
export function formatPhoneDisplay(phone?: string | null): string {
   if (!phone) return '—';
   let digits = String(phone).replace(/[^0-9]/g, '');

   // If starts with 0, assume Nigeria local — replace 0 with 234
   if (digits.startsWith('0') && digits.length >= 10) {
      digits = '234' + digits.slice(1);
   }

   // If starts with country code (234), format it
   if (digits.startsWith('234') && digits.length >= 13) {
      return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
   }

   // If starts with 1 (US/CA)
   if (digits.startsWith('1') && digits.length === 11) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
   }

   // Generic: add + and group by 3s
   if (digits.length >= 10) {
      return '+' + digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
   }

   return phone;
}

/**
 * Format a number with thousand separators.
 *   20000 → 20,000
 *   1500000 → 1,500,000
 */
export function formatNumber(value?: string | number | null): string {
   if (value === null || value === undefined || value === '') return '—';
   const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
   if (isNaN(num)) return String(value);
   return num.toLocaleString();
}

/**
 * Format currency with symbol and thousand separators.
 *   20000 → ₦20,000
 */
export function formatCurrency(value?: string | number | null, currency: 'NGN' | 'USD' = 'NGN'): string {
   if (value === null || value === undefined || value === '') return '—';
   const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
   if (isNaN(num)) return String(value);
   const symbol = currency === 'NGN' ? '₦' : '$';
   return `${symbol}${num.toLocaleString()}`;
}

// ── React Components ──

export const PhoneDisplay: React.FC<{ value?: string | null; className?: string }> = ({ value, className = '' }) => (
   <span className={className} style={{ color: 'var(--text-primary)' }}>
      {formatPhoneDisplay(value)}
   </span>
);

export const NumberDisplay: React.FC<{ value?: string | number | null; className?: string }> = ({ value, className = '' }) => (
   <span className={`tabular-nums ${className}`}>{formatNumber(value)}</span>
);

export const CurrencyDisplay: React.FC<{ value?: string | number | null; currency?: 'NGN' | 'USD'; className?: string }> = ({
   value,
   currency = 'NGN',
   className = '',
}) => (
   <span className={`tabular-nums ${className}`}>{formatCurrency(value, currency)}</span>
);
