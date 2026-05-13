import React from 'react';
import { format } from 'date-fns';
import Report from '@/components/Modals/Report';

/**
 * Daily Report trigger + today's date pill. Renders in the Dashboard
 * PageHeader's `action` slot. The Report modal itself is unchanged —
 * we're just pulling it into the Dashboard surface so the auth/
 * landing header doesn't have to be the only place to open it.
 *
 * The Report component renders a <button> wrapper around its children,
 * so `className` styles the trigger and `children` is its label.
 */
const DailyReportAction: React.FC = () => {
   const today = format(new Date(), 'EEEE, MMMM d, yyyy');
   return (
      <div className="flex items-center gap-2">
         <Report className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F2552] dark:text-white/85 bg-[var(--surface-medium)] hover:bg-[var(--surface-high)] px-3 py-2 rounded-md transition-colors cursor-pointer">
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
            Daily Report
         </Report>
         <span className="text-xs font-semibold uppercase tracking-wider text-[#0F2552]/70 dark:text-white/70 bg-[var(--surface-medium)] px-3 py-2 rounded-md tabular-nums">
            {today.toUpperCase()}
         </span>
      </div>
   );
};

export default DailyReportAction;
