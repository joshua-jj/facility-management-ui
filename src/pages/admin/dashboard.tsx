import { appActions, dashboardActions, requestActions } from '@/actions';
import Layout from '@/components/Layout';
import { RootState } from '@/redux/reducers';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import PrivateRoute from '@/components/PrivateRoute';
import { RoleId } from '@/constants/roles.constant';
import { dashboardConstants, authConstants } from '@/constants';
import { getObjectFromStorage } from '@/utilities/helpers';
import { exportToCsv } from '@/utilities/exportCsv';
import axios from 'axios';
import Sparkline from '@/components/dashboard/Sparkline';
import {
   BarChart,
   Bar,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   Legend,
   ResponsiveContainer,
   AreaChart,
   Area,
} from 'recharts';

/* ── Card shell — muted surface, subtle border, rounded ── */
const CARD = 'rounded-2xl p-5 md:p-6 transition-colors';
const CARD_STYLE: React.CSSProperties = {
   background: 'var(--surface-low, rgba(255,255,255,0.02))',
   border: '1px solid var(--border-default)',
};

/* ── Small pill label in caps tracking-wider with a tiny diamond glyph ── */
const SECTION_PILL_STYLE: React.CSSProperties = {
   background: 'var(--surface-medium)',
   color: 'var(--text-hint)',
   border: '1px solid var(--border-default)',
};

