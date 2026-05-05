import { dashboardActions } from '@/actions';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import Sparkline from '@/components/dashboard/Sparkline';
import { RoleId } from '@/constants/roles.constant';
import { usePermissions } from '@/hooks/usePermissions';
import { RootState } from '@/redux/reducers';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
   Area,
   AreaChart,
   CartesianGrid,
   ResponsiveContainer,
   Tooltip,
   XAxis,
   YAxis,
} from 'recharts';
import { UnknownAction } from 'redux';

/* ── Surface tokens (mirrored from Dashboard for visual consistency) ── */
const CARD_STYLE: React.CSSProperties = {
   background: 'var(--surface-low, rgba(255,255,255,0.02))',
   border: '1px solid var(--border-default)',
};
const SECTION_PILL_STYLE: React.CSSProperties = {
   background: 'var(--surface-medium)',
   color: 'var(--text-hint)',
   border: '1px solid var(--border-default)',
};

const Diamond = () => (
   <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
      <rect
         x="0.7"
         y="0.7"
         width="5.6"
         height="5.6"
         transform="rotate(45 3.5 3.5)"
         stroke="currentColor"
         strokeWidth="1"
      />
   </svg>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
   <span
      className="inline-flex items-center gap-1.5 text-[0.55rem] uppercase tracking-widest font-semibold px-2.5 py-1.5 rounded-md"
      style={SECTION_PILL_STYLE}
   >
      <Diamond />
      {children}
   </span>
);

type TrendPeriod = 'week' | 'month' | 'year';

const PERIOD_OPTIONS: { value: TrendPeriod; label: string }[] = [
   { value: 'week', label: 'Week' },
   { value: 'month', label: 'Month' },
   { value: 'year', label: 'Year' },
];

const formatTrendLabel = (raw: string, period: TrendPeriod): string => {
   try {
      const daily = raw.length === 10;
      if (period === 'year') {
         return format(daily ? parseISO(raw) : parseISO(`${raw}-01`), 'MMM yy');
      }
      if (daily) return format(parseISO(raw), 'MMM d');
      return format(parseISO(`${raw}-01`), 'MMM');
   } catch {
      return raw;
   }
};

const fmtNumber = (n: number | string | undefined) =>
   (Number(n ?? 0) || 0).toLocaleString('en-US');

const wowDelta = (
   data: { value: number }[],
): { pct: number; up: boolean } | null => {
   if (data.length < 2) return null;
   const first = data[0].value;
   const last = data[data.length - 1].value;
   const change = first === 0 ? (last > 0 ? 100 : 0) : ((last - first) / first) * 100;
   return { pct: Math.abs(change), up: last >= first };
};

