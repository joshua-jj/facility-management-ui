import { dashboardActions } from '@/actions';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import PrivateRoute from '@/components/PrivateRoute';
import Card from '@/components/Cards/Card';
import SectionLabel from '@/components/Cards/SectionLabel';
import CalendarHeatmap from '@/components/dashboard/CalendarHeatmap';
import TopNList from '@/components/dashboard/TopNList';
import PeriodToggle, { AnalyticsPeriod } from '@/components/analytics/PeriodToggle';
import KpiSparklineCard from '@/components/analytics/KpiSparklineCard';
import { usePermission } from '@/hooks/usePermission';
import { RootState } from '@/redux/reducers';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
   Area,
   AreaChart,
   CartesianGrid,
   Dot,
   Line,
   LineChart,
   ResponsiveContainer,
   Tooltip,
   XAxis,
   YAxis,
} from 'recharts';
import { UnknownAction } from 'redux';
import { Permission } from '@/constants/permissions.enum';

const formatTrendLabel = (raw: string, period: AnalyticsPeriod): string => {
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
   // Capability gate. Whoever has analytics:read sees this — granted to
   // SA / ADMIN automatically; granted to specific HODs (Facility,
   // Logistics) by the seeder. No more role-id branching.
   const { can } = usePermission();
   const canViewAnalytics = can(Permission.ANALYTICS_READ);
   const [period, setPeriod] = useState<AnalyticsPeriod>('month');
   const { dashboardAnalytics, IsFetchingDashboardStats } = useSelector(
      (s: RootState) => s.dashboard,
   );

   // Spec gate: bounce users who don't hold analytics:read. SA / ADMIN
   // hold it via the seeder; specific HODs (Facility, Logistics) get
   // it explicitly. Other HODs (e.g., Sound) bounce.
   useEffect(() => {
      if (!canViewAnalytics) {
         router.replace('/admin/dashboard');
      }
   }, [canViewAnalytics, router]);

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

   const topDepartments = useMemo(
      () => (dashboardAnalytics?.topDepartmentsByRequests ?? []).slice(0, 5),
      [dashboardAnalytics?.topDepartmentsByRequests],
   );

   const topArtisans = useMemo(
      () => (dashboardAnalytics?.topArtisansByCost ?? []).slice(0, 5),
      [dashboardAnalytics?.topArtisansByCost],
   );

   // CalendarHeatmap consumes `{date, count}` pairs directly.
   const heatmap = useMemo(
      () =>
         (dashboardAnalytics?.requestVolumeHeatmap ?? []).map((p) => ({
            date: p.date,
            count: Number(p.count ?? 0),
         })),
      [dashboardAnalytics?.requestVolumeHeatmap],
   );

   // KPI scalars derived from the same series the sparklines render.
   const totalRequests = useMemo(
      () => requestsSparkline.reduce((sum, p) => sum + p.value, 0),
      [requestsSparkline],
   );
   const itemsTracked = useMemo(
      () => itemsSparkline[itemsSparkline.length - 1]?.value ?? 0,
      [itemsSparkline],
   );
   const generatorLogs = useMemo(
      () => generatorTrend.reduce((sum, p) => sum + p.value, 0),
      [generatorTrend],
   );

   const requestsTrendPercent = (requestsDelta?.up ? 1 : -1) * (requestsDelta?.pct ?? 0);
   const itemsTrendPercent = (itemsDelta?.up ? 1 : -1) * (itemsDelta?.pct ?? 0);
   const genTrendPercent = (generatorDelta?.up ? 1 : -1) * (generatorDelta?.pct ?? 0);

   const requestsSparklineNumbers = useMemo(
      () => requestsSparkline.map((p) => p.value),
      [requestsSparkline],
   );
   const itemsSparklineNumbers = useMemo(
      () => itemsSparkline.map((p) => p.value),
      [itemsSparkline],
   );
   const genSparklineNumbers = useMemo(
      () => generatorTrend.map((p) => p.value),
      [generatorTrend],
   );

   const fmtCurrency = (n: number): string =>
      `₦${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

   if (!canViewAnalytics) return null;

   const isLoading = IsFetchingDashboardStats && !dashboardAnalytics;

   return (
      <PrivateRoute permissions={[Permission.ANALYTICS_READ]}>
         <Layout title="Analytics">
            <PageHeader
               title="Analytics"
               subtitle="Operational telemetry across requests, inventory, and facility maintenance. Charts respond to the selected period."
               action={<PeriodToggle value={period} onChange={setPeriod} />}
            />

            {/* KPI strip — three sparkline cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-5">
               <KpiSparklineCard
                  label="Total Requests"
                  value={totalRequests}
                  unit="Requests"
                  subtitle="Period total"
                  trendPercent={requestsTrendPercent}
                  sparkline={requestsSparklineNumbers}
                  color="gold"
               />
               <KpiSparklineCard
                  label="Items Tracked"
                  value={itemsTracked}
                  unit="Items"
                  subtitle="Inventory size at end of period"
                  trendPercent={itemsTrendPercent}
                  sparkline={itemsSparklineNumbers}
                  color="mint"
               />
               <KpiSparklineCard
                  label="Generator Logs"
                  value={generatorLogs}
                  unit="Logs"
                  subtitle="Logs filed in period"
                  trendPercent={genTrendPercent}
                  sparkline={genSparklineNumbers}
                  color="gold"
               />
            </div>

            {/* Request Volume — full-width line chart */}
            <Card className="mb-5">
               <SectionLabel>Request Volume</SectionLabel>
               <div className="mt-3">
                  <div className="text-2xl font-bold text-[#0F2552] dark:text-white">
                     How many requests came in
                  </div>
                  <div className="text-xs text-[#0F2552]/45 dark:text-white/45 mt-1">
                     Each point is one bucket of the selected period.
                  </div>
               </div>
               <div className="h-72 mt-4">
                  {requestsSparkline.length === 0 ? (
                     <div className="h-full flex items-center justify-center text-xs text-[#0F2552]/45 dark:text-white/45">
                        {isLoading ? 'Loading…' : 'No request data yet.'}
                     </div>
                  ) : (
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                           data={requestsSparkline}
                           margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                        >
                           <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                           <XAxis
                              dataKey="label"
                              tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                           />
                           <YAxis
                              tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                              axisLine={false}
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
                           <Line
                              type="monotone"
                              dataKey="value"
                              stroke="var(--chart-blue)"
                              strokeWidth={1.5}
                              dot={
                                 <Dot
                                    r={3}
                                    fill="var(--chart-blue)"
                                    stroke="var(--surface-paper)"
                                    strokeWidth={2}
                                 />
                              }
                           />
                        </LineChart>
                     </ResponsiveContainer>
                  )}
               </div>
            </Card>

            {/* Two-column row: Inventory Growth + Generator Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-5">
               <Card>
                  <SectionLabel>Inventory Growth</SectionLabel>
                  <div className="mt-3">
                     <div className="text-xl font-bold text-[#0F2552] dark:text-white">
                        Items in stock over time
                     </div>
                  </div>
                  <div className="h-56 mt-3">
                     {itemsSparkline.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-[#0F2552]/45 dark:text-white/45">
                           {isLoading ? 'Loading…' : 'No items data yet.'}
                        </div>
                     ) : (
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart
                              data={itemsSparkline}
                              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                           >
                              <defs>
                                 <linearGradient id="inventory-grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--chart-mint)" stopOpacity={0.45} />
                                    <stop offset="100%" stopColor="var(--chart-mint)" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid
                                 strokeDasharray="3 3"
                                 stroke="var(--border-default)"
                                 vertical={false}
                              />
                              <XAxis
                                 dataKey="label"
                                 tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                                 axisLine={false}
                                 tickLine={false}
                              />
                              <YAxis
                                 tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                                 axisLine={false}
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
                                 stroke="var(--chart-mint)"
                                 strokeWidth={1.5}
                                 fill="url(#inventory-grad)"
                              />
                           </AreaChart>
                        </ResponsiveContainer>
                     )}
                  </div>
               </Card>

               <Card>
                  <SectionLabel>Generator Activity</SectionLabel>
                  <div className="mt-3">
                     <div className="text-xl font-bold text-[#0F2552] dark:text-white">
                        Generator logs filed
                     </div>
                  </div>
                  <div className="h-56 mt-3">
                     {generatorTrend.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-[#0F2552]/45 dark:text-white/45">
                           {isLoading ? 'Loading…' : 'No generator data yet.'}
                        </div>
                     ) : (
                        <ResponsiveContainer width="100%" height="100%">
                           <LineChart
                              data={generatorTrend}
                              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                           >
                              <CartesianGrid
                                 strokeDasharray="3 3"
                                 stroke="var(--border-default)"
                                 vertical={false}
                              />
                              <XAxis
                                 dataKey="label"
                                 tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                                 axisLine={false}
                                 tickLine={false}
                              />
                              <YAxis
                                 tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                                 axisLine={false}
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
                              <Line
                                 type="monotone"
                                 dataKey="value"
                                 stroke="var(--chart-gold)"
                                 strokeWidth={1.5}
                                 dot={false}
                              />
                           </LineChart>
                        </ResponsiveContainer>
                     )}
                  </div>
               </Card>
            </div>

            {/* Activity Heatmap — preserved, restyled */}
            {heatmap.length > 0 && (
               <Card className="mb-5">
                  <SectionLabel>Activity Heatmap</SectionLabel>
                  <div className="mt-3">
                     <div className="text-xl font-bold text-[#0F2552] dark:text-white">
                        Request volume — last year
                     </div>
                     <div className="text-xs text-[#0F2552]/45 dark:text-white/45 mt-1">
                        Each square is one day. Darker = more requests filed.
                     </div>
                  </div>
                  <div className="mt-4">
                     <CalendarHeatmap data={heatmap} />
                  </div>
               </Card>
            )}

            {/* Leaderboards — preserved, restyled */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
               <Card>
                  <SectionLabel>Top Requesters</SectionLabel>
                  <div className="mt-3">
                     <TopNList
                        title="Top 5 departments by requests"
                        rows={topDepartments.map((d) => ({
                           label: d.departmentName,
                           value: Number(d.count ?? 0),
                        }))}
                        emptyText="No department data yet."
                     />
                  </div>
               </Card>
               <Card>
                  <SectionLabel>Top Items</SectionLabel>
                  <div className="mt-3">
                     <TopNList
                        title="Top 5 requested items"
                        rows={topItems.map((it) => ({
                           label: it.itemName,
                           value: Number(it.count ?? 0),
                        }))}
                        emptyText="No item data yet."
                     />
                  </div>
               </Card>
               <Card>
                  <SectionLabel>Top Artisans</SectionLabel>
                  <div className="mt-3">
                     <TopNList
                        title="Top 5 artisans by maintenance cost"
                        rows={topArtisans.map((a) => ({
                           label: a.artisanName,
                           value: Number(a.totalCost ?? 0),
                        }))}
                        valueFormat={fmtCurrency}
                        emptyText="No artisan data yet."
                     />
                  </div>
               </Card>
            </div>
         </Layout>
      </PrivateRoute>
   );
};

export default Analytics;
