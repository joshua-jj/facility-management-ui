import React from 'react';
import { format } from 'date-fns';

/**
 * Daily Report trigger + today's date pill. Renders in the Dashboard
 * PageHeader's `action` slot.
 *
 * Purely presentational — the parent owns the export logic and passes
 * it in via `onExport`. `loading` disables the button while a CSV
 * export is in flight to prevent double-clicks creating duplicate
 * downloads.
 */
interface DailyReportActionProps {
   onExport: () => void;
   loading?: boolean;
}

const DailyReportAction: React.FC<DailyReportActionProps> = ({ onExport, loading = false }) => {
   const today = format(new Date(), 'EEEE, MMMM d, yyyy');
   return (
      <div className="flex items-center gap-2">
         <button
            type="button"
            onClick={onExport}
            disabled={loading}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F2552] dark:text-white/85 bg-[var(--surface-medium)] hover:bg-[var(--surface-high)] disabled:opacity-60 disabled:cursor-not-allowed px-3 py-2 rounded-md transition-colors cursor-pointer"
         >
            <svg
               width="14"
               height="14"
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               strokeWidth="2"
               strokeLinecap="round"
               strokeLinejoin="round"
            >
               <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
               <polyline points="7 10 12 15 17 10" />
               <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {loading ? 'Exporting…' : 'Daily Report'}
         </button>
         <span className="text-xs font-semibold uppercase tracking-wider text-[#0F2552]/70 dark:text-white/70 bg-[var(--surface-medium)] px-3 py-2 rounded-md tabular-nums">
            {today.toUpperCase()}
         </span>
      </div>
   );
};

export default DailyReportAction;
