import { dashboardActions, requestActions } from '@/actions';
import BarChart from '@/components/BarChart';
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
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import DoughnutChart from '@/components/DoughnutChart';
import Calendar from '@/components/Calendar';
import LineChart from '@/components/LineChart';
import PrivateRoute from '@/components/PrivateRoute';
import { RoleId } from '@/constants/roles.constant';
import AnimatedNumber from '@/components/AnimatedNumber';
import { PhoneDisplay } from '@/components/FormatValue';

/* ── Premium design tokens ── */
const CARD =
   'premium-card rounded-2xl bg-white/80 dark:bg-white/[0.035] backdrop-blur-sm border border-[rgba(15,37,82,0.06)] dark:border-white/[0.06] transition-all duration-300';
const PANEL =
   'premium-panel rounded-2xl border border-[rgba(15,37,82,0.06)] dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.035] backdrop-blur-sm transition-all duration-300';
const VIEW_ALL =
   'rounded-full px-3.5 py-1.5 border border-[#E4E5E7] dark:border-white/10 text-[#848A95] dark:text-white/50 text-[0.65rem] font-semibold uppercase tracking-wider hover:bg-[#B28309]/5 hover:border-[#B28309]/30 hover:text-[#B28309] dark:hover:bg-[#D4A84B]/10 dark:hover:border-[#D4A84B]/30 dark:hover:text-[#D4A84B] transition-all duration-200 press-effect';
const SECTION_TITLE =
   'text-[0.65rem] font-bold uppercase tracking-[0.12em] flex items-center gap-2';

const STAT_ICON_COLORS = [
   { bg: 'bg-[#0F2552]/8 dark:bg-[#6B8FCC]/15', glow: 'shadow-[0_0_20px_rgba(15,37,82,0.1)] dark:shadow-[0_0_20px_rgba(107,143,204,0.15)]' },
   { bg: 'bg-[#B28309]/8 dark:bg-[#D4A84B]/15', glow: 'shadow-[0_0_20px_rgba(178,131,9,0.1)] dark:shadow-[0_0_20px_rgba(212,168,75,0.15)]' },
   { bg: 'bg-[#ef4444]/8 dark:bg-[#ef4444]/15', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.1)] dark:shadow-[0_0_20px_rgba(239,68,68,0.15)]' },
   { bg: 'bg-[#22c55e]/8 dark:bg-[#22c55e]/15', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.1)] dark:shadow-[0_0_20px_rgba(34,197,94,0.15)]' },
];

const SECONDARY_COLORS = ['#6B8FCC', '#3b82f6', '#22c55e', '#ef4444'];

