import React from 'react';

export type AnalyticsPeriod = 'week' | 'month' | 'year';

interface PeriodToggleProps {
   value: AnalyticsPeriod;
   onChange: (next: AnalyticsPeriod) => void;
}

const OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
   { value: 'week', label: 'Week' },
   { value: 'month', label: 'Month' },
   { value: 'year', label: 'Year' },
];

const PeriodToggle: React.FC<PeriodToggleProps> = ({ value, onChange }) => (
   <div className="inline-flex items-center rounded-md bg-[var(--surface-medium)] p-1 gap-1 border border-[var(--border-default)]">
      {OPTIONS.map((o) => {
         const active = o.value === value;
         return (
            <button
               key={o.value}
               type="button"
               onClick={() => onChange(o.value)}
               className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  active
                     ? 'bg-[var(--surface-high)] text-[#0F2552] dark:text-white'
                     : 'text-[#0F2552]/55 dark:text-white/55 hover:text-[#0F2552] dark:hover:text-white'
               }`}
            >
               {o.label}
            </button>
         );
      })}
   </div>
);

export default PeriodToggle;
