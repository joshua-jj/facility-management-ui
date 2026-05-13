import React, { useMemo, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Dot, CartesianGrid } from 'recharts';
import Card from '@/components/Cards/Card';
import SectionLabel from '@/components/Cards/SectionLabel';

interface TrendPoint {
   date: string;
   count: number;
}

type Period = 7 | 14 | 30;

interface RequestTrendsCardProps {
   data: TrendPoint[];
   subtitle?: string;
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
   { value: 7, label: 'Last 7 Days' },
   { value: 14, label: 'Last 14 Days' },
   { value: 30, label: 'Last 30 Days' },
];

/**
 * "Request Trends" card. The full `data` series flows in from the
 * dashboard; the in-card dropdown slices the tail so the chart can
 * be re-windowed (7 / 14 / 30 days) without an extra server round-
 * trip. Avg / Peak / Change are recomputed off the sliced window.
 */
const RequestTrendsCard: React.FC<RequestTrendsCardProps> = ({
   data,
   subtitle = 'New request activity has moved over the last two weeks',
}) => {
   const [period, setPeriod] = useState<Period>(14);
   const [open, setOpen] = useState(false);

   const sliced = useMemo(() => data.slice(-period), [data, period]);

   const avg = sliced.length
      ? Math.round(sliced.reduce((s, p) => s + p.count, 0) / sliced.length)
      : 0;
   const peak = sliced.reduce((m, p) => Math.max(m, p.count), 0);
   const change =
      sliced.length >= 2
         ? Math.round(
              ((sliced[sliced.length - 1].count - sliced[0].count) /
                 Math.max(1, sliced[0].count)) *
                 100,
           )
         : 0;

   const selected = PERIOD_OPTIONS.find((o) => o.value === period)!;

   return (
      <Card>
         <div className="flex items-start justify-between gap-3 mb-4">
            <SectionLabel>Request Trends</SectionLabel>
            <div className="relative">
               <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F2552] dark:text-white/80 bg-[var(--surface-medium)] hover:bg-[var(--surface-high)] px-3 py-1.5 rounded-md transition-colors cursor-pointer"
               >
                  {selected.label}
                  <svg
                     width="10"
                     height="10"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="2.5"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                  >
                     <polyline points="6 9 12 15 18 9" />
                  </svg>
               </button>
               {open && (
                  <div className="absolute right-0 mt-1 min-w-[10rem] z-10 rounded-md border border-[var(--border-default)] bg-[var(--surface-paper)] shadow-lg overflow-hidden">
                     {PERIOD_OPTIONS.map((o) => (
                        <button
                           key={o.value}
                           type="button"
                           onClick={() => {
                              setPeriod(o.value);
                              setOpen(false);
                           }}
                           className={`block w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                              o.value === period
                                 ? 'bg-[var(--surface-high)] text-[#0F2552] dark:text-white'
                                 : 'text-[#0F2552]/70 dark:text-white/70 hover:bg-[var(--surface-medium)]'
                           }`}
                        >
                           {o.label}
                        </button>
                     ))}
                  </div>
               )}
            </div>
         </div>

         <div className="mb-2">
            <div className="text-lg font-semibold text-[#0F2552] dark:text-white/90">
               High-level view of request momentum
            </div>
            <div className="text-xs text-[#0F2552]/45 dark:text-white/45 mt-1">{subtitle}</div>
         </div>

         <div className="h-44 mt-4">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={sliced} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid
                     strokeDasharray="3 3"
                     stroke="var(--border-default)"
                     vertical={false}
                  />
                  <XAxis
                     dataKey="date"
                     tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                     axisLine={false}
                     tickLine={false}
                  />
                  <YAxis hide />
                  <Line
                     type="monotone"
                     dataKey="count"
                     stroke="var(--chart-gold)"
                     strokeWidth={1.5}
                     dot={
                        <Dot
                           r={3}
                           fill="var(--chart-gold)"
                           stroke="var(--surface-paper)"
                           strokeWidth={2}
                        />
                     }
                  />
               </LineChart>
            </ResponsiveContainer>
         </div>

         <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--border-default)]">
            <Stat label="Avg / Day" value={avg.toString()} />
            <Stat label="Peak" value={peak.toString()} />
            <Stat label="Change" value={`${change >= 0 ? '+' : ''}${change}%`} />
         </div>
      </Card>
   );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
   <div className="text-center">
      <div className="text-2xl md:text-3xl font-bold text-[#0F2552] dark:text-white tracking-tight tabular-nums">
         {value}
      </div>
      <div className="text-[0.6rem] uppercase tracking-widest text-[#0F2552]/45 dark:text-white/40 mt-1">
         {label}
      </div>
   </div>
);

export default RequestTrendsCard;
