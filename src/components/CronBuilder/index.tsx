import React, { useState } from 'react';

/**
 * CronBuilder — a non-technical, guided editor for standard 5-field cron
 * expressions (minute hour day-of-month month day-of-week). Replicates the
 * tabbed click-to-pick UX of the falcon-uix CronEditor, adapted to:
 *   - standard 5-field cron (no Quartz seconds / `?`), since the API parses
 *     with cron-parser and stores 5-field strings like `0 3 * * *`
 *   - Tailwind + the EGFM gold/navy theme (no MUI)
 *
 * Controlled: `value` is the single source of truth (the edit page owns it).
 * Each pick assembles the 5 fields and calls `onChange`. Advanced tokens we
 * don't render as chips (step, range or list values such as every-N, 1-5 or
 * 1,3,5) are preserved verbatim in the assembled string and simply show no
 * highlighted chip.
 */

type FieldId = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

interface Option {
   value: string;
   label: string;
}

const EVERY = '*';

const numberOptions = (count: number, start: number, everyLabel: string): Option[] => [
   { value: EVERY, label: everyLabel },
   ...Array.from({ length: count }, (_, i) => {
      const n = i + start;
      return { value: String(n), label: String(n).padStart(2, '0') };
   }),
];

const MONTH_OPTIONS: Option[] = [
   { value: EVERY, label: 'Every month' },
   ...['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(
      (label, i) => ({ value: String(i + 1), label }),
   ),
];

// Standard cron day-of-week: 0 = Sunday … 6 = Saturday.
const DOW_OPTIONS: Option[] = [
   { value: EVERY, label: 'Any day' },
   ...['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((label, i) => ({
      value: String(i),
      label,
   })),
];

const TABS: { id: FieldId; label: string; options: Option[] }[] = [
   { id: 'minute', label: 'Minute', options: numberOptions(60, 0, 'Every minute') },
   { id: 'hour', label: 'Hour', options: numberOptions(24, 0, 'Every hour') },
   { id: 'dayOfMonth', label: 'Day of Month', options: numberOptions(31, 1, 'Every day') },
   { id: 'month', label: 'Month', options: MONTH_OPTIONS },
   { id: 'dayOfWeek', label: 'Day of Week', options: DOW_OPTIONS },
];

const ORDER: FieldId[] = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];

type Parts = Record<FieldId, string>;

const parseCron = (value: string): Parts => {
   const p = (value || '').trim().split(/\s+/);
   return {
      minute: p[0] || EVERY,
      hour: p[1] || EVERY,
      dayOfMonth: p[2] || EVERY,
      month: p[3] || EVERY,
      dayOfWeek: p[4] || EVERY,
   };
};

const assemble = (parts: Parts): string => ORDER.map((f) => parts[f]).join(' ');

const pad = (s: string) => s.padStart(2, '0');
const isPlain = (v: string) => /^\d+$/.test(v); // a single number we can describe

const MONTH_NAMES = MONTH_OPTIONS.slice(1).map((o) => o.label);
const DOW_NAMES = DOW_OPTIONS.slice(1).map((o) => o.label);

/**
 * Best-effort plain-English summary. The authoritative confirmation is the
 * "next executions" preview the page renders from the API; this just gives
 * the user a quick read on the common (single-value) cases.
 */
const describe = (parts: Parts): string => {
   const { minute, hour, dayOfMonth, month, dayOfWeek } = parts;

   // If any field uses an advanced token (step/range/list), don't pretend.
   if ([minute, hour, dayOfMonth, month, dayOfWeek].some((v) => v !== EVERY && !isPlain(v))) {
      return 'Custom schedule — see the next runs below for the exact times.';
   }

   const segments: string[] = [];

   if (hour !== EVERY && minute !== EVERY) segments.push(`at ${pad(hour)}:${pad(minute)}`);
   else if (hour !== EVERY) segments.push(`every minute past ${pad(hour)}:00`);
   else if (minute !== EVERY) segments.push(`at minute ${minute} of every hour`);
   else segments.push('every minute');

   if (dayOfWeek !== EVERY) segments.push(`on ${DOW_NAMES[Number(dayOfWeek)] ?? `day ${dayOfWeek}`}`);
   if (dayOfMonth !== EVERY) segments.push(`on the ${dayOfMonth}${ordinal(Number(dayOfMonth))} of the month`);
   if (month !== EVERY) segments.push(`in ${MONTH_NAMES[Number(month) - 1] ?? month}`);
   else if (dayOfMonth === EVERY && dayOfWeek === EVERY && (hour !== EVERY || minute !== EVERY))
      segments.push('every day');

   const text = segments.join(', ');
   return `Runs ${text}.`;
};

const ordinal = (n: number): string => {
   const s = ['th', 'st', 'nd', 'rd'];
   const v = n % 100;
   return s[(v - 20) % 10] || s[v] || s[0];
};

interface CronBuilderProps {
   value: string;
   onChange: (expression: string) => void;
   disabled?: boolean;
}

const CronBuilder: React.FC<CronBuilderProps> = ({ value, onChange, disabled }) => {
   const [activeTab, setActiveTab] = useState<FieldId>('minute');
   const parts = parseCron(value);
   const current = TABS.find((t) => t.id === activeTab)!;

   const pick = (field: FieldId, val: string) => {
      if (disabled) return;
      onChange(assemble({ ...parts, [field]: val }));
   };

   return (
      <div className="space-y-3">
         {/* Field tabs */}
         <div className="flex flex-wrap gap-1.5">
            {TABS.map((tab) => {
               const isActive = tab.id === activeTab;
               const setHere = parts[tab.id] !== EVERY;
               return (
                  <button
                     key={tab.id}
                     type="button"
                     onClick={() => setActiveTab(tab.id)}
                     className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                           ? 'bg-[#B28309] text-white'
                           : 'border border-gray-200 dark:border-white/10 text-[#0F2552]/70 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5'
                     }`}
                  >
                     {tab.label}
                     {setHere && !isActive && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#B28309]" />}
                  </button>
               );
            })}
         </div>

         {/* Options for the active field */}
         <div className="rounded-lg border border-gray-100 dark:border-white/8 bg-gray-50 dark:bg-white/[0.02] p-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 max-h-44 overflow-y-auto pr-1">
               {current.options.map((opt) => {
                  const selected = parts[activeTab] === opt.value;
                  return (
                     <button
                        key={opt.value}
                        type="button"
                        onClick={() => pick(activeTab, opt.value)}
                        disabled={disabled}
                        className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                           selected
                              ? 'bg-[#B28309] text-white'
                              : 'bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 text-[#0F2552]/80 dark:text-white/70 hover:border-[#B28309]/60'
                        } ${opt.value === EVERY ? 'col-span-3 sm:col-span-4 md:col-span-6' : ''}`}
                     >
                        {opt.label}
                     </button>
                  );
               })}
            </div>
         </div>

         {/* Plain-English summary */}
         <div className="rounded-lg bg-[#B28309]/5 border border-[#B28309]/20 px-3 py-2">
            <p className="text-xs text-[#0F2552] dark:text-white/80">{describe(parts)}</p>
            <p className="text-[0.65rem] text-gray-400 dark:text-white/40 mt-1 font-mono">
               {assemble(parts)}
            </p>
         </div>
      </div>
   );
};

export default CronBuilder;