const Dashboard = () => {
   const dispatch = useDispatch();
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

   const greeting = useMemo(() => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 17) return 'Good afternoon';
      return 'Good evening';
   }, []);

   // ── Stat cards ──
   const stats = useMemo(
      () => [
         {
            id: 1,
            icon: <TotalRequestsIcon />,
            label: 'total requests',
            value: dashboardStats?.totalRequests ?? 0,
         },
         {
            id: 2,
            icon: <DueReturnsIcon />,
            label: 'due returns',
            value: dashboardStats?.dueReturns ?? 0,
         },
         {
            id: 3,
            icon: <TotalReportsIcon />,
            label: 'total reports',
            value: dashboardStats?.totalReports ?? 0,
         },
         {
            id: 4,
            icon: <TotalItemsIcon />,
            label: 'total items',
            value: dashboardStats?.totalItems ?? 0,
         },
      ],
      [dashboardStats],
   );

   // ── Secondary stats from analytics ──
   const secondaryStats = useMemo(
      () => [
         { id: 5, label: 'total users', value: dashboardAnalytics?.totalUsers ?? 0, color: '#6B8FCC' },
         { id: 6, label: 'total units', value: dashboardAnalytics?.totalItemUnits ?? 0, color: '#3b82f6' },
         {
            id: 7,
            label: 'available units',
            value: dashboardAnalytics?.itemAvailability?.available ?? 0,
            color: '#22c55e',
         },
         {
            id: 8,
            label: 'due for service',
            value: dashboardAnalytics?.generatorStats?.dueForServiceCount ?? 0,
            color: '#ef4444',
         },
      ],
      [dashboardAnalytics],
   );

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

   // ── Generator bar chart data ──
   const generatorBarData = useMemo(() => {
      const logs = dashboardAnalytics?.generatorStats?.recentLogs;
      if (!logs || logs.length === 0) return undefined;
      return logs.map((l) => ({ hoursUsed: l.hoursUsed ?? 0, onTime: l.onTime }));
   }, [dashboardAnalytics]);

   // ── Complaints doughnut data ──
   const complaintsChartData = useMemo(() => {
      const data = dashboardAnalytics?.complaintsByStatus;
      if (!data || data.length === 0) return undefined;
      return data.map((d) => ({ condition: d.status ?? 'Unknown', count: d.count }));
   }, [dashboardAnalytics]);

   // ── Maintenance cost trend for line chart ──
   const maintenanceTrend = useMemo(() => {
      const data = dashboardAnalytics?.maintenanceCostTrend;
      if (!data || data.length === 0) return undefined;
      return data.map((d) => ({ month: d.month, count: d.totalCost ?? '0' }));
   }, [dashboardAnalytics]);

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
                     <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        {greeting}, {userDetails?.firstName ?? 'Admin'}
                     </h1>
                     <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--text-hint)' }}>
                        Here&apos;s what&apos;s happening across your facilities today
                     </p>
                  </div>
                  <span className="text-[0.65rem] font-medium px-3 py-1.5 rounded-full bg-[#B28309]/8 dark:bg-[#D4A84B]/12 text-[#B28309] dark:text-[#D4A84B] border border-[#B28309]/15 dark:border-[#D4A84B]/20 self-start sm:self-end">
                     {format(new Date(), 'EEEE, MMMM d, yyyy')}
                  </span>
               </div>
               <div className="mt-4 h-px bg-gradient-to-r from-[#B28309]/30 via-[#0F2552]/10 to-transparent dark:from-[#D4A84B]/25 dark:via-[#6B8FCC]/10 dark:to-transparent" />
            </div>

            {/* ── Row 1: Primary stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-5">
               {stats.map((stat, index) => (
                  <div
                     key={stat.id}
                     className={`animate-stat-pop hover-lift relative overflow-hidden p-4 md:p-6 ${CARD}`}
                     style={{ animationDelay: `${index * 0.08}s` }}
                  >
                     {/* Top gradient accent */}
                     <div
                        className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{
                           background: `linear-gradient(90deg, ${SECONDARY_COLORS[index]}80, ${SECONDARY_COLORS[index]}20)`,
                        }}
                     />
                     <div className="flex items-center gap-3 mb-3 md:mb-5">
                        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${STAT_ICON_COLORS[index].bg} ${STAT_ICON_COLORS[index].glow}`}>
                           {stat.icon}
                        </div>
                        <span className="uppercase text-[0.56rem] md:text-[0.65rem] font-semibold tracking-wider" style={{ color: 'var(--text-hint)' }}>
                           {stat.label}
                        </span>
                     </div>
                     <h2 className="text-lg md:text-3xl font-bold tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        <AnimatedNumber value={stat.value} delay={index * 80 + 200} />
                     </h2>
                  </div>
               ))}
            </div>

            {/* ── Row 2: Secondary stat pills ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-8">
               {secondaryStats.map((stat, index) => (
                  <div
                     key={stat.id}
                     className={`animate-stat-pop hover-lift relative overflow-hidden p-3.5 md:p-4.5 flex items-center justify-between ${CARD}`}
                     style={{ animationDelay: `${0.32 + index * 0.06}s` }}
                  >
                     {/* Left color accent bar */}
                     <div
                        className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-full"
                        style={{ background: stat.color }}
                     />
                     <span className="uppercase text-[0.56rem] md:text-[0.65rem] font-semibold tracking-wider pl-2" style={{ color: 'var(--text-hint)' }}>
                        {stat.label}
                     </span>
                     <span className="text-lg md:text-2xl font-bold tabular-nums tracking-tight" style={{ color: stat.color }}>
                        <AnimatedNumber value={Number(stat.value)} delay={320 + index * 60 + 200} />
                     </span>
                  </div>
               ))}
            </div>

            {/* ── Row 3: Request trend (full width, rich) ── */}
            <div className={`animate-chart-delay-1 ${PANEL} mb-5 overflow-hidden`}>
               {/* Gradient top border */}
               <div className="h-[2px] bg-gradient-to-r from-[#B88C00] via-[#D4A84B] to-[#B88C00]/20" />

               {/* Header */}
               <div className="px-6 pt-5 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                     <h2 className={SECTION_TITLE} style={{ color: 'var(--text-primary)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B88C00] inline-block" />
                        Request Trend
                     </h2>
                     <p className="text-[0.65rem] mt-1" style={{ color: 'var(--text-hint)' }}>Monthly request volume &amp; status overview</p>
                  </div>
                  <span className="text-[0.6rem] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-[#B88C00]/8 dark:bg-[#B88C00]/12 text-[#B88C00] border border-[#B88C00]/15 self-start">
                     Last 6 months
                  </span>
               </div>

               {/* Inline KPI row */}
               <div className="px-6 pt-5 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Total Requests */}
                  <div className="kpi-tile p-3.5 rounded-xl" style={{ background: 'var(--surface-low)' }}>
                     <span className="block text-[0.55rem] uppercase font-bold tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-hint)' }}>
                        Total
                     </span>
                     <span className="text-xl font-bold tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        <AnimatedNumber value={dashboardStats?.totalRequests ?? 0} delay={300} />
                     </span>
                  </div>
                  {/* This Month */}
                  <div className="kpi-tile p-3.5 rounded-xl" style={{ background: 'var(--surface-low)' }}>
                     <span className="block text-[0.55rem] uppercase font-bold tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-hint)' }}>
                        This Month
                     </span>
                     <span className="text-xl font-bold tabular-nums tracking-tight text-[#B88C00]">
                        <AnimatedNumber
                           value={Number(
                              dashboardAnalytics?.requestTrend?.length
                                 ? dashboardAnalytics.requestTrend[dashboardAnalytics.requestTrend.length - 1]?.count ?? 0
                                 : 0,
                           )}
                           delay={400}
                        />
                     </span>
                  </div>
                  {/* Due Returns */}
                  <div className="kpi-tile p-3.5 rounded-xl" style={{ background: 'var(--surface-low)' }}>
                     <span className="block text-[0.55rem] uppercase font-bold tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-hint)' }}>
                        Due Returns
                     </span>
                     <span className="text-xl font-bold tabular-nums tracking-tight text-red-500">
                        <AnimatedNumber value={dashboardStats?.dueReturns ?? 0} delay={500} />
                     </span>
                  </div>
                  {/* Status breakdown mini pills */}
                  <div className="kpi-tile p-3.5 rounded-xl" style={{ background: 'var(--surface-low)' }}>
                     <span className="block text-[0.55rem] uppercase font-bold tracking-[0.1em] mb-2" style={{ color: 'var(--text-hint)' }}>
                        By Status
                     </span>
                     <div className="flex flex-wrap gap-1.5">
                        {(dashboardStats?.requestsByStatus ?? []).slice(0, 4).map((s) => (
                           <span
                              key={s.status}
                              className="text-[0.55rem] font-semibold px-2 py-0.5 rounded-full border"
                              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                           >
                              {s.status} {s.count}
                           </span>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Chart area */}
               <div className="px-6 pt-2 pb-6" style={{ height: 270 }}>
                  <LineChart
                     data={dashboardAnalytics?.requestTrend}
                     label="Requests"
                     color="#B88C00"
                  />
               </div>
            </div>

            {/* ── Row 4: Requests table + Generator usage ── */}
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
                        <p className="text-[0.6rem] mt-1 font-medium" style={{ color: 'var(--text-hint)' }}>Weekly breakdown</p>
                     </div>
                     <div style={{ height: 180 }}>
                        <BarChart data={generatorBarData} />
                     </div>
                     {dashboardAnalytics?.generatorStats && (
                        <div className="mt-5 grid grid-cols-3 gap-2.5">
                           <div className="p-3 bg-gray-50/80 dark:bg-white/[0.03] rounded-xl text-center border border-transparent dark:border-white/[0.04]">
                              <span className="block text-[0.55rem] uppercase font-bold tracking-wider text-gray-400 dark:text-white/40 mb-1">Logs</span>
                              <span className="text-sm font-bold tabular-nums text-[#0F2552] dark:text-white/85">
                                 <AnimatedNumber value={dashboardAnalytics.generatorStats.totalLogs} delay={600} />
                              </span>
                           </div>
                           <div className="p-3 bg-[#B88C00]/5 dark:bg-[#B88C00]/10 rounded-xl text-center border border-[#B88C00]/10 dark:border-[#B88C00]/15">
                              <span className="block text-[0.55rem] uppercase font-bold tracking-wider text-gray-400 dark:text-white/40 mb-1">Avg Hrs</span>
                              <span className="text-sm font-bold tabular-nums text-[#B88C00]">
                                 <AnimatedNumber value={Math.round(dashboardAnalytics.generatorStats.avgHours / 3600)} delay={700} suffix="h" />
                              </span>
                           </div>
                           <div className="p-3 bg-red-50/80 dark:bg-red-500/10 rounded-xl text-center border border-red-200/30 dark:border-red-500/15">
                              <span className="block text-[0.55rem] uppercase font-bold tracking-wider text-gray-400 dark:text-white/40 mb-1">Faults</span>
                              <span className="text-sm font-bold tabular-nums text-red-500">
                                 <AnimatedNumber value={dashboardAnalytics.generatorStats.faultCount} delay={800} />
                              </span>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* ── Row 5: Maintenance cost trend + Complaint status + Item condition ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
               <div className={`animate-chart-delay-1 p-6 ${PANEL} overflow-hidden`}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#0F2552] dark:from-[#6B8FCC] via-[#0F2552]/30 dark:via-[#6B8FCC]/30 to-transparent" />
                  <div className="mb-5 flex items-center justify-between">
                     <div>
                        <h2 className={SECTION_TITLE} style={{ color: 'var(--text-primary)' }}>
                           <span className="w-1.5 h-1.5 rounded-full bg-[#0F2552] dark:bg-[#6B8FCC] inline-block" />
                           Maintenance Cost
                        </h2>
                        <p className="text-[0.6rem] mt-1 font-medium" style={{ color: 'var(--text-hint)' }}>Spend over time</p>
                     </div>
                     <span className="text-[0.6rem] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-[#0F2552]/8 dark:bg-[#6B8FCC]/12 text-[#0F2552] dark:text-[#93b5e8] border border-[#0F2552]/10 dark:border-[#6B8FCC]/20">
                        6 months
                     </span>
                  </div>
                  <div style={{ height: 200 }}>
                     <LineChart data={maintenanceTrend} label="Cost (NGN)" color="#0F2552" />
                  </div>
               </div>
               <div className={`animate-chart-delay-2 p-5 ${PANEL} flex flex-col overflow-hidden`}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#D4A84B] via-[#D4A84B]/30 to-transparent" />
                  <div className="mb-4">
                     <h2 className={SECTION_TITLE} style={{ color: 'var(--text-primary)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A84B] inline-block" />
                        Complaint Status
                     </h2>
                     <p className="text-[0.6rem] mt-1 font-medium" style={{ color: 'var(--text-hint)' }}>Resolution breakdown</p>
                  </div>
                  <div className="flex-1 flex items-center">
                     <DoughnutChart data={complaintsChartData} />
                  </div>
               </div>
               <div className={`animate-chart-delay-3 p-5 ${PANEL} flex flex-col overflow-hidden`}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#22c55e] via-[#22c55e]/30 to-transparent" />
                  <div className="mb-4">
                     <h2 className={SECTION_TITLE} style={{ color: 'var(--text-primary)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] inline-block" />
                        Item Condition
                     </h2>
                     <p className="text-[0.6rem] mt-1 font-medium" style={{ color: 'var(--text-hint)' }}>Inventory health</p>
                  </div>
                  <div className="flex-1 flex items-center">
                     <DoughnutChart data={dashboardStats?.itemsByCondition} centerLabel={String(dashboardStats?.totalItems ?? 0)} />
                  </div>
               </div>
            </div>

            {/* ── Row 6: Calendar + Upcoming schedules list + Recent maintenance ── */}
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
                                 <p className="text-[0.6rem] mt-1 font-medium" style={{ color: 'var(--text-hint)' }}>
                                    {format(parseISO(s.scheduledDate), 'MMM d, yyyy')}
                                 </p>
                              </div>
                           ))
                        ) : (
                           <div className="flex flex-col items-center justify-center py-10">
                              <div className="w-10 h-10 rounded-full bg-[#B28309]/8 dark:bg-[#D4A84B]/10 flex items-center justify-center mb-3">
                                 <span className="text-[#B28309] dark:text-[#D4A84B] text-lg">--</span>
                              </div>
                              <p className="text-xs font-medium" style={{ color: 'var(--text-hint)' }}>No upcoming schedules</p>
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
                              <div key={log.id} className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.03] hover:bg-gray-100/80 dark:hover:bg-white/[0.05] transition-colors">
                                 <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold truncate max-w-[60%]">
                                       {log.artisanName}
                                    </p>
                                    <span className="text-[0.6rem] font-bold text-[#B28309] dark:text-[#D4A84B] tabular-nums">
                                       NGN {Number(log.costOfMaintenance).toLocaleString()}
                                    </span>
                                 </div>
                                 <p className="text-[0.6rem] mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                                    {log.description}
                                 </p>
                                 <p className="text-[0.55rem] mt-1 font-medium" style={{ color: 'var(--text-hint)' }}>
                                    {format(parseISO(log.maintenanceDate), 'MMM d, yyyy')}
                                 </p>
                              </div>
                           ))
                        ) : (
                           <div className="flex flex-col items-center justify-center py-10">
                              <div className="w-10 h-10 rounded-full bg-[#6B8FCC]/8 dark:bg-[#6B8FCC]/10 flex items-center justify-center mb-3">
                                 <span className="text-[#6B8FCC] text-lg">--</span>
                              </div>
                              <p className="text-xs font-medium" style={{ color: 'var(--text-hint)' }}>No maintenance logs</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* ── Row 7: Reports table + Due returns table ── */}
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
