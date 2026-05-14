import React from 'react';
import Card from '@/components/Cards/Card';
import SectionLabel from '@/components/Cards/SectionLabel';

interface MiniStat {
   label: string;
   percent: number;
   trend: 'up' | 'down';
   color: 'mint' | 'coral';
}

interface TotalRequestsCardProps {
   total: number;
   approved: MiniStat;
   declined: MiniStat;
}

const COLOR_TOKEN: Record<MiniStat['color'], string> = {
   mint: 'var(--chart-mint)',
   coral: 'var(--chart-coral)',
};

/**
 * "Total Requests" headline card. Big number on top, two mini-stats
 * underneath (Approved / Declined). Per the 2026-05-14 dashboard
 * data-defects fix (spec §6.1) the mini-stats no longer render a
 * sparkline — both rows previously drew the same total-volume series,
 * which was misleading since the series was the overall request total
 * rather than approved-only / declined-only deltas. The colored dot
 * (mint / coral) keeps the visual distinction without implying a trend
 * the data doesn't actually support.
 */
const TotalRequestsCard: React.FC<TotalRequestsCardProps> = ({ total, approved, declined }) => {
   const renderMini = (stat: MiniStat) => (
      <div className="flex items-center gap-3 min-w-0">
         <span
            className="inline-block h-2 w-2 rounded-full shrink-0"
            style={{ background: COLOR_TOKEN[stat.color] }}
         />
         <div className="min-w-0">
            <div className="text-sm font-semibold text-[#0F2552] dark:text-white/85 tabular-nums">
               {stat.percent.toFixed(1)}%
            </div>
            <div className="text-[0.65rem] uppercase tracking-wider text-[#0F2552]/40 dark:text-white/35">
               {stat.label}
            </div>
         </div>
      </div>
   );

   return (
      <Card>
         <SectionLabel>Total Requests</SectionLabel>
         <div className="mt-5 mb-6">
            <div className="text-5xl font-bold text-[#0F2552] dark:text-white tracking-tight tabular-nums">
               {total.toLocaleString('en-US')}
            </div>
            <div className="text-xs text-[#0F2552]/50 dark:text-white/45 mt-1">Total Requests</div>
         </div>
         <div className="flex flex-col gap-4 pt-4 border-t border-[var(--border-default)]">
            {renderMini(approved)}
            {renderMini(declined)}
         </div>
      </Card>
   );
};

export default TotalRequestsCard;
