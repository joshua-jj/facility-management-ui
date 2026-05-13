import React from 'react';
import Link from 'next/link';
import Card from '@/components/Cards/Card';
import SectionLabel from '@/components/Cards/SectionLabel';

interface TotalItemsCardProps {
   count: number;
}

/**
 * "Total Items" snapshot card. Just a count + a deep-link out to
 * /admin/items. No deltas or sparklines — full leaderboard /
 * trend visualization lives on /admin/analytics.
 */
const TotalItemsCard: React.FC<TotalItemsCardProps> = ({ count }) => (
   <Card>
      <div className="flex items-start justify-between gap-3">
         <SectionLabel>Total Items</SectionLabel>
         <Link
            href="/admin/items"
            className="text-xs font-semibold text-[#0F2552] dark:text-white/80 bg-[var(--surface-medium)] hover:bg-[var(--surface-high)] px-3 py-1.5 rounded-md transition-colors"
         >
            View All
         </Link>
      </div>
      <div className="mt-4">
         <div className="text-lg font-semibold text-[#0F2552] dark:text-white/90">
            Total Item Count
         </div>
         <div className="text-xs text-[#0F2552]/45 dark:text-white/45 mt-1">
            Here is an overview of your stock
         </div>
      </div>
      <div className="mt-6">
         <div className="text-5xl font-bold text-[#0F2552] dark:text-white tracking-tight tabular-nums">
            {count.toLocaleString('en-US')}
         </div>
         <div className="text-xs text-[#0F2552]/50 dark:text-white/45 mt-1">Items</div>
      </div>
   </Card>
);

export default TotalItemsCard;
