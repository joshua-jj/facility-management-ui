import React from 'react';
import Card from '@/components/Cards/Card';
import SectionLabel from '@/components/Cards/SectionLabel';
import Sparkline from '@/components/dashboard/Sparkline';

interface MiniStat {
   label: string;
   percent: number;
   trend: 'up' | 'down';
   sparklineData: Array<{ date: string; value: number }>;
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
 * underneath (Approved / Declined). Each mini-stat uses the shared
 * Sparkline component — Sparkline expects `{date, value}` data so the
 * caller is responsible for reshaping the raw `{date, count}` time
 * series before passing it in.
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
         <div className="ml-auto h-10 w-24 shrink-0">
            <Sparkline
               data={stat.sparklineData}
               color={COLOR_TOKEN[stat.color]}
               height={40}
               showDelta={false}
            />
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