const Diamond = () => (
   <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
      <rect x="0.7" y="0.7" width="5.6" height="5.6" transform="rotate(45 3.5 3.5)" stroke="currentColor" strokeWidth="1" />
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

const formatMonthLabel = (raw: string) => {
   try {
      if (raw.length === 10) return format(parseISO(raw), 'MMM');
      return format(parseISO(`${raw}-01`), 'MMM');
   } catch {
      return raw;
   }
};

/** Format an API date label given the current trend period:
 *  - week/month: show day + month ("Apr 8")
 *  - year/6months: show month only ("Apr 26")
 */
const formatTrendLabel = (raw: string, period: 'week' | 'month' | 'year'): string => {
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

/* ── Skeleton shapes ── */
const SkeletonBar: React.FC<{ width?: string; height?: string; className?: string }> = ({
   width = '60%',
   height = '14px',
   className = '',
}) => (
   <div
      className={`rounded animate-pulse ${className}`}
      style={{
         width,
         height,
         background: 'var(--surface-medium)',
      }}
   />
);

const SkeletonCard: React.FC<{ height?: string }> = ({ height = 'auto' }) => (
   <div className="rounded-2xl p-5 md:p-6" style={{ ...CARD_STYLE, minHeight: height }}>
      <SkeletonBar width="30%" height="10px" />
      <div className="mt-5 space-y-3">
         <SkeletonBar width="40%" height="28px" />
         <SkeletonBar width="60%" height="10px" />
      </div>
      <div className="mt-6">
         <SkeletonBar width="100%" height="80px" />
      </div>
   </div>
);

const DashboardSkeleton: React.FC = () => (
   <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5">
         <SkeletonCard height="220px" />
         <SkeletonCard height="220px" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5">
         <SkeletonCard height="240px" />
         <SkeletonCard height="240px" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5">
         <SkeletonCard height="220px" />
         <SkeletonCard height="220px" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5">
         <SkeletonCard height="280px" />
         <SkeletonCard height="280px" />
      </div>
      <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
         <SkeletonBar width="20%" height="10px" />
         <div className="mt-5" style={{ height: 320 }}>
            <SkeletonBar width="100%" height="100%" />
         </div>
      </div>
   </>
);

type TrendPeriod = 'week' | 'month' | 'year';

const PERIOD_OPTIONS: { value: TrendPeriod; label: string }[] = [
   { value: 'week', label: 'Week' },
   { value: 'month', label: 'Month' },
   { value: 'year', label: 'Year' },
];

const Dashboard = () => {
   const dispatch = useDispatch();
   const [isExportingReport, setIsExportingReport] = useState(false);
   const [period, setPeriod] = useState<TrendPeriod>('month');
   const { userDetails } = useSelector((s: RootState) => s.user);
   const { dashboardStats, dashboardAnalytics, IsFetchingDashboardStats } =
      useSelector((s: RootState) => s.dashboard);

   const isLoading = IsFetchingDashboardStats && !dashboardStats;

   useEffect(() => {
      dispatch(dashboardActions.getDashboardStats() as unknown as UnknownAction);
      dispatch(
         dashboardActions.getDashboardAnalytics(period) as unknown as UnknownAction,
      );

      if (userDetails?.roleId === RoleId.HOD) {
         dispatch(
            requestActions.getDepartmentRequests({
               departmentId: userDetails?.departmentId ?? 0,
            }) as unknown as UnknownAction,
         );
      } else if (userDetails?.roleId === RoleId.MEMBER) {
         dispatch(
            requestActions.getAssignedRequests({
               userId: userDetails?.id ?? 0,
            }) as unknown as UnknownAction,
         );
      } else {
         dispatch(requestActions.getAllRequests() as unknown as UnknownAction);
      }
   }, [dispatch, userDetails, period]);

   const handleExportDailyReport = useCallback(async () => {
      setIsExportingReport(true);
      try {
         const user = await getObjectFromStorage(authConstants.USER_KEY);
         const today = format(new Date(), 'yyyy-MM-dd');
         const uri = `${dashboardConstants.DAILY_REPORT_URI}?date=${today}`;

         const resp = await axios.get(uri, {
            headers: {
               Accept: 'application/json',
               Authorization: user?.token ? `Bearer ${user.token}` : '',
            },
         });

         const report = resp.data?.data;
         if (!report) {
            dispatch(
               appActions.setSnackBar({
                  type: 'warning',
                  message: 'No report data available.',
                  variant: 'warning',
               }) as unknown as UnknownAction,
            );
            return;
         }

         type TransactionRow = {
            category: string;
            name: string;
            description: string;
            status: string;
            detail: string;
            createdBy: string;
            createdAt: string;
         };
         const rows: TransactionRow[] = [];

         (report.requests ?? []).forEach((r: Record<string, unknown>) => {
            rows.push({
               category: 'Request',
               name: String(r.requesterName ?? ''),
               description: String(r.descriptionOfRequest ?? ''),
               status: String(r.requestStatus ?? ''),
               detail: `Ministry: ${r.ministryName ?? ''}`,
               createdBy: String(r.createdBy ?? ''),
               createdAt: r.createdAt
                  ? format(parseISO(String(r.createdAt)), 'yyyy-MM-dd h:mm a')
                  : '',
            });
         });

         (report.generatorLogs ?? []).forEach((g: Record<string, unknown>) => {
            rows.push({
               category: 'Generator Log',
               name: String(g.nameOfMeeting ?? ''),
               description: `${g.generatorType ?? ''} at ${g.meetingLocation ?? ''}`,
               status: g.faultDetected ? 'Fault Detected' : 'OK',
               detail:
                  g.onTime && g.offTime
                     ? `On: ${format(parseISO(String(g.onTime)), 'h:mm a')} Off: ${format(parseISO(String(g.offTime)), 'h:mm a')}`
                     : '',
               createdBy: String(g.createdBy ?? ''),
               createdAt: g.createdAt
                  ? format(parseISO(String(g.createdAt)), 'yyyy-MM-dd h:mm a')
                  : '',
            });
         });

         (report.maintenanceLogs ?? []).forEach((m: Record<string, unknown>) => {
            rows.push({
               category: 'Maintenance',
               name: String(m.artisanName ?? ''),
               description: String(m.description ?? ''),
               status: '',
               detail: `Cost: NGN ${Number(m.costOfMaintenance ?? 0).toLocaleString()}`,
               createdBy: String(m.createdBy ?? ''),
               createdAt: m.createdAt
                  ? format(parseISO(String(m.createdAt)), 'yyyy-MM-dd h:mm a')
                  : '',
            });
         });

         (report.complaints ?? []).forEach((c: Record<string, unknown>) => {
            const summary = c.summary as Record<string, unknown> | undefined;
            rows.push({
               category: 'Complaint',
               name: String(c.title ?? ''),
               description: String(c.description ?? ''),
               status: String(summary?.complaintStatus ?? ''),
               detail: '',
               createdBy: String(c.createdBy ?? ''),
               createdAt: c.createdAt
                  ? format(parseISO(String(c.createdAt)), 'yyyy-MM-dd h:mm a')
                  : '',
            });
         });

         if (rows.length === 0) {
            dispatch(
               appActions.setSnackBar({
                  type: 'info',
                  message: 'No transactions found for today.',
                  variant: 'info',
               }) as unknown as UnknownAction,
            );
            return;
         }

         exportToCsv('Daily Report', rows, [
            { key: 'category', header: 'Category' },
            { key: 'name', header: 'Name' },
            { key: 'description', header: 'Description' },
            { key: 'status', header: 'Status' },
            { key: 'detail', header: 'Detail' },
            { key: 'createdBy', header: 'Created By' },
            { key: 'createdAt', header: 'Date/Time' },
         ]);

         dispatch(
            appActions.setSnackBar({
               type: 'success',
               message: 'Daily report downloaded successfully.',
               variant: 'success',
            }) as unknown as UnknownAction,
         );
      } catch {
         dispatch(
            appActions.setSnackBar({
               type: 'error',
               message: 'Failed to export daily report. Please try again.',
               variant: 'error',
            }) as unknown as UnknownAction,
         );
      } finally {
         setIsExportingReport(false);
      }
   }, [dispatch]);

   const greeting = useMemo(() => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 17) return 'Good afternoon';
      return 'Good evening';
   }, []);

   /* ── Sparkline for Total Requests card ── */
   const requestsSparkline = useMemo(
      () =>
         (dashboardAnalytics?.requestsSparkline ?? []).map((p) => ({
            date: p.date,
            value: p.count,
         })),
      [dashboardAnalytics],
   );

   /* ── Items sparkline for week-over-week delta ── */
   const itemsSparkline = useMemo(
      () =>
         (dashboardAnalytics?.itemsSparkline ?? []).map((p) => ({
            date: p.date,
            value: p.count,
         })),
      [dashboardAnalytics],
   );

   /* ── Approved / Declined % pills ── */
   const requestRatePills = useMemo(() => {
      const list = dashboardStats?.requestsByStatus ?? [];
      const total = list.reduce((sum, s) => sum + (s.count || 0), 0) || 1;
      const find = (label: string) =>
         list.find((s) => s.status.toLowerCase() === label)?.count ?? 0;
      return {
         approved: ((find('approved') / total) * 100).toFixed(1),
         declined: ((find('declined') / total) * 100).toFixed(1),
      };
   }, [dashboardStats]);

   /* ── Items this-week delta ── */
   const itemsWoW = useMemo(() => {
      if (itemsSparkline.length < 2) return null;
      const first = itemsSparkline[0].value;
      const last = itemsSparkline[itemsSparkline.length - 1].value;
      if (!first) return null;
      const pct = ((last - first) / Math.abs(first)) * 100;
      return { pct, up: pct >= 0 };
   }, [itemsSparkline]);

   /* ── Usage-trend stats derived from 14-day requests sparkline ── */
   const requestUsageStats = useMemo(() => {
      const data = requestsSparkline;
      if (data.length === 0) return { avg: 0, peak: 0, change: 0 };
      const total = data.reduce((s, d) => s + d.value, 0);
      const avg = total / data.length;
      const peak = Math.max(...data.map((d) => d.value));
      const first = data[0].value;
      const last = data[data.length - 1].value;
      const change = first ? ((last - first) / Math.abs(first)) * 100 : 0;
      return { avg: Math.round(avg), peak, change: Math.round(change * 10) / 10 };
   }, [requestsSparkline]);

   /* ── Top requested items (top 5) ── */
   const topItems = useMemo(
      () => (dashboardAnalytics?.topRequestedItems ?? []).slice(0, 5),
      [dashboardAnalytics],
   );

   /* ── Next upcoming schedule ── */
   const nextSchedule = useMemo(
      () => (dashboardAnalytics?.upcomingSchedules ?? [])[0],
      [dashboardAnalytics],
   );

   /* ── Recent maintenance logs (top 3) ── */
   const recentMaintenance = useMemo(
      () => (dashboardAnalytics?.recentMaintenanceLogs ?? []).slice(0, 3),
      [dashboardAnalytics],
   );

   /* ── Monthly requests bar-chart series ── */
   const requestTrendData = useMemo(
      () =>
         (dashboardAnalytics?.requestTrend ?? []).map((t) => ({
            month: formatMonthLabel(t.month),
            Requests: t.count,
         })),
      [dashboardAnalytics],
   );

   /* ── Generator usage line-chart series — count of generator logs per period ── */
   const generatorTrendData = useMemo(() => {
      const countTrend = dashboardAnalytics?.generatorStats?.usageCountTrend;
      if (countTrend && countTrend.length > 0) {
         return countTrend.map((p) => ({
            date: p.date,
            label: formatTrendLabel(p.date, period),
            value: p.count,
         }));
      }
      /* Fallback: hours trend (legacy, while backend deploys) */
      return (dashboardAnalytics?.generatorStats?.hoursUsedTrend ?? []).map((p) => ({
         date: p.date,
         label: formatTrendLabel(p.date, period),
         value: p.hours,
      }));
   }, [dashboardAnalytics, period]);

   const generatorTrendChange = useMemo(() => {
      if (generatorTrendData.length < 2) return null;
      const first = generatorTrendData[0].value;
      const last = generatorTrendData[generatorTrendData.length - 1].value;
      if (!first) return null;
      const pct = ((last - first) / Math.abs(first)) * 100;
      return { pct, up: pct >= 0 };
   }, [generatorTrendData]);

   /* ── Items line-chart data ── */
   const itemsLineData = useMemo(
      () =>
         itemsSparkline.map((p) => ({
            date: p.date,
            label: formatTrendLabel(p.date, period),
            value: p.value,
         })),
      [itemsSparkline, period],
   );

   return (
      <PrivateRoute>
         <Layout title="Dashboard">
            {/* Greeting bar */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
               <div>
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                     {greeting}, {userDetails?.firstName ?? 'Admin'}
                  </h1>
                  <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--text-hint)' }}>
                     At-a-glance view of requests, items and activity across your facilities
                  </p>
               </div>
               <div className="flex flex-wrap items-center gap-2 self-start sm:self-end">
                  <button
                     onClick={handleExportDailyReport}
                     disabled={isExportingReport}
                     className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                     style={{
                        border: '1px solid var(--border-strong)',
                        color: 'var(--text-secondary)',
                        background: 'var(--surface-medium)',
                     }}
                  >
                     {isExportingReport ? (
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                     ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                           <polyline points="7 10 12 15 17 10" />
                           <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                     )}
                     Daily Report
                  </button>
                  <span
                     className="text-[0.65rem] font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider"
                     style={{
                        background: 'var(--surface-medium)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-hint)',
                     }}
                  >
                     {format(new Date(), 'EEEE, MMMM d, yyyy')}
                  </span>
               </div>
            </div>

            {isLoading && <DashboardSkeleton />}

            {!isLoading && (
            <>
            {/* Row 1: Total Requests · Upcoming */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5">
               {/* Total Requests */}
               <div className={CARD} style={CARD_STYLE}>
                  <SectionLabel>Total Requests</SectionLabel>
                  <div className="mt-5 flex items-start gap-6">
                     <div className="flex-1 min-w-0">
                        <h2 className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>
                           {fmtNumber(dashboardStats?.totalRequests)}
                        </h2>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-hint)' }}>
                           Total Requests
                        </p>
                     </div>
                     <div className="flex-1 max-w-[60%]">
                        <Sparkline data={requestsSparkline} color="#6B8FCC" height={56} showDelta={false} className="w-full" />
                     </div>
                  </div>
                  <div className="mt-6 flex items-center gap-6">
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                        <div>
                           <div className="text-base font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                              {requestRatePills.approved}%
                           </div>
                           <div className="text-[0.65rem]" style={{ color: 'var(--text-hint)' }}>Approved Rate</div>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
                        <div>
                           <div className="text-base font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                              {requestRatePills.declined}%
                           </div>
                           <div className="text-[0.65rem]" style={{ color: 'var(--text-hint)' }}>Declined Rate</div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Upcoming Schedule */}
               <div className={CARD} style={CARD_STYLE}>
                  <SectionLabel>Upcoming Schedule</SectionLabel>
                  {nextSchedule ? (
                     <div
                        className="mt-5 rounded-xl p-4 relative"
                        style={{ border: '1px solid var(--border-default)', background: 'var(--surface-medium)' }}
                     >
                        <span
                           className="absolute top-3 right-3 text-[0.6rem] font-semibold px-2 py-0.5 rounded-md"
                           style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}
                        >
                           Upcoming
                        </span>
                        <h3 className="font-semibold text-sm pr-16" style={{ color: 'var(--text-primary)' }}>
                           {nextSchedule.title}
                        </h3>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                           {nextSchedule.description}
                        </p>
                        <p className="text-[0.65rem] mt-3" style={{ color: 'var(--text-hint)' }}>
                           {format(parseISO(nextSchedule.scheduledDate), 'd MMM')}
                        </p>
                     </div>
                  ) : (
                     <p className="mt-8 text-sm" style={{ color: 'var(--text-hint)' }}>
                        No upcoming schedules.
                     </p>
                  )}
               </div>
            </div>

            {/* Row 2: Most Requested · Total Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5">
               {/* Most Requested Items */}
               <div className={CARD} style={CARD_STYLE}>
                  <div className="flex items-start justify-between">
                     <SectionLabel>Most Requested Items</SectionLabel>
                     <span className="text-[0.6rem]" style={{ color: 'var(--text-hint)' }}>
                        Top 5
                     </span>
                  </div>
                  <h3 className="mt-5 font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                     Your most requested items
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-hint)' }}>
                     Here are your top 5 most requested items this period
                  </p>
                  <ul className="mt-4 space-y-2.5">
                     {topItems.length === 0 && (
                        <li className="text-xs" style={{ color: 'var(--text-hint)' }}>No data yet.</li>
                     )}
                     {topItems.map((it, idx) => (
                        <li key={it.itemId} className="flex items-center justify-between text-sm">
                           <span className="flex items-center gap-2 min-w-0">
                              <span
                                 className="text-[0.65rem] font-bold tabular-nums w-5 text-center"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 {idx + 1}
                              </span>
                              <span className="truncate" style={{ color: 'var(--text-primary)' }}>
                                 {it.itemName}
                              </span>
                           </span>
                           <span className="tabular-nums text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                              {fmtNumber(it.count)}
                           </span>
                        </li>
                     ))}
                  </ul>
               </div>

               {/* Total Items in Stock */}
               <div className={CARD} style={CARD_STYLE}>
                  <div className="flex items-start justify-between">
                     <SectionLabel>Total Items</SectionLabel>
                     <Link
                        href="/admin/items"
                        className="text-[0.65rem] font-semibold underline underline-offset-2"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        View All
                     </Link>
                  </div>
                  <h3 className="mt-5 font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                     Total Item Count
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-hint)' }}>
                     Here is an overview of your stock
                  </p>
                  <div className="mt-6 flex items-end gap-8">
                     <div>
                        <div className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>
                           {fmtNumber(dashboardStats?.totalItems)}
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-hint)' }}>Items</div>
                     </div>
                     {itemsWoW && (
                        <div>
                           <div
                              className="text-2xl font-bold tabular-nums"
                              style={{ color: itemsWoW.up ? '#10B981' : '#EF4444' }}
                           >
                              {itemsWoW.up ? '+' : ''}{itemsWoW.pct.toFixed(1)}%
                           </div>
                           <div className="text-xs mt-1" style={{ color: 'var(--text-hint)' }}>compared to last week</div>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Row 3: Recent Maintenance · Request Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5">
               {/* Recent Maintenance */}
               <div className={CARD} style={CARD_STYLE}>
                  <div className="flex items-start justify-between">
                     <SectionLabel>Recent Activity</SectionLabel>
                     <Link
                        href="/admin/maintenance-log"
                        className="text-[0.65rem] font-semibold underline underline-offset-2"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        View Logs
                     </Link>
                  </div>
                  <div className="mt-5 space-y-3">
                     {recentMaintenance.length === 0 && (
                        <p className="text-xs" style={{ color: 'var(--text-hint)' }}>No recent activity yet.</p>
                     )}
                     {recentMaintenance.map((m) => (
                        <div
                           key={m.id}
                           className="flex items-start gap-3 pb-3"
                           style={{ borderBottom: '1px solid var(--border-default)' }}
                        >
                           <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#10B981' }} />
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                 <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                    {m.artisanName}
                                 </p>
                                 <span className="text-[0.65rem] tabular-nums shrink-0" style={{ color: 'var(--text-hint)' }}>
                                    {format(parseISO(m.maintenanceDate), 'd MMM')}
                                 </span>
                              </div>
                              <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                 {m.description}
                              </p>
                              <p className="text-[0.65rem] mt-1 tabular-nums" style={{ color: 'var(--text-hint)' }}>
                                 NGN {fmtNumber(m.costOfMaintenance)}
                              </p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Usage Trends — Avg/Peak/Change */}
               <div className={CARD} style={CARD_STYLE}>
                  <div className="flex items-start justify-between">
                     <SectionLabel>Request Trends</SectionLabel>
                     <span
                        className="text-[0.6rem] font-semibold px-2 py-1 rounded-md"
                        style={{ background: 'var(--surface-medium)', color: 'var(--text-hint)', border: '1px solid var(--border-default)' }}
                     >
                        Last 14 Days
                     </span>
                  </div>
                  <p className="mt-5 text-sm" style={{ color: 'var(--text-primary)' }}>
                     High-level view of request momentum
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-hint)' }}>
                     How request activity has moved over the last two weeks
                  </p>
                  <div className="mt-8 grid grid-cols-3 gap-2">
                     {[
                        { label: 'Avg / Day', value: fmtNumber(requestUsageStats.avg) },
                        { label: 'Peak', value: fmtNumber(requestUsageStats.peak) },
                        {
                           label: 'Change',
                           value: `${requestUsageStats.change >= 0 ? '+' : ''}${requestUsageStats.change}%`,
                           accent: requestUsageStats.change >= 0 ? '#10B981' : '#EF4444',
                        },
                     ].map((stat) => (
                        <div
                           key={stat.label}
                           className="rounded-xl py-3 px-2 text-center"
                           style={{ border: '1px solid var(--border-default)' }}
                        >
                           <div
                              className="text-xl md:text-2xl font-bold tabular-nums"
                              style={{ color: stat.accent ?? 'var(--text-primary)' }}
                           >
                              {stat.value}
                           </div>
                           <div className="text-[0.6rem] mt-1 uppercase tracking-wider" style={{ color: 'var(--text-hint)' }}>
                              {stat.label}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Trends header — period selector scoped to charts below */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 mt-2">
               <div>
                  <h2
                     className="text-sm font-bold uppercase tracking-wider"
                     style={{ color: 'var(--text-secondary)' }}
                  >
                     Trends
                  </h2>
                  <p className="text-[0.7rem] mt-0.5" style={{ color: 'var(--text-hint)' }}>
                     Charts below respond to the selected period
                  </p>
               </div>
               <div
                  role="tablist"
                  aria-label="Trend period"
                  className="inline-flex rounded-full overflow-hidden"
                  style={{ border: '1px solid var(--border-strong)' }}
               >
                  {PERIOD_OPTIONS.map((p) => {
                     const active = period === p.value;
                     return (
                        <button
                           key={p.value}
                           role="tab"
                           aria-selected={active}
                           onClick={() => setPeriod(p.value)}
                           className="px-3.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider transition-all cursor-pointer"
                           style={{
                              background: active
                                 ? 'var(--color-secondary)'
                                 : 'transparent',
                              color: active ? '#fff' : 'var(--text-secondary)',
                           }}
                        >
                           {p.label}
                        </button>
                     );
                  })}
               </div>
            </div>

            {/* Row 4: Items trend · Generator usage — line charts with % delta */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5">
               {/* Items Trend */}
               <div className={CARD} style={CARD_STYLE}>
                  <div className="flex items-start justify-between">
                     <SectionLabel>Items Trend</SectionLabel>
                     {itemsWoW && (
                        <span
                           className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-md tabular-nums"
                           style={{
                              background: itemsWoW.up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                              color: itemsWoW.up ? '#10B981' : '#EF4444',
                              border: `1px solid ${itemsWoW.up ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                           }}
                        >
                           {itemsWoW.up ? '▲' : '▼'} {itemsWoW.up ? '+' : ''}{itemsWoW.pct.toFixed(1)}%
                        </span>
                     )}
                  </div>
                  <h3 className="mt-5 font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                     Stock movement
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-hint)' }}>
                     Total items logged across the last 14 days
                  </p>
                  <div className="mt-5 w-full" style={{ height: 220 }}>
                     {itemsLineData.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                           <p className="text-xs" style={{ color: 'var(--text-hint)' }}>No item data yet.</p>
                        </div>
                     ) : (
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={itemsLineData} margin={{ top: 10, right: 15, bottom: 30, left: 10 }}>
                              <defs>
                                 <linearGradient id="itemsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#D4A84B" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="#D4A84B" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="4 4" stroke="var(--border-default)" vertical={false} />
                              <XAxis
                                 dataKey="label"
                                 tick={{ fill: 'var(--text-hint)', fontSize: 10 }}
                                 axisLine={{ stroke: 'var(--border-default)' }}
                                 tickLine={false}
                                 interval="preserveStartEnd"
                                 minTickGap={30}
                                 label={{
                                    value: 'Date',
                                    position: 'insideBottom',
                                    offset: -15,
                                    style: { fill: 'var(--text-hint)', fontSize: 11, fontWeight: 600 },
                                 }}
                              />
                              <YAxis
                                 tick={{ fill: 'var(--text-hint)', fontSize: 10 }}
                                 axisLine={{ stroke: 'var(--border-default)' }}
                                 tickLine={false}
                                 width={44}
                                 allowDecimals={false}
                                 label={{
                                    value: 'Items',
                                    angle: -90,
                                    position: 'insideLeft',
                                    offset: 5,
                                    style: { fill: 'var(--text-hint)', fontSize: 11, fontWeight: 600, textAnchor: 'middle' },
                                 }}
                              />
                              <Tooltip
                                 contentStyle={{
                                    background: 'var(--surface-medium)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 8,
                                    fontSize: 12,
                                 }}
                                 cursor={{ stroke: 'var(--border-strong)' }}
                              />
                              <Area
                                 type="monotone"
                                 dataKey="value"
                                 stroke="#D4A84B"
                                 strokeWidth={2}
                                 fill="url(#itemsGradient)"
                                 name="Items"
                              />
                           </AreaChart>
                        </ResponsiveContainer>
                     )}
                  </div>
               </div>

               {/* Generator Usage */}
               <div className={CARD} style={CARD_STYLE}>
                  <div className="flex items-start justify-between">
                     <SectionLabel>Generator Usage</SectionLabel>
                     {generatorTrendChange && (
                        <span
                           className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-md tabular-nums"
                           style={{
                              background: generatorTrendChange.up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                              color: generatorTrendChange.up ? '#10B981' : '#EF4444',
                              border: `1px solid ${generatorTrendChange.up ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                           }}
                        >
                           {generatorTrendChange.up ? '▲' : '▼'} {generatorTrendChange.up ? '+' : ''}{generatorTrendChange.pct.toFixed(1)}%
                        </span>
                     )}
                  </div>
                  <h3 className="mt-5 font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                     Generator logs filed
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-hint)' }}>
                     How often generator items were logged across the selected period
                  </p>
                  <div className="mt-5 w-full" style={{ height: 220 }}>
                     {generatorTrendData.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                           <p className="text-xs" style={{ color: 'var(--text-hint)' }}>No generator data yet.</p>
                        </div>
                     ) : (
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={generatorTrendData} margin={{ top: 10, right: 15, bottom: 30, left: 10 }}>
                              <defs>
                                 <linearGradient id="genGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6B8FCC" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="#6B8FCC" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="4 4" stroke="var(--border-default)" vertical={false} />
                              <XAxis
                                 dataKey="label"
                                 tick={{ fill: 'var(--text-hint)', fontSize: 10 }}
                                 axisLine={{ stroke: 'var(--border-default)' }}
                                 tickLine={false}
                                 interval="preserveStartEnd"
                                 minTickGap={30}
                                 label={{
                                    value: 'Date',
                                    position: 'insideBottom',
                                    offset: -15,
                                    style: { fill: 'var(--text-hint)', fontSize: 11, fontWeight: 600 },
                                 }}
                              />
                              <YAxis
                                 tick={{ fill: 'var(--text-hint)', fontSize: 10 }}
                                 axisLine={{ stroke: 'var(--border-default)' }}
                                 tickLine={false}
                                 width={44}
                                 allowDecimals={false}
                                 label={{
                                    value: 'Uses',
                                    angle: -90,
                                    position: 'insideLeft',
                                    offset: 5,
                                    style: { fill: 'var(--text-hint)', fontSize: 11, fontWeight: 600, textAnchor: 'middle' },
                                 }}
                              />
                              <Tooltip
                                 contentStyle={{
                                    background: 'var(--surface-medium)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 8,
                                    fontSize: 12,
                                 }}
                                 cursor={{ stroke: 'var(--border-strong)' }}
                              />
                              <Area
                                 type="monotone"
                                 dataKey="value"
                                 stroke="#6B8FCC"
                                 strokeWidth={2}
                                 fill="url(#genGradient)"
                                 name="Uses"
                              />
                           </AreaChart>
                        </ResponsiveContainer>
                     )}
                  </div>
               </div>
            </div>

            {/* Full-width Requests-over-time bar chart */}
            <div className={CARD} style={CARD_STYLE}>
               <SectionLabel>Requests</SectionLabel>
               <div className="mt-5 w-full" style={{ height: 320 }}>
                  {requestTrendData.length === 0 ? (
                     <div className="h-full flex items-center justify-center">
                        <p className="text-xs" style={{ color: 'var(--text-hint)' }}>No request data available yet.</p>
                     </div>
                  ) : (
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={requestTrendData} margin={{ top: 10, right: 15, bottom: 45, left: 15 }}>
                           <CartesianGrid strokeDasharray="4 4" stroke="var(--border-default)" vertical={false} />
                           <XAxis
                              dataKey="month"
                              tick={{ fill: 'var(--text-hint)', fontSize: 11 }}
                              axisLine={{ stroke: 'var(--border-default)' }}
                              tickLine={false}
                              interval="preserveStartEnd"
                              minTickGap={30}
                              label={{
                                 value: 'Period',
                                 position: 'insideBottom',
                                 offset: -15,
                                 style: { fill: 'var(--text-hint)', fontSize: 11, fontWeight: 600 },
                              }}
                           />
                           <YAxis
                              tick={{ fill: 'var(--text-hint)', fontSize: 11 }}
                              axisLine={{ stroke: 'var(--border-default)' }}
                              tickLine={false}
                              allowDecimals={false}
                              label={{
                                 value: 'Requests',
                                 angle: -90,
                                 position: 'insideLeft',
                                 offset: 5,
                                 style: { fill: 'var(--text-hint)', fontSize: 11, fontWeight: 600, textAnchor: 'middle' },
                              }}
                           />
                           <Tooltip
                              contentStyle={{
                                 background: 'var(--surface-medium)',
                                 border: '1px solid var(--border-default)',
                                 borderRadius: 8,
                                 fontSize: 12,
                              }}
                              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                           />
                           <Legend
                              iconType="square"
                              wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)', paddingTop: 10 }}
                           />
                           <Bar dataKey="Requests" fill="#10B981" radius={[4, 4, 0, 0]} barSize={18} />
                        </BarChart>
                     </ResponsiveContainer>
                  )}
               </div>
            </div>
            </>
            )}
         </Layout>
      </PrivateRoute>
   );
};

export default Dashboard;