const Analytics = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const { isAnalyticsAccess } = usePermissions();
   const [period, setPeriod] = useState<TrendPeriod>('month');
   const { dashboardAnalytics, IsFetchingDashboardStats } = useSelector(
      (s: RootState) => s.dashboard,
   );

   // Spec gate: even though the route's allowedRoles is permissive, the
   // page itself enforces analytics access. HOD of Facility / Logistics
   // gets in via isAnalyticsAccess; other HODs (e.g., Sound) bounce.
   useEffect(() => {
      if (isAnalyticsAccess === false) {
         router.replace('/admin/dashboard');
      }
   }, [isAnalyticsAccess, router]);

   useEffect(() => {
      dispatch(
         dashboardActions.getDashboardAnalytics(period) as unknown as UnknownAction,
      );
   }, [dispatch, period]);

   // Each row carries `date` (raw, for the Sparkline component which
   // also draws its own date axis), `label` (formatted, for the chart's
   // x-axis), and `value`.
   const requestsSparkline = useMemo(
      () =>
         (dashboardAnalytics?.requestsSparkline ?? []).map((p) => ({
            date: p.date,
            label: formatTrendLabel(p.date, period),
            value: Number(p.count ?? 0),
         })),
      [dashboardAnalytics?.requestsSparkline, period],
   );

   const itemsSparkline = useMemo(
      () =>
         (dashboardAnalytics?.itemsSparkline ?? []).map((p) => ({
            date: p.date,
            label: formatTrendLabel(p.date, period),
            value: Number(p.count ?? 0),
         })),
      [dashboardAnalytics?.itemsSparkline, period],
   );

   const generatorTrend = useMemo(() => {
      const series = (dashboardAnalytics?.generatorStats?.usageCountTrend ?? []).map(
         (p: { date: string; count?: number }) => ({
            date: p.date,
            label: formatTrendLabel(p.date, period),
            value: Number(p.count ?? 0),
         }),
      );
      return series;
   }, [dashboardAnalytics?.generatorStats?.usageCountTrend, period]);

   const requestsDelta = useMemo(
      () => wowDelta(requestsSparkline),
      [requestsSparkline],
   );
   const itemsDelta = useMemo(() => wowDelta(itemsSparkline), [itemsSparkline]);
   const generatorDelta = useMemo(() => wowDelta(generatorTrend), [generatorTrend]);

   const topItems = useMemo(
      () => (dashboardAnalytics?.topRequestedItems ?? []).slice(0, 5),
      [dashboardAnalytics?.topRequestedItems],
   );

   if (isAnalyticsAccess === false) return null;

   const isLoading = IsFetchingDashboardStats && !dashboardAnalytics;

   return (
      <PrivateRoute
         allowedRoles={[RoleId.SUPER_ADMIN, RoleId.ADMIN, RoleId.HOD]}
      >
         <Layout title="Analytics">
            <div className="max-w-7xl mx-auto space-y-5">
               {/* Header + period selector */}
               <header className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                     <h1
                        className="text-2xl md:text-3xl font-bold tracking-tight"
                        style={{ color: 'var(--text-primary)' }}
                     >
                        Analytics
                     </h1>
                     <p
                        className="text-xs md:text-sm mt-1"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        Operational telemetry across requests, inventory, and
                        facility maintenance. Charts respond to the selected
                        period.
                     </p>
                  </div>
                  <div
                     className="inline-flex rounded-lg overflow-hidden text-[0.65rem] font-semibold"
                     style={{ border: '1px solid var(--border-strong)' }}
                  >
                     {PERIOD_OPTIONS.map((opt) => (
                        <button
                           key={opt.value}
                           type="button"
                           onClick={() => setPeriod(opt.value)}
                           className="px-3 py-1.5 transition-colors cursor-pointer"
                           style={{
                              background:
                                 period === opt.value
                                    ? 'var(--color-secondary)'
                                    : 'transparent',
                              color:
                                 period === opt.value
                                    ? '#fff'
                                    : 'var(--text-secondary)',
                           }}
                        >
                           {opt.label}
                        </button>
                     ))}
                  </div>
               </header>

               {/* KPI hero strip — three sparkline cards */}
               <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                  <KpiCard
                     label="Total Requests"
                     value={fmtNumber(
                        requestsSparkline.reduce(
                           (sum: number, p: { value: number }) => sum + p.value,
                           0,
                        ),
                     )}
                     hint={`Across the selected ${period}`}
                     sparkline={requestsSparkline}
                     accent="#6B8FCC"
                     delta={requestsDelta}
                     isLoading={isLoading}
                  />
                  <KpiCard
                     label="Items Tracked"
                     value={fmtNumber(
                        itemsSparkline[itemsSparkline.length - 1]?.value ?? 0,
                     )}
                     hint="Inventory size at end of period"
                     sparkline={itemsSparkline}
                     accent="#10B981"
                     delta={itemsDelta}
                     isLoading={isLoading}
                  />
                  <KpiCard
                     label="Generator Logs"
                     value={fmtNumber(
                        generatorTrend.reduce(
                           (sum: number, p: { value: number }) => sum + p.value,
                           0,
                        ),
                     )}
                     hint={`Logged across the selected ${period}`}
                     sparkline={generatorTrend}
                     accent="#F59E0B"
                     delta={generatorDelta}
                     isLoading={isLoading}
                  />
               </section>

               {/* Trend charts row 1: Requests */}
               <section className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                  <SectionLabel>Request Volume</SectionLabel>
                  <h3
                     className="mt-4 font-semibold text-base"
                     style={{ color: 'var(--text-primary)' }}
                  >
                     How many requests came in
                  </h3>
                  <p
                     className="text-xs mt-1"
                     style={{ color: 'var(--text-hint)' }}
                  >
                     Each point is one bucket of the selected period.
                  </p>
                  <TrendChart
                     data={requestsSparkline}
                     accent="#6B8FCC"
                     emptyText="No request data yet."
                  />
               </section>

               {/* Trend charts row 2: Items + Generator side-by-side on desktop */}
               <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Inventory Growth</SectionLabel>
                     <h3
                        className="mt-4 font-semibold text-base"
                        style={{ color: 'var(--text-primary)' }}
                     >
                        Items in stock over time
                     </h3>
                     <TrendChart
                        data={itemsSparkline}
                        accent="#10B981"
                        emptyText="No items data yet."
                     />
                  </div>
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Generator Activity</SectionLabel>
                     <h3
                        className="mt-4 font-semibold text-base"
                        style={{ color: 'var(--text-primary)' }}
                     >
                        Generator logs filed
                     </h3>
                     <TrendChart
                        data={generatorTrend}
                        accent="#F59E0B"
                        emptyText="No generator data yet."
                     />
                  </div>
               </section>

               {/* Top requested items */}
               <section className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                  <SectionLabel>Leaderboard</SectionLabel>
                  <h3
                     className="mt-4 font-semibold text-base"
                     style={{ color: 'var(--text-primary)' }}
                  >
                     Top 5 most requested items
                  </h3>
                  <p
                     className="text-xs mt-1"
                     style={{ color: 'var(--text-hint)' }}
                  >
                     Ranked by request count this period.
                  </p>
                  <ul className="mt-4 space-y-2.5">
                     {topItems.length === 0 && (
                        <li
                           className="text-xs"
                           style={{ color: 'var(--text-hint)' }}
                        >
                           No data yet.
                        </li>
                     )}
                     {topItems.map(
                        (
                           it: { itemId: number; itemName: string; count: number },
                           idx: number,
                        ) => (
                           <li
                              key={it.itemId}
                              className="flex items-center justify-between text-sm"
                           >
                              <span className="flex items-center gap-2 min-w-0">
                                 <span
                                    className="text-[0.65rem] font-bold tabular-nums w-5 text-center"
                                    style={{ color: 'var(--text-hint)' }}
                                 >
                                    {idx + 1}
                                 </span>
                                 <span
                                    className="truncate"
                                    style={{ color: 'var(--text-primary)' }}
                                 >
                                    {it.itemName}
                                 </span>
                              </span>
                              <span
                                 className="tabular-nums text-xs font-semibold"
                                 style={{ color: 'var(--text-secondary)' }}
                              >
                                 {fmtNumber(it.count)}
                              </span>
                           </li>
                        ),
                     )}
                  </ul>
               </section>
            </div>
         </Layout>
      </PrivateRoute>
   );
};

