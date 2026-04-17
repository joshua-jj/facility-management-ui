import { appActions, dashboardActions, requestActions } from '@/actions';
import {
   DueReturnsIcon,
   TotalItemsIcon,
   TotalReportsIcon,
   TotalRequestsIcon,
} from '@/components/Icons';
import Layout from '@/components/Layout';
import { Column, Table } from '@/components/Table';
import { RootState } from '@/redux/reducers';
import { Request } from '@/types';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import LineChart from '@/components/LineChart';
import Calendar from '@/components/Calendar';
import PrivateRoute from '@/components/PrivateRoute';
import { RoleId } from '@/constants/roles.constant';
import AnimatedNumber from '@/components/AnimatedNumber';
import { PhoneDisplay } from '@/components/FormatValue';
import { dashboardConstants, authConstants } from '@/constants';
import { getObjectFromStorage } from '@/utilities/helpers';
import { exportToCsv } from '@/utilities/exportCsv';
import axios from 'axios';
import Sparkline from '@/components/dashboard/Sparkline';
import SegmentedBar from '@/components/dashboard/SegmentedBar';
import CalendarHeatmap from '@/components/dashboard/CalendarHeatmap';
import TopNList from '@/components/dashboard/TopNList';

/* ── Premium design tokens ── */
const CARD =
   'premium-card rounded-2xl bg-white/80 dark:bg-white/[0.035] backdrop-blur-sm border border-[rgba(15,37,82,0.06)] dark:border-white/[0.06] transition-all duration-300';
const PANEL =
   'premium-panel rounded-2xl border border-[rgba(15,37,82,0.06)] dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.035] backdrop-blur-sm transition-all duration-300';
const VIEW_ALL =
   'rounded-full px-3.5 py-1.5 border border-[#E4E5E7] dark:border-white/10 text-[#848A95] dark:text-white/50 text-[0.65rem] font-semibold uppercase tracking-wider hover:bg-[#B28309]/5 hover:border-[#B28309]/30 hover:text-[#B28309] dark:hover:bg-[#D4A84B]/10 dark:hover:border-[#D4A84B]/30 dark:hover:text-[#D4A84B] transition-all duration-200 press-effect';
const SECTION_TITLE =
   'text-[0.65rem] font-bold uppercase tracking-[0.12em] flex items-center gap-2';

/* ── Status colors ── */
const STATUS_COLORS: Record<string, string> = {
   pending: '#F59E0B',
   approved: '#10B981',
   resolved: '#10B981',
   good: '#10B981',
   completed: '#3B82F6',
   declined: '#EF4444',
   fault: '#EF4444',
   bad: '#EF4444',
   'pending verification': 'var(--color-secondary)',
   other: 'var(--color-secondary)',
};

function statusColor(label: string): string {
   return STATUS_COLORS[label.toLowerCase()] ?? 'var(--color-secondary)';
}

