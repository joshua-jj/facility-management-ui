import React from 'react';
import { format } from 'date-fns';
import Card from '@/components/Cards/Card';
import {
   EmailStatus,
   NotificationDeliveriesQuery,
} from '@/types/notificationsAdmin.types';

/**
 * Filter bar for the SA-only notification deliveries page.
 *
 * Holds three filter dimensions:
 * - status (multi-select pill group, default = FAILED + PERMANENTLY_FAILED)
 * - date range (Last 7 days / Last 30 days presets — `from` and `to` are
 *   serialized as `yyyy-MM-dd` so the API's date-string parser is happy)
 * - recipient email (free-text, ILIKE on the API)
 *
 * Every filter mutation sets `page: 1` so paging-state doesn't leak
 * across filter changes.
 */
interface NotificationFiltersBarProps {
   query: NotificationDeliveriesQuery;
   onChange: (next: NotificationDeliveriesQuery) => void;
}

const STATUS_OPTIONS: { value: EmailStatus; label: string; dot: string }[] = [
   { value: EmailStatus.SENT, label: 'Sent', dot: 'var(--chart-mint)' },
   { value: EmailStatus.FAILED, label: 'Failed', dot: 'var(--badge-warning)' },
   {
      value: EmailStatus.PERMANENTLY_FAILED,
      label: 'Permanently failed',
      dot: 'var(--chart-coral)',
   },
   {
      value: EmailStatus.ABANDONED,
      label: 'Abandoned',
      dot: 'var(--text-secondary)',
   },
];

const DATE_RANGE_OPTIONS: { label: string; days: number }[] = [
   { label: 'Last 7 days', days: 7 },
   { label: 'Last 30 days', days: 30 },
];

/**
 * Curated list of entity types the system fires emails for today (per
 * the audit). Static rather than fetched because the option set is small
 * and rarely changes; new entity types added in the future will silently
 * miss filtering until added here, but the empty-string "All event
 * types" option keeps the page functional in the meantime.
 */
const ENTITY_TYPE_OPTIONS: { value: string; label: string }[] = [
   { value: '', label: 'All event types' },
   { value: 'maintenance-log', label: 'Maintenance log' },
   { value: 'generator-log', label: 'Generator log' },
   { value: 'incidence-log', label: 'Incidence log' },
   { value: 'request', label: 'Request' },
   { value: 'complaint', label: 'Complaint' },
];

const NotificationFiltersBar: React.FC<NotificationFiltersBarProps> = ({
   query,
   onChange,
}) => {
   const selectedStatuses = new Set<EmailStatus>(query.status ?? []);

   const toggleStatus = (status: EmailStatus) => {
      const next = new Set(selectedStatuses);
      if (next.has(status)) {
         next.delete(status);
      } else {
         next.add(status);
      }
      onChange({ ...query, status: Array.from(next), page: 1 });
   };

   const setDateRange = (days: number) => {
      const to = new Date();
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      onChange({
         ...query,
         from: format(from, 'yyyy-MM-dd'),
         to: format(to, 'yyyy-MM-dd'),
         page: 1,
      });
   };

   const clearDateRange = () => {
      const next = { ...query, page: 1 };
      delete next.from;
      delete next.to;
      onChange(next);
   };

   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...query, search: e.target.value, page: 1 });
   };

   const dateRangeActive = !!query.from || !!query.to;

   return (
      <Card className="mb-5">
         <div className="flex flex-col gap-4">
            {/* Status pills */}
            <div className="flex flex-wrap items-center gap-2">
               <span className="text-[0.65rem] uppercase tracking-widest font-semibold text-[#0F2552]/55 dark:text-white/45 mr-1">
                  Status
               </span>
               {STATUS_OPTIONS.map((opt) => {
                  const active = selectedStatuses.has(opt.value);
                  return (
                     <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleStatus(opt.value)}
                        className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-md border transition-colors cursor-pointer ${
                           active
                              ? 'border-[#B28309] bg-[#B28309]/10 text-[#0F2552] dark:text-white'
                              : 'border-[var(--border-default)] bg-transparent text-[#0F2552]/65 dark:text-white/55 hover:text-[#0F2552] dark:hover:text-white hover:border-[#B28309]/40'
                        }`}
                     >
                        <span
                           className="inline-block h-2 w-2 rounded-full mr-2"
                           style={{ background: opt.dot }}
                        />
                        {opt.label}
                     </button>
                  );
               })}
            </div>

            {/* Date range + search */}
            <div className="flex flex-wrap items-center gap-3">
               <div className="flex items-center gap-2">
                  <span className="text-[0.65rem] uppercase tracking-widest font-semibold text-[#0F2552]/55 dark:text-white/45">
                     Range
                  </span>
                  {DATE_RANGE_OPTIONS.map((opt) => (
                     <button
                        key={opt.days}
                        type="button"
                        onClick={() => setDateRange(opt.days)}
                        className="text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--border-default)] text-[#0F2552]/70 dark:text-white/65 hover:text-[#0F2552] dark:hover:text-white hover:border-[#B28309]/40 transition-colors cursor-pointer"
                     >
                        {opt.label}
                     </button>
                  ))}
                  {dateRangeActive && (
                     <button
                        type="button"
                        onClick={clearDateRange}
                        className="text-[0.65rem] uppercase tracking-wider font-semibold px-2 py-1.5 rounded-md text-[#0F2552]/45 dark:text-white/40 hover:text-[#0F2552] dark:hover:text-white cursor-pointer"
                     >
                        Clear
                     </button>
                  )}
               </div>

               <div className="ml-auto flex items-center gap-2">
                  <select
                     value={query.entityType ?? ''}
                     onChange={(e) =>
                        onChange({
                           ...query,
                           entityType: e.target.value || undefined,
                           page: 1,
                        })
                     }
                     className="text-sm px-3 py-2 rounded-md border border-[var(--border-default)] bg-transparent text-[#0F2552] dark:text-white outline-none focus:border-[#B28309]/60 transition-colors cursor-pointer"
                  >
                     {ENTITY_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                           {opt.label}
                        </option>
                     ))}
                  </select>

                  <div className="min-w-[200px] max-w-[360px]">
                     <input
                        type="search"
                        placeholder="Search recipient email..."
                        value={query.search ?? ''}
                        onChange={handleSearch}
                        className="w-full text-sm px-3 py-2 rounded-md border border-[var(--border-default)] bg-transparent text-[#0F2552] dark:text-white placeholder:text-[#0F2552]/35 dark:placeholder:text-white/30 outline-none focus:border-[#B28309]/60 transition-colors"
                     />
                  </div>
               </div>
            </div>
         </div>
      </Card>
   );
};

export default NotificationFiltersBar;