interface KpiCardProps {
   label: string;
   value: string;
   hint: string;
   sparkline: { date: string; label: string; value: number }[];
   accent: string;
   delta: { pct: number; up: boolean } | null;
   isLoading: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({
   label,
   value,
   hint,
   sparkline,
   accent,
   delta,
   isLoading,
}) => (
   <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
      <div className="flex items-center justify-between">
         <SectionLabel>{label}</SectionLabel>
         {delta && (
            <span
               className="text-[0.65rem] font-semibold tabular-nums"
               style={{ color: delta.up ? '#10B981' : '#EF4444' }}
            >
               {delta.up ? '▲' : '▼'} {delta.up ? '+' : '−'}
               {delta.pct.toFixed(1)}%
            </span>
         )}
      </div>
      <h2
         className="text-3xl md:text-4xl font-bold tabular-nums tracking-tight mt-3"
         style={{ color: isLoading ? 'var(--text-hint)' : 'var(--text-primary)' }}
      >
         {isLoading ? '—' : value}
      </h2>
      <p className="text-[0.7rem] mt-1" style={{ color: 'var(--text-hint)' }}>
         {hint}
      </p>
      <div className="mt-4">
         <Sparkline
            data={sparkline}
            color={accent}
            height={48}
            showDelta={false}
            className="w-full"
         />
      </div>
   </div>
);

interface TrendChartProps {
   data: { label: string; value: number }[];
   accent: string;
   emptyText: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, accent, emptyText }) => (
   <div className="mt-5 w-full" style={{ height: 220 }}>
      {data.length === 0 ? (
         <div className="h-full flex items-center justify-center">
            <p className="text-xs" style={{ color: 'var(--text-hint)' }}>
               {emptyText}
            </p>
         </div>
      ) : (
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart
               data={data}
               margin={{ top: 10, right: 15, bottom: 30, left: 10 }}
            >
               <defs>
                  <linearGradient
                     id={`grad-${accent.replace('#', '')}`}
                     x1="0"
                     y1="0"
                     x2="0"
                     y2="1"
                  >
                     <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                     <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
               </defs>
               <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="var(--border-default)"
                  vertical={false}
               />
               <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--text-hint)', fontSize: 10 }}
                  axisLine={{ stroke: 'var(--border-default)' }}
                  tickLine={false}
               />
               <YAxis
                  tick={{ fill: 'var(--text-hint)', fontSize: 10 }}
                  axisLine={{ stroke: 'var(--border-default)' }}
                  tickLine={false}
                  allowDecimals={false}
               />
               <Tooltip
                  contentStyle={{
                     background: 'var(--surface-paper)',
                     border: '1px solid var(--border-default)',
                     borderRadius: 8,
                     fontSize: 12,
                  }}
               />
               <Area
                  type="monotone"
                  dataKey="value"
                  stroke={accent}
                  fill={`url(#grad-${accent.replace('#', '')})`}
                  strokeWidth={2}
               />
            </AreaChart>
         </ResponsiveContainer>
      )}
   </div>
);

export default Analytics;
