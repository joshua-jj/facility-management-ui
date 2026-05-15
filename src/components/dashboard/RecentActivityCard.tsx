import React from 'react';
import Link from 'next/link';
import Card from '@/components/Cards/Card';
import SectionLabel from '@/components/Cards/SectionLabel';

interface ActivityEntry {
   id: string | number;
   title: string;
   description: string;
   amount?: string;
   date: string;
}

interface RecentActivityCardProps {
   entries: ActivityEntry[];
   viewAllHref?: string;
}

/**
 * "Recent Activity" card. Driven by the maintenance-log slice on the
 * dashboard — the caller formats `amount` and `date` strings before
 * passing them in so the card stays presentational.
 */
const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
   entries,
   viewAllHref = '/admin/maintenance-log',
}) => (
   <Card>
      <div className="flex items-start justify-between gap-3 mb-4">
         <SectionLabel>Recent Activity</SectionLabel>
         <Link
            href={viewAllHref}
            className="text-xs font-semibold text-[#0F2552] dark:text-white/80 bg-[var(--surface-medium)] hover:bg-[var(--surface-high)] px-3 py-1.5 rounded-md transition-colors"
         >
            View Logs
         </Link>
      </div>
      {entries.length === 0 ? (
         <div className="py-8 text-center text-sm text-[#0F2552]/45 dark:text-white/45 italic">
            No activity yet.
         </div>
      ) : (
         <ul className="divide-y divide-[var(--border-default)]">
            {entries.map((entry) => (
               <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                     <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                           <span
                              className="inline-block h-1.5 w-1.5 rounded-full"
                              style={{ background: 'var(--chart-mint)' }}
                           />
                           <span className="text-sm font-semibold text-[#0F2552] dark:text-white/85">
                              {entry.title}
                           </span>
                        </div>
                        <div className="text-xs text-[#0F2552]/55 dark:text-white/55 mt-1 line-clamp-1">
                           {entry.description}
                        </div>
                        {entry.amount && (
                           <div className="text-[0.65rem] uppercase tracking-wider text-[#0F2552]/40 dark:text-white/35 mt-1 tabular-nums">
                              {entry.amount}
                           </div>
                        )}
                     </div>
                     <div className="text-xs text-[#0F2552]/45 dark:text-white/40 shrink-0 tabular-nums">
                        {entry.date}
                     </div>
                  </div>
               </li>
            ))}
         </ul>
      )}
   </Card>
);

export default RecentActivityCard;
