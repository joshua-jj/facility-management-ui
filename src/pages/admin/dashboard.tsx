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

const CARD =
   'rounded-xl bg-[#ffffff] dark:bg-white/[0.04] border border-[rgba(15,37,82,0.06)] dark:border-white/8 shadow-sm dark:shadow-none transition-all duration-300';
const PANEL =
   'rounded-xl border border-[rgba(15,37,82,0.06)] dark:border-white/8 shadow-sm dark:shadow-none bg-white dark:bg-white/[0.04] chart-panel transition-all duration-300';
const VIEW_ALL =
   'rounded-lg px-2.5 py-1 border border-[#E4E5E7] dark:border-white/10 text-[#848A95] dark:text-white/50 text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors press-effect';

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
            {/* ── Row 1: Primary stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4">
               {stats.map((stat, index) => (
                  <div
                     key={stat.id}
                     className={`animate-stat-pop hover-lift p-3 md:p-5 ${CARD}`}
                     style={{ animationDelay: `${index * 0.08}s` }}
                  >
                     <div className="flex items-center mb-2 md:mb-4">
                        {stat.icon}
                        <span className="uppercase text-[0.56rem] md:text-xs ml-3" style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
                     </div>
                     <h2 className="text-md md:text-2xl font-semibold tabular-nums">
                        <AnimatedNumber value={stat.value} delay={index * 80 + 200} />
                     </h2>
                  </div>
               ))}
            </div>

            {/* ── Row 2: Secondary stat pills ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-6">
               {secondaryStats.map((stat, index) => (
                  <div
                     key={stat.id}
                     className={`animate-stat-pop hover-lift p-3 md:p-4 flex items-center justify-between ${CARD}`}
                     style={{ animationDelay: `${0.32 + index * 0.06}s` }}
                  >
                     <span className="uppercase text-[0.56rem] md:text-xs" style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
                     <span className="text-lg md:text-xl font-bold tabular-nums" style={{ color: stat.color }}>
                        <AnimatedNumber value={Number(stat.value)} delay={320 + index * 60 + 200} />
                     </span>
                  </div>
               ))}
            </div>

            {/* ── Row 3: Request trend (full width, rich) ── */}
            <div className={`animate-chart-delay-1 ${PANEL} mb-4`}>
               {/* Header */}
               <div className="px-6 pt-5 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                     <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Request Trend</h2>
                     <p className="text-[0.65rem] mt-0.5" style={{ color: 'var(--text-hint)' }}>Monthly request volume &amp; status overview</p>
                  </div>
                  <span className="text-[0.65rem] font-medium px-2.5 py-1 rounded-full bg-[#B88C00]/10 text-[#B88C00] self-start">Last 6 months</span>
               </div>

               {/* Inline KPI row */}
               <div className="px-6 pt-4 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Total Requests */}
                  <div className="p-3 rounded-lg" style={{ background: 'var(--surface-low)' }}>
                     <span className="block text-[0.6rem] uppercase font-semibold tracking-wider mb-1" style={{ color: 'var(--text-hint)' }}>
                        Total
                     </span>
                     <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                        <AnimatedNumber value={dashboardStats?.totalRequests ?? 0} delay={300} />
                     </span>
                  </div>
                  {/* This Month */}
                  <div className="p-3 rounded-lg" style={{ background: 'var(--surface-low)' }}>
                     <span className="block text-[0.6rem] uppercase font-semibold tracking-wider mb-1" style={{ color: 'var(--text-hint)' }}>
                        This Month
                     </span>
                     <span className="text-xl font-bold tabular-nums text-[#B88C00]">
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
                  <div className="p-3 rounded-lg" style={{ background: 'var(--surface-low)' }}>
                     <span className="block text-[0.6rem] uppercase font-semibold tracking-wider mb-1" style={{ color: 'var(--text-hint)' }}>
                        Due Returns
                     </span>
                     <span className="text-xl font-bold tabular-nums text-red-500">
                        <AnimatedNumber value={dashboardStats?.dueReturns ?? 0} delay={500} />
                     </span>
                  </div>
                  {/* Status breakdown mini pills */}
                  <div className="p-3 rounded-lg" style={{ background: 'var(--surface-low)' }}>
                     <span className="block text-[0.6rem] uppercase font-semibold tracking-wider mb-1.5" style={{ color: 'var(--text-hint)' }}>
                        By Status
                     </span>
                     <div className="flex flex-wrap gap-1.5">
                        {(dashboardStats?.requestsByStatus ?? []).slice(0, 4).map((s) => (
                           <span
                              key={s.status}
                              className="text-[0.55rem] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: 'var(--surface-medium)', color: 'var(--text-secondary)' }}
                           >
                              {s.status} {s.count}
                           </span>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Chart area */}
               <div className="px-6 pt-2 pb-5" style={{ height: 260 }}>
                  <LineChart
                     data={dashboardAnalytics?.requestTrend}
                     label="Requests"
                     color="#B88C00"
                  />
               </div>
            </div>

            {/* ── Row 4: Requests table + Generator usage ── */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 mb-4">
               <div className="lg:col-span-7 p-0">
                  <div className={`animate-card-delay-3 ${PANEL} mb-4`}>
                     <div className="px-4 py-5 flex items-center justify-between">
                        <h1 className="text-sm font-semibold">Recent Requests</h1>
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
                  <div className={`animate-chart-delay-3 p-5 ${PANEL} mb-4`}>
                     <div className="mb-4">
                        <h2 className="text-sm font-semibold">Generator Usage</h2>
                        <p className="text-[0.65rem] text-gray-400 dark:text-white/45 mt-0.5">Weekly breakdown</p>
                     </div>
                     <div style={{ height: 180 }}>
                        <BarChart data={generatorBarData} />
                     </div>
                     {dashboardAnalytics?.generatorStats && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                           <div className="p-2.5 bg-gray-50 dark:bg-white/[0.03] rounded-lg text-center">
                              <span className="block text-[0.6rem] uppercase font-medium text-gray-400 dark:text-white/45 mb-0.5">Logs</span>
                              <span className="text-sm font-bold tabular-nums text-[#0F2552] dark:text-white/85">
                                 <AnimatedNumber value={dashboardAnalytics.generatorStats.totalLogs} delay={600} />
                              </span>
                           </div>
                           <div className="p-2.5 bg-[#B88C00]/5 dark:bg-[#B88C00]/10 rounded-lg text-center">
                              <span className="block text-[0.6rem] uppercase font-medium text-gray-400 dark:text-white/45 mb-0.5">Avg Hrs</span>
                              <span className="text-sm font-bold tabular-nums text-[#B88C00]">
                                 <AnimatedNumber value={Math.round(dashboardAnalytics.generatorStats.avgHours / 3600)} delay={700} suffix="h" />
                              </span>
                           </div>
                           <div className="p-2.5 bg-red-50 dark:bg-red-500/10 rounded-lg text-center">
                              <span className="block text-[0.6rem] uppercase font-medium text-gray-400 dark:text-white/45 mb-0.5">Faults</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
               <div className={`animate-chart-delay-1 p-6 ${PANEL}`}>
                  <div className="mb-5 flex items-center justify-between">
                     <div>
                        <h2 className="text-sm font-semibold">Maintenance Cost</h2>
                        <p className="text-[0.65rem] text-gray-400 dark:text-white/45 mt-0.5">Spend over time</p>
                     </div>
                     <span className="text-[0.65rem] font-medium px-2.5 py-1 rounded-full bg-[#0F2552]/10 dark:bg-[#0F2552]/30 text-[#0F2552] dark:text-blue-300">6 months</span>
                  </div>
                  <div style={{ height: 200 }}>
                     <LineChart data={maintenanceTrend} label="Cost (NGN)" color="#0F2552" />
                  </div>
               </div>
               <div className={`animate-chart-delay-2 p-5 ${PANEL} flex flex-col`}>
                  <div className="mb-3">
                     <h2 className="text-sm font-semibold">Complaint Status</h2>
                     <p className="text-[0.65rem] text-gray-400 dark:text-white/45 mt-0.5">Resolution breakdown</p>
                  </div>
                  <div className="flex-1 flex items-center">
                     <DoughnutChart data={complaintsChartData} />
                  </div>
               </div>
               <div className={`animate-chart-delay-3 p-5 ${PANEL} flex flex-col`}>
                  <div className="mb-3">
                     <h2 className="text-sm font-semibold">Item Condition</h2>
                     <p className="text-[0.65rem] text-gray-400 dark:text-white/45 mt-0.5">Inventory health</p>
                  </div>
                  <div className="flex-1 flex items-center">
                     <DoughnutChart data={dashboardStats?.itemsByCondition} centerLabel={String(dashboardStats?.totalItems ?? 0)} />
                  </div>
               </div>
            </div>

            {/* ── Row 6: Calendar + Upcoming schedules list + Recent maintenance ── */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 mb-4">
               <div className="lg:col-span-4">
                  <div className={`animate-card-delay-5 p-4 ${PANEL} min-h-[22rem]`}>
                     <div className="mb-4">
                        <h2 className="text-sm font-semibold">Maintenance Schedule</h2>
                     </div>
                     <Calendar events={calendarEvents} />
                  </div>
               </div>
               <div className="lg:col-span-3">
                  <div className={`animate-card-delay-5 p-4 ${PANEL} min-h-[22rem]`}>
                     <h2 className="text-sm font-semibold mb-4">Upcoming Schedules</h2>
                     <div className="space-y-3 max-h-[18rem] overflow-y-auto">
                        {(dashboardAnalytics?.upcomingSchedules ?? []).length > 0 ? (
                           dashboardAnalytics?.upcomingSchedules.map((s) => (
                              <div
                                 key={s.id}
                                 className="p-3 rounded bg-gray-50 dark:bg-white/5 border-l-[3px] border-[#B28309]"
                              >
                                 <p className="text-xs font-semibold truncate">{s.title}</p>
                                 <p className="text-[0.65rem] opacity-60 mt-0.5">
                                    {format(parseISO(s.scheduledDate), 'MMM d, yyyy')}
                                 </p>
                              </div>
                           ))
                        ) : (
                           <p className="text-xs text-center py-8 dark:text-white/50">No upcoming schedules</p>
                        )}
                     </div>
                  </div>
               </div>
               <div className="lg:col-span-3">
                  <div className={`animate-card-delay-6 p-4 ${PANEL} min-h-[22rem]`}>
                     <h2 className="text-sm font-semibold mb-4">Recent Maintenance</h2>
                     <div className="space-y-3 max-h-[18rem] overflow-y-auto">
                        {(dashboardAnalytics?.recentMaintenanceLogs ?? []).length > 0 ? (
                           dashboardAnalytics?.recentMaintenanceLogs.map((log) => (
                              <div key={log.id} className="p-3 rounded bg-gray-50 dark:bg-white/5">
                                 <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold truncate max-w-[60%]">
                                       {log.artisanName}
                                    </p>
                                    <span className="text-[0.65rem] font-medium text-[#B28309]">
                                       NGN {Number(log.costOfMaintenance).toLocaleString()}
                                    </span>
                                 </div>
                                 <p className="text-[0.65rem] opacity-60 mt-0.5 truncate">
                                    {log.description}
                                 </p>
                                 <p className="text-[0.6rem] mt-0.5 dark:text-white/45" style={{ color: 'var(--text-hint)' }}>
                                    {format(parseISO(log.maintenanceDate), 'MMM d, yyyy')}
                                 </p>
                              </div>
                           ))
                        ) : (
                           <p className="text-xs text-center py-8 dark:text-white/50">No maintenance logs</p>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* ── Row 7: Reports table + Due returns table ── */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
               <div className="lg:col-span-5 p-0">
                  <div className={`animate-card-delay-5 ${PANEL} mb-4`}>
                     <div className="px-4 py-5 flex items-center justify-between">
                        <h1 className="text-sm font-semibold">Reports</h1>
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
                  <div className={`animate-card-delay-6 ${PANEL} mb-4`}>
                     <div className="px-4 py-5 flex items-center justify-between">
                        <h1 className="text-sm font-semibold">Due Returns</h1>
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
