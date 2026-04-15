import React from 'react';

interface PhoneDisplayProps {
   value: string;
}

export const PhoneDisplay: React.FC<PhoneDisplayProps> = ({ value }) => {
   if (!value) return <span>-</span>;
   return <span className="tabular-nums">{value}</span>;
};

export const formatPhoneDisplay = (value: string | null | undefined): string => {
   if (!value) return '—';
   return value;
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