const Dashboard = () => {
   const dispatch = useDispatch();
   const [isExportingReport, setIsExportingReport] = useState(false);
   const [trendPeriod, setTrendPeriod] = useState<string>('6months');
   const { userDetails } = useSelector((s: RootState) => s.user);
   const { IsRequestingRequests, allRequestsList } = useSelector((s: RootState) => s.request);
   const { IsFetchingDashboardStats, dashboardStats, dashboardAnalytics } = useSelector(
      (s: RootState) => s.dashboard,
   );

   useEffect(() => {
      dispatch(dashboardActions.getDashboardStats() as unknown as UnknownAction);
      dispatch(dashboardActions.getDashboardAnalytics() as unknown as UnknownAction);

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
   }, [dispatch, userDetails]);

   const handlePeriodChange = useCallback(
      (period: string) => {
         setTrendPeriod(period);
         dispatch(dashboardActions.getDashboardAnalytics(period) as unknown as UnknownAction);
      },
      [dispatch],
   );

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

   // ── Map sparkline API shape (count) → component shape (value) ──
   const requestsSparkline = useMemo(
      () => (dashboardAnalytics?.requestsSparkline ?? []).map((p) => ({ date: p.date, value: p.count })),
      [dashboardAnalytics],
   );
   const itemsSparkline = useMemo(
      () => (dashboardAnalytics?.itemsSparkline ?? []).map((p) => ({ date: p.date, value: p.count })),
      [dashboardAnalytics],
   );
   const reportsSparkline = useMemo(
      () => (dashboardAnalytics?.reportsSparkline ?? []).map((p) => ({ date: p.date, value: p.count })),
      [dashboardAnalytics],
   );
   const usersSparkline = useMemo(
      () => (dashboardAnalytics?.usersSparkline ?? []).map((p) => ({ date: p.date, value: p.count })),
      [dashboardAnalytics],
   );

   // ── Generator trend sparklines ──
   const generatorHoursTrend = useMemo(
      () =>
         (dashboardAnalytics?.generatorStats?.hoursUsedTrend ?? []).map((p) => ({
            month: p.date,
            count: String(p.hours),
         })),
      [dashboardAnalytics],
   );
   const generatorFaultTrend = useMemo(
      () =>
         (dashboardAnalytics?.generatorStats?.faultFrequency ?? []).map((p) => ({
            month: p.date,
            count: String(p.count),
         })),
      [dashboardAnalytics],
   );

   // ── Maintenance cost trend ──
   const maintenanceTrend = useMemo(() => {
      const data = dashboardAnalytics?.maintenanceCostTrend;
      if (!data || data.length === 0) return undefined;
      return data.map((d) => ({ month: d.month, count: d.totalCost ?? '0' }));
   }, [dashboardAnalytics]);

   // ── Calendar events from upcoming schedules ──
   const calendarEvents = useMemo(() => {
      const schedules = dashboardAnalytics?.upcomingSchedules ?? [];
      return schedules.map((s) => ({
         id: String(s.id),
         date: format(parseISO(s.scheduledDate), 'yyyy-MM-dd'),
         title: s.title,
         description: s.description,
      }));
   }, [dashboardAnalytics]);

   // ── Generator recent logs for display ──
   const recentGeneratorLogs = useMemo(
      () => dashboardAnalytics?.generatorStats?.recentLogs ?? [],
      [dashboardAnalytics],
   );

   // ── Requests-by-status segmented bar ──
   const requestsByStatusSegments = useMemo(
      () =>
         (dashboardStats?.requestsByStatus ?? []).map((s) => ({
            label: s.status,
            value: s.count,
            color: statusColor(s.status),
         })),
      [dashboardStats],
   );

   // ── Items-by-condition segmented bar ──
   const itemsByConditionSegments = useMemo(
      () =>
         (dashboardStats?.itemsByCondition ?? []).map((s) => ({
            label: s.condition,
            value: s.count,
            color: statusColor(s.condition),
         })),
      [dashboardStats],
   );

   // ── Complaints-by-status segmented bar ──
   const complaintsByStatusSegments = useMemo(
      () =>
         (dashboardAnalytics?.complaintsByStatus ?? []).map((s) => ({
            label: s.status,
            value: s.count,
            color: statusColor(s.status),
         })),
      [dashboardAnalytics],
   );

   // ── Item availability segmented bar ──
   const itemAvailabilitySegments = useMemo(
      () => [
         {
            label: 'Available',
            value: dashboardAnalytics?.itemAvailability?.available ?? 0,
            color: '#10B981',
         },
         {
            label: 'Unavailable',
            value: dashboardAnalytics?.itemAvailability?.unavailable ?? 0,
            color: '#EF4444',
         },
      ],
      [dashboardAnalytics],
   );

   // ── Top-N rows ──
   const topDeptRows = useMemo(
      () =>
         (dashboardAnalytics?.topDepartmentsByRequests ?? []).map((d) => ({
            label: d.departmentName,
            value: d.count,
         })),
      [dashboardAnalytics],
   );
   const topItemRows = useMemo(
      () =>
         (dashboardAnalytics?.topRequestedItems ?? []).map((d) => ({
            label: d.itemName,
            value: d.count,
         })),
      [dashboardAnalytics],
   );
   const topArtisanRows = useMemo(
      () =>
         (dashboardAnalytics?.topArtisansByCost ?? []).map((d) => ({
            label: d.artisanName,
            value: d.totalCost,
            subLabel: `${d.logCount} log${d.logCount !== 1 ? 's' : ''}`,
         })),
      [dashboardAnalytics],
   );

   // ── Request volume heatmap ──
   const heatmapData = useMemo(
      () => dashboardAnalytics?.requestVolumeHeatmap ?? [],
      [dashboardAnalytics],
   );

   const columns: Column<Request>[] = [
      { key: 'createdBy', header: 'CHURCH/MINISTRY NAME' },
      { key: 'requesterHodEmail', header: 'EMAIL ADDRESS' },
      {
         key: 'requesterHodPhone',
         header: 'PHONE NUMBER',
         render: (value: unknown, row: Request) => (
            <PhoneDisplay value={String(value || row.requesterPhone || '')} />
         ),
      },
      {
         key: 'dateOfReturn',
         header: 'RETURN DATE',
         render: (value: string | number) => {
            try {
               return <span>{format(parseISO(String(value)), 'yyyy-MM-dd')}</span>;
            } catch {
               return <span>-</span>;
            }
         },
      },
   ];

   const isLoading = IsRequestingRequests || IsFetchingDashboardStats;

   return (
      <PrivateRoute>
         <Layout title="Dashboard">
            {/* ── Welcome banner ── */}
            <div className="animate-page-enter mb-6 md:mb-8">
               <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                     <h1
                        className="text-xl md:text-2xl font-bold tracking-tight"
                        style={{ color: 'var(--text-primary)' }}
                     >
                        {greeting}, {userDetails?.firstName ?? 'Admin'}
                     </h1>
                     <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--text-hint)' }}>
                        Here&apos;s what&apos;s happening across your facilities today
                     </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-end">
                     <button
                        onClick={handleExportDailyReport}
                        disabled={isExportingReport}
                        className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-[#0F2552]/15 dark:border-[#6B8FCC]/20 text-[#0F2552] dark:text-[#6B8FCC] bg-[#0F2552]/5 dark:bg-[#6B8FCC]/10 hover:bg-[#0F2552]/10 dark:hover:bg-[#6B8FCC]/20 press-effect"
                     >
                        {isExportingReport ? (
                           <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
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
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                           </svg>
                        )}
                        Daily Report
                     </button>
                     <span className="text-[0.65rem] font-medium px-3 py-1.5 rounded-full bg-[#B28309]/8 dark:bg-[#D4A84B]/12 text-[#B28309] dark:text-[#D4A84B] border border-[#B28309]/15 dark:border-[#D4A84B]/20">
                        {format(new Date(), 'EEEE, MMMM d, yyyy')}
                     </span>
                  </div>
               </div>
               <div className="mt-4 h-px bg-gradient-to-r from-[#B28309]/30 via-[#0F2552]/10 to-transparent dark:from-[#D4A84B]/25 dark:via-[#6B8FCC]/10 dark:to-transparent" />
            </div>

            {/* ── A. KPI strip — 4 cards with sparklines ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-5">
               {/* Total Requests */}
               <div
                  className={`animate-stat-pop hover-lift relative overflow-hidden p-4 md:p-5 ${CARD}`}
                  style={{ animationDelay: '0s' }}
               >
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#0F2552]/8 dark:bg-[#6B8FCC]/15">
                        <TotalRequestsIcon />
                     </div>
                     <span
                        className="uppercase text-[0.6rem] font-semibold tracking-wider"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        Total Requests
                     </span>
                  </div>
                  <h2
                     className="text-2xl md:text-3xl font-bold tabular-nums tracking-tight mb-3"
                     style={{ color: 'var(--text-primary)' }}
                  >
                     <AnimatedNumber value={dashboardStats?.totalRequests ?? 0} delay={100} />
                  </h2>
                  <Sparkline
                     data={requestsSparkline}
                     color="#6B8FCC"
                     height={36}
                     showDelta
                     className="w-full"
                  />
               </div>

               {/* Total Items */}
               <div
                  className={`animate-stat-pop hover-lift relative overflow-hidden p-4 md:p-5 ${CARD}`}
                  style={{ animationDelay: '0.08s' }}
               >
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#B28309]/8 dark:bg-[#D4A84B]/15">
                        <TotalItemsIcon />
                     </div>
                     <span
                        className="uppercase text-[0.6rem] font-semibold tracking-wider"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        Total Items
                     </span>
                  </div>
                  <h2
                     className="text-2xl md:text-3xl font-bold tabular-nums tracking-tight mb-3"
                     style={{ color: 'var(--text-primary)' }}
                  >
                     <AnimatedNumber value={dashboardStats?.totalItems ?? 0} delay={180} />
                  </h2>
                  <Sparkline
                     data={itemsSparkline}
                     color="#D4A84B"
                     height={36}
                     showDelta
                     className="w-full"
                  />
               </div>

               {/* Total Reports */}
               <div
                  className={`animate-stat-pop hover-lift relative overflow-hidden p-4 md:p-5 ${CARD}`}
                  style={{ animationDelay: '0.16s' }}
               >
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#ef4444]/8 dark:bg-[#ef4444]/15">
                        <TotalReportsIcon />
                     </div>
                     <span
                        className="uppercase text-[0.6rem] font-semibold tracking-wider"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        Total Reports
                     </span>
                  </div>
                  <h2
                     className="text-2xl md:text-3xl font-bold tabular-nums tracking-tight mb-3"
                     style={{ color: 'var(--text-primary)' }}
                  >
                     <AnimatedNumber value={dashboardStats?.totalReports ?? 0} delay={260} />
                  </h2>
                  <Sparkline
                     data={reportsSparkline}
                     color="#EF4444"
                     height={36}
                     showDelta
                     className="w-full"
                  />
               </div>

               {/* Total Users */}
               <div
                  className={`animate-stat-pop hover-lift relative overflow-hidden p-4 md:p-5 ${CARD}`}
                  style={{ animationDelay: '0.24s' }}
               >
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#22c55e]/8 dark:bg-[#22c55e]/15">
                        <DueReturnsIcon />
                     </div>
                     <span
                        className="uppercase text-[0.6rem] font-semibold tracking-wider"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        Total Users
                     </span>
                  </div>
                  <h2
                     className="text-2xl md:text-3xl font-bold tabular-nums tracking-tight mb-3"
                     style={{ color: 'var(--text-primary)' }}
                  >
                     <AnimatedNumber value={dashboardAnalytics?.totalUsers ?? 0} delay={340} />
                  </h2>
                  <Sparkline
                     data={usersSparkline}
                     color="#22c55e"
                     height={36}
                     showDelta
                     className="w-full"
                  />
               </div>
            </div>

            {/* ── B. Distribution panel — 4 segmented bars ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-5">
               {/* Requests by status */}
               <div className={`animate-stat-pop p-5 ${PANEL} overflow-hidden`}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6B8FCC] via-[#6B8FCC]/30 to-transparent" />
                  <h2 className={`${SECTION_TITLE} mb-1`} style={{ color: 'var(--text-primary)' }}>
                     <span className="w-1.5 h-1.5 rounded-full bg-[#6B8FCC] inline-block" />
                     Requests by Status
                  </h2>
                  <p className="text-[0.6rem] mb-4 font-medium" style={{ color: 'var(--text-hint)' }}>
                     Request lifecycle breakdown
                  </p>
                  <SegmentedBar segments={requestsByStatusSegments} showLegend showPercent />
               </div>

               {/* Items by condition */}
               <div className={`animate-stat-pop p-5 ${PANEL} overflow-hidden`}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#22c55e] via-[#22c55e]/30 to-transparent" />
                  <h2 className={`${SECTION_TITLE} mb-1`} style={{ color: 'var(--text-primary)' }}>
                     <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] inline-block" />
                     Items by Condition
                  </h2>
                  <p className="text-[0.6rem] mb-4 font-medium" style={{ color: 'var(--text-hint)' }}>
                     Inventory health overview
                  </p>
                  <SegmentedBar segments={itemsByConditionSegments} showLegend showPercent />
               </div>

               {/* Complaints by status */}
               <div className={`animate-stat-pop p-5 ${PANEL} overflow-hidden`}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#D4A84B] via-[#D4A84B]/30 to-transparent" />
                  <h2 className={`${SECTION_TITLE} mb-1`} style={{ color: 'var(--text-primary)' }}>
                     <span className="w-1.5 h-1.5 rounded-full bg-[#D4A84B] inline-block" />
                     Complaints by Status
                  </h2>
                  <p className="text-[0.6rem] mb-4 font-medium" style={{ color: 'var(--text-hint)' }}>
                     Resolution breakdown
                  </p>
                  <SegmentedBar segments={complaintsByStatusSegments} showLegend showPercent />
               </div>

               {/* Item availability */}
               <div className={`animate-stat-pop p-5 ${PANEL} overflow-hidden`}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#10B981] via-[#10B981]/30 to-transparent" />
                  <h2 className={`${SECTION_TITLE} mb-1`} style={{ color: 'var(--text-primary)' }}>
                     <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" />
                     Item Availability
                  </h2>
                  <p className="text-[0.6rem] mb-4 font-medium" style={{ color: 'var(--text-hint)' }}>
                     Available vs. unavailable units
                  </p>
                  <SegmentedBar segments={itemAvailabilitySegments} showLegend showPercent />
               </div>
            </div>

            {/* ── C. Top-N leaderboards ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-5 mb-5">
               <div className={`p-5 ${PANEL} overflow-hidden`}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6B8FCC] via-[#6B8FCC]/30 to-transparent" />
                  <TopNList
                     title="Top Departments by Requests"
                     rows={topDeptRows}
                     barColor="#6B8FCC"
                  />
               </div>
               <div className={`p-5 ${PANEL} overflow-hidden`}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#D4A84B] via-[#D4A84B]/30 to-transparent" />
                  <TopNList
                     title="Most Requested Items"
                     rows={topItemRows}
                     barColor="#D4A84B"
                  />
               </div>
               <div className={`p-5 ${PANEL} overflow-hidden`}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#10B981] via-[#10B981]/30 to-transparent" />
                  <TopNList
                     title="Top Artisans by Cost"
                     rows={topArtisanRows}
                     barColor="#10B981"
                     valueFormat={(v) =>
                        `\u20a6${v.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                     }
                  />
               </div>
            </div>

            {/* ── D. Trend panel ── */}
            <div className={`animate-chart-delay-1 ${PANEL} mb-5 overflow-hidden`}>
               <div className="h-[2px] bg-gradient-to-r from-[#B88C00] via-[#D4A84B] to-[#B88C00]/20" />
               <div className="px-6 pt-5 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                     <h2 className={SECTION_TITLE} style={{ color: 'var(--text-primary)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B88C00] inline-block" />
                        Trends
                     </h2>
                     <p className="text-[0.65rem] mt-1" style={{ color: 'var(--text-hint)' }}>
                        Request volume &amp; maintenance cost over time
                     </p>
                  </div>
                  <div className="flex items-center gap-1 self-start">
                     {[
                        { key: 'week', label: 'Week' },
                        { key: 'month', label: 'Month' },
                        { key: '6months', label: '6 Months' },
                        { key: 'year', label: 'Year' },
                     ].map((p) => (
                        <button
                           key={p.key}
                           onClick={() => handlePeriodChange(p.key)}
                           className={`text-[0.6rem] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                              trendPeriod === p.key
                                 ? 'bg-[#B88C00] text-white border-[#B88C00] shadow-sm'
                                 : 'bg-transparent text-[#B88C00] border-[#B88C00]/15 hover:bg-[#B88C00]/8'
                           }`}
                        >
                           {p.label}
                        </button>
                     ))}
                  </div>
               </div>

               {/* Request trend + Maintenance cost — 2 cols */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-[rgba(15,37,82,0.06)] dark:divide-white/[0.06]">
                  <div className="px-6 pt-4 pb-6">
                     <p
                        className="text-[0.6rem] font-semibold uppercase tracking-wider mb-3"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        Request Volume
                     </p>
                     <div style={{ height: 220 }} className="min-h-[14rem]">
                        <LineChart
                           data={dashboardAnalytics?.requestTrend}
                           label="Requests"
                           color="#B88C00"
                        />
                     </div>
                  </div>
                  <div className="px-6 pt-4 pb-6">
                     <p
                        className="text-[0.6rem] font-semibold uppercase tracking-wider mb-3"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        Maintenance Cost (NGN)
                     </p>
                     <div style={{ height: 220 }} className="min-h-[14rem]">
                        <LineChart data={maintenanceTrend} label="Cost (NGN)" color="#0F2552" />
                     </div>
                  </div>
               </div>

               {/* Generator trends — 2 cols below */}
               {(generatorHoursTrend.length > 0 || generatorFaultTrend.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-[rgba(15,37,82,0.06)] dark:divide-white/[0.06] border-t border-[rgba(15,37,82,0.06)] dark:border-white/[0.06]">
                     <div className="px-6 pt-4 pb-6">
                        <p
                           className="text-[0.6rem] font-semibold uppercase tracking-wider mb-3"
                           style={{ color: 'var(--text-hint)' }}
                        >
                           Generator Hours Used
                        </p>
                        <div style={{ height: 180 }} className="min-h-[11rem]">
                           <LineChart
                              data={generatorHoursTrend}
                              label="Hours"
                              color="#D4A84B"
                           />
                        </div>
                     </div>
                     <div className="px-6 pt-4 pb-6">
                        <p
                           className="text-[0.6rem] font-semibold uppercase tracking-wider mb-3"
                           style={{ color: 'var(--text-hint)' }}
                        >
                           Generator Fault Frequency
                        </p>
                        <div style={{ height: 180 }} className="min-h-[11rem]">
                           <LineChart
                              data={generatorFaultTrend}
                              label="Faults"
                              color="#EF4444"
                           />
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {/* ── E. Request Activity Heatmap (12 months, full width) ── */}
            <div className={`${PANEL} mb-5 overflow-hidden`}>
               <div className="h-[2px] bg-gradient-to-r from-[#B28309] via-[#B28309]/40 to-transparent" />
               <div className="px-6 pt-5 pb-2 flex items-center justify-between">
                  <div>
                     <h2 className={SECTION_TITLE} style={{ color: 'var(--text-primary)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B28309] inline-block" />
                        Request Activity — Last 12 Months
                     </h2>
                     <p className="text-[0.65rem] mt-1 font-medium" style={{ color: 'var(--text-hint)' }}>
                        Daily request volume heat map — color intensity = request count
                     </p>
                  </div>
               </div>
               <div className="px-6 pb-8 pt-3 overflow-x-auto">
                  <CalendarHeatmap data={heatmapData} cellSize={16} gap={4} />
               </div>
            </div>

            {/* ── F. Recent activity section ── */}

            {/* Requests table + Generator usage */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 mb-5">
               <div className="lg:col-span-7 p-0">
                  <div className={`animate-card-delay-3 ${PANEL} overflow-hidden`}>
                     <div className="h-[2px] bg-gradient-to-r from-[#0F2552] dark:from-[#6B8FCC] via-[#0F2552]/30 dark:via-[#6B8FCC]/30 to-transparent" />
                     <div className="px-5 py-5 flex items-center justify-between">
                        <h1 className={SECTION_TITLE} style={{ color: 'var(--text-primary)' }}>
                           <span className="w-1.5 h-1.5 rounded-full bg-[#0F2552] dark:bg-[#6B8FCC] inline-block" />
                           Recent Requests
                        </h1>
                        <Link href="/admin/requests" className={VIEW_ALL}>
                           View All
                        </Link>
                     </div>
                     <Table
                        data={allRequestsList?.slice(0, 5)}
                        loading={isLoading}
                        columns={columns}
                     />
                  </div>
               </div>
               <div className="lg:col-span-3">
                  <div className={`animate-chart-delay-3 p-5 ${PANEL} overflow-hidden`}>
                     <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#B88C00] via-[#B88C00]/40 to-transparent" />
                     <div className="mb-5">
                        <h2 className={SECTION_TITLE} style={{ color: 'var(--text-primary)' }}>
                           <span className="w-1.5 h-1.5 rounded-full bg-[#B88C00] inline-block" />
                           Generator Usage
                        </h2>
                        <p className="text-[0.6rem] mt-1 font-medium" style={{ color: 'var(--text-hint)' }}>
                           Recent logs
                        </p>
                     </div>
                     <div className="space-y-2 max-h-[180px] overflow-y-auto premium-scrollbar">
                        {recentGeneratorLogs.length > 0 ? (
                           recentGeneratorLogs.map((log) => {
                              const hours = Math.round((log.hoursUsed ?? 0) / 3600);
                              const maxHours = Math.max(
                                 ...recentGeneratorLogs.map((l) => Math.round((l.hoursUsed ?? 0) / 3600)),
                                 1,
                              );
                              const pct = Math.min((hours / maxHours) * 100, 100);
                              return (
                                 <div key={log.id} className="group">
                                    <div className="flex items-center justify-between mb-1">
                                       <span
                                          className="text-[0.65rem] font-semibold truncate max-w-[60%]"
                                          style={{ color: 'var(--text-primary)' }}
                                       >
                                          {log.nameOfMeeting || log.generatorType}
                                       </span>
                                       <div className="flex items-center gap-1.5">
                                          {log.faultDetected && (
                                             <span className="text-[0.5rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/15">
                                                Fault
                                             </span>
                                          )}
                                          <span
                                             className="text-[0.65rem] font-bold tabular-nums"
                                             style={{ color: log.faultDetected ? '#ef4444' : '#B88C00' }}
                                          >
                                             {hours.toLocaleString()}h
                                          </span>
                                       </div>
                                    </div>
                                    <div
                                       className="h-2 rounded-full overflow-hidden"
                                       style={{ background: 'var(--surface-medium)' }}
                                    >
                                       <div
                                          className="h-full rounded-full transition-all duration-500"
                                          style={{
                                             width: `${pct}%`,
                                             background: log.faultDetected
                                                ? 'linear-gradient(90deg, #ef4444, #f87171)'
                                                : 'linear-gradient(90deg, #B88C00, #D4A84B)',
                                          }}
                                       />
                                    </div>
                                 </div>
                              );
                           })
                        ) : (
                           <div className="flex items-center justify-center h-full py-8">
                              <p className="text-xs font-medium" style={{ color: 'var(--text-hint)' }}>
                                 No recent logs
                              </p>
                           </div>
                        )}
                     </div>
                     {dashboardAnalytics?.generatorStats && (
                        <div className="mt-5 grid grid-cols-3 gap-2.5">
                           <div className="p-3 bg-gray-50/80 dark:bg-white/[0.03] rounded-xl text-center border border-transparent dark:border-white/[0.04]">
                              <span className="block text-[0.55rem] uppercase font-bold tracking-wider text-gray-400 dark:text-white/40 mb-1">
                                 Logs
                              </span>
                              <span className="text-sm font-bold tabular-nums text-[#0F2552] dark:text-white/85">
                                 <AnimatedNumber
                                    value={dashboardAnalytics.generatorStats.totalLogs}
                                    delay={600}
                                 />
                              </span>
                           </div>
                           <div className="p-3 bg-[#B88C00]/5 dark:bg-[#B88C00]/10 rounded-xl text-center border border-[#B88C00]/10 dark:border-[#B88C00]/15">
                              <span className="block text-[0.55rem] uppercase font-bold tracking-wider text-gray-400 dark:text-white/40 mb-1">
                                 Avg Hrs
                              </span>
                              <span className="text-sm font-bold tabular-nums text-[#B88C00]">
                                 <AnimatedNumber
                                    value={Math.round(dashboardAnalytics.generatorStats.avgHours / 3600)}
                                    delay={700}
                                    suffix="h"
                                 />
                              </span>
                           </div>
                           <div className="p-3 bg-red-50/80 dark:bg-red-500/10 rounded-xl text-center border border-red-200/30 dark:border-red-500/15">
                              <span className="block text-[0.55rem] uppercase font-bold tracking-wider text-gray-400 dark:text-white/40 mb-1">
                                 Faults
                              </span>
                              <span className="text-sm font-bold tabular-nums text-red-500">
                                 <AnimatedNumber
                                    value={dashboardAnalytics.generatorStats.faultCount}
                                    delay={800}
                                 />
                              </span>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Calendar + Upcoming schedules + Recent maintenance */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 mb-5">
               <div className="lg:col-span-4">
                  <div className={`animate-card-delay-5 p-5 ${PANEL} min-h-[22rem] overflow-hidden`}>
                     <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#B28309] via-[#B28309]/30 to-transparent" />
                     <div className="mb-4">
                        <h2 className={SECTION_TITLE} style={{ color: 'var(--text-primary)' }}>
                           <span className="w-1.5 h-1.5 rounded-full bg-[#B28309] inline-block" />
                           Maintenance Schedule
                        </h2>
                     </div>
                     <Calendar events={calendarEvents} />
                  </div>
               </div>
               <div className="lg:col-span-3">
                  <div className={`animate-card-delay-5 p-5 ${PANEL} min-h-[22rem] overflow-hidden`}>
                     <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#D4A84B] via-[#D4A84B]/30 to-transparent" />
                     <h2 className={`${SECTION_TITLE} mb-4`} style={{ color: 'var(--text-primary)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A84B] inline-block" />
                        Upcoming Schedules
                     </h2>
                     <div className="space-y-2.5 max-h-[18rem] overflow-y-auto premium-scrollbar">
                        {(dashboardAnalytics?.upcomingSchedules ?? []).length > 0 ? (
                           dashboardAnalytics?.upcomingSchedules.map((s) => (
                              <div
                                 key={s.id}
                                 className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.03] border-l-[3px] border-[#B28309] hover:bg-gray-100/80 dark:hover:bg-white/[0.05] transition-colors"
                              >
                                 <p className="text-xs font-semibold truncate">{s.title}</p>
                                 <p
                                    className="text-[0.6rem] mt-1 font-medium"
                                    style={{ color: 'var(--text-hint)' }}
                                 >
                                    {format(parseISO(s.scheduledDate), 'MMM d, yyyy')}
                                 </p>
                              </div>
                           ))
                        ) : (
                           <div className="flex flex-col items-center justify-center py-10">
                              <div className="w-10 h-10 rounded-full bg-[#B28309]/8 dark:bg-[#D4A84B]/10 flex items-center justify-center mb-3">
                                 <span className="text-[#B28309] dark:text-[#D4A84B] text-lg">--</span>
                              </div>
                              <p className="text-xs font-medium" style={{ color: 'var(--text-hint)' }}>
                                 No upcoming schedules
                              </p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
               <div className="lg:col-span-3">
                  <div className={`animate-card-delay-6 p-5 ${PANEL} min-h-[22rem] overflow-hidden`}>
                     <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6B8FCC] via-[#6B8FCC]/30 to-transparent" />
                     <h2 className={`${SECTION_TITLE} mb-4`} style={{ color: 'var(--text-primary)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6B8FCC] inline-block" />
                        Recent Maintenance
                     </h2>
                     <div className="space-y-2.5 max-h-[18rem] overflow-y-auto premium-scrollbar">
                        {(dashboardAnalytics?.recentMaintenanceLogs ?? []).length > 0 ? (
                           dashboardAnalytics?.recentMaintenanceLogs.map((log) => (
                              <div
                                 key={log.id}
                                 className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.03] hover:bg-gray-100/80 dark:hover:bg-white/[0.05] transition-colors"
                              >
                                 <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold truncate max-w-[60%]">
                                       {log.artisanName}
                                    </p>
                                    <span className="text-[0.6rem] font-bold text-[#B28309] dark:text-[#D4A84B] tabular-nums">
                                       NGN {Number(log.costOfMaintenance).toLocaleString()}
                                    </span>
                                 </div>
                                 <p
                                    className="text-[0.6rem] mt-1 truncate"
                                    style={{ color: 'var(--text-secondary)' }}
                                 >
                                    {log.description}
                                 </p>
                                 <p
                                    className="text-[0.55rem] mt-1 font-medium"
                                    style={{ color: 'var(--text-hint)' }}
                                 >
                                    {format(parseISO(log.maintenanceDate), 'MMM d, yyyy')}
                                 </p>
                              </div>
                           ))
                        ) : (
                           <div className="flex flex-col items-center justify-center py-10">
                              <div className="w-10 h-10 rounded-full bg-[#6B8FCC]/8 dark:bg-[#6B8FCC]/10 flex items-center justify-center mb-3">
                                 <span className="text-[#6B8FCC] text-lg">--</span>
                              </div>
                              <p className="text-xs font-medium" style={{ color: 'var(--text-hint)' }}>
                                 No maintenance logs
                              </p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Reports table + Due returns table */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-5">
               <div className="lg:col-span-5 p-0">
                  <div className={`animate-card-delay-5 ${PANEL} overflow-hidden`}>
                     <div className="h-[2px] bg-gradient-to-r from-[#3b82f6] via-[#3b82f6]/30 to-transparent" />
                     <div className="px-5 py-5 flex items-center justify-between">
                        <h1 className={SECTION_TITLE} style={{ color: 'var(--text-primary)' }}>
                           <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] inline-block" />
                           Reports
                        </h1>
                        <Link href="/admin/reports" className={VIEW_ALL}>
                           View All
                        </Link>
                     </div>
                     <Table
                        data={allRequestsList?.slice(0, 5)}
                        loading={IsRequestingRequests}
                        columns={columns}
                     />
                  </div>
               </div>
               <div className="lg:col-span-5 p-0">
                  <div className={`animate-card-delay-6 ${PANEL} overflow-hidden`}>
                     <div className="h-[2px] bg-gradient-to-r from-[#ef4444] via-[#ef4444]/30 to-transparent" />
                     <div className="px-5 py-5 flex items-center justify-between">
                        <h1 className={SECTION_TITLE} style={{ color: 'var(--text-primary)' }}>
                           <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] inline-block" />
                           Due Returns
                        </h1>
                        <Link href="/admin/dashboard" className={VIEW_ALL}>
                           View All
                        </Link>
                     </div>
                     <Table
                        data={allRequestsList?.slice(0, 5)}
                        loading={IsRequestingRequests}
                        columns={columns}
                     />
                  </div>
               </div>
            </div>
         </Layout>
      </PrivateRoute>
   );
};

export default Dashboard;