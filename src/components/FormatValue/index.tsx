import React from 'react';

// ── Nigerian phone number normalisation ──
// Rules:
//   08xxxxxxxxx  → +2348xxxxxxxxx
//   234xxxxxxxxx → +234xxxxxxxxx
//   +234...      → left as-is
//   other        → left as-is
// Display format: +234 XXX XXX XXXX (11-digit Nigerian)
function normaliseNigerianPhone(raw: string): string {
   const digits = raw.replace(/\D/g, '');

   let e164 = digits;
   if (digits.startsWith('0') && digits.length >= 10) {
      e164 = '234' + digits.slice(1);
   } else if (digits.startsWith('234') && digits.length >= 13) {
      e164 = digits;
   } else if (raw.startsWith('+')) {
      e164 = digits;
   }

   // Format +234 XXX XXX XXXX for 13-digit E.164 Nigerian numbers
   if (e164.startsWith('234') && e164.length === 13) {
      const local = e164.slice(3); // 10 digits
      return `+234 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
   }

   // If already had + prefix but not Nigerian, return with + sign
   if (raw.startsWith('+')) {
      return `+${e164}`;
   }

   return raw;
}

interface PhoneDisplayProps {
   value: string;
}

export const PhoneDisplay: React.FC<PhoneDisplayProps> = ({ value }) => {
   if (!value) return <span>-</span>;
   return <span className="tabular-nums">{normaliseNigerianPhone(value)}</span>;
};

export const formatPhoneDisplay = (value: string | null | undefined): string => {
   if (!value) return '—';
   return normaliseNigerianPhone(value);
};

export const formatNumber = (value: number | null | undefined): string => {
   if (value === null || value === undefined) return '—';
   return value.toLocaleString();
};

export const formatCurrency = (value: number | null | undefined, currency = 'NGN'): string => {
   if (value === null || value === undefined) return '—';
   return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(value);
};

interface NumberDisplayProps {
   value: number | null | undefined;
   className?: string;
}

export const NumberDisplay: React.FC<NumberDisplayProps> = ({ value, className }) => {
   if (value === null || value === undefined) return <span className={className}>—</span>;
   return <span className={`tabular-nums${className ? ` ${className}` : ''}`}>{value.toLocaleString()}</span>;
};

interface CurrencyDisplayProps {
   value: number | null | undefined;
   currency?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ value, currency = 'NGN' }) => {
   if (value === null || value === undefined) return <span>—</span>;
   return (
      <span className="tabular-nums">
         {new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(value)}
      </span>
   );
};