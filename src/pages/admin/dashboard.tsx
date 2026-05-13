import { dashboardActions, requestActions } from '@/actions';
import Layout from '@/components/Layout';
import { RootState } from '@/redux/reducers';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import PrivateRoute from '@/components/PrivateRoute';
import { usePermission } from '@/hooks/usePermission';
import { Permission } from '@/constants/permissions.enum';

import Card from '@/components/Cards/Card';
import SectionLabel from '@/components/Cards/SectionLabel';
import PageHeader from '@/components/PageHeader';
import TotalRequestsCard from '@/components/dashboard/TotalRequestsCard';
import UpcomingScheduleCard from '@/components/dashboard/UpcomingScheduleCard';
import TotalItemsCard from '@/components/dashboard/TotalItemsCard';
import RecentActivityCard from '@/components/dashboard/RecentActivityCard';
import RequestTrendsCard from '@/components/dashboard/RequestTrendsCard';
import DailyReportAction from '@/components/dashboard/DailyReportAction';

const CARD_STYLE: React.CSSProperties = {
   background: 'var(--surface-low, rgba(255,255,255,0.02))',
   border: '1px solid var(--border-default)',
};

const fmtNumber = (n: number | string | undefined) =>
   (Number(n ?? 0) || 0).toLocaleString('en-US');

/* ── Skeleton shapes (page-local utilities) ── */
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
   </>
);

/* ── Role-aware "Action Items" hero ──────────────────────────────────────────
 * The most useful prompt on landing is "what needs me right now". The
 * RequestsByStatus / ComplaintsByStatus arrays are already role-scoped on
 * fetch (HOD by department, MEMBER by assignee, back-office sees all), so
 * the count of a specific status row is also the count of that status the
 * user is responsible for. Pick the status that's the user's next action
 * by role and surface it as a tappable counter that deep-links into the
 * filtered list.
 */
type ActionItem = {
   label: string;
   count: number;
   href: string;
   accent: string;
};

const Dashboard = () => {
   const dispatch = useDispatch();
   const { userDetails } = useSelector((s: RootState) => s.user);
   const { dashboardStats, dashboardAnalytics, IsFetchingDashboardStats } = useSelector(
      (s: RootState) => s.dashboard,
   );
   // Capability gates: `requests:approve` is the HOD-shape (you can
   // approve, so you see "awaiting your approval"); back-office is
   // expressed as the union `requests:manage`. Member-shape is "you
   // hold release/return but not approve" — i.e. the assignee track.
   const { can } = usePermission();
   const isBackOffice = can(Permission.REQUESTS_MANAGE);
   const canApproveRequests = can(Permission.REQUESTS_APPROVE);
   const canReleaseRequests = can(Permission.REQUESTS_RELEASE);

   const isLoading = IsFetchingDashboardStats && !dashboardStats;

   useEffect(() => {
      dispatch(dashboardActions.getDashboardStats() as unknown as UnknownAction);
      dispatch(
         dashboardActions.getDashboardAnalytics('month') as unknown as UnknownAction,
      );

      // Capability-driven fetch shape:
      // - back-office (requests:manage)         -> all requests
      // - dept lead   (requests:approve no man) -> their dept's
      // - assignee    (requests:release only)   -> assigned-to-me
      // The OR-of-hats case (SA + HOD) lands on `getAllRequests` thanks
      // to `requests:manage` winning — same data, broader view.
      if (isBackOffice) {
         dispatch(requestActions.getAllRequests() as unknown as UnknownAction);
      } else if (canApproveRequests) {
         dispatch(
            requestActions.getDepartmentRequests({
               departmentId: userDetails?.departmentId ?? 0,
            }) as unknown as UnknownAction,
         );
      } else if (canReleaseRequests) {
         dispatch(
            requestActions.getAssignedRequests({
               userId: userDetails?.id ?? 0,
            }) as unknown as UnknownAction,
         );
      } else {
         dispatch(requestActions.getAllRequests() as unknown as UnknownAction);
      }
   }, [
      dispatch,
      isBackOffice,
      canApproveRequests,
      canReleaseRequests,
      userDetails?.departmentId,
      userDetails?.id,
   ]);

   /* ── Approved / Declined % pills ── */
   const requestRatePills = useMemo(() => {
      const list = dashboardStats?.requestsByStatus ?? [];
      const total = list.reduce((sum, s) => sum + (s.count || 0), 0) || 1;
      const find = (label: string) =>
         list.find((s) => s.status.toLowerCase() === label)?.count ?? 0;
      return {
         approved: (find('approved') / total) * 100,
         declined: (find('declined') / total) * 100,
      };
   }, [dashboardStats]);

   /* ── Sparkline series adapter: `{date,count}` -> `{date,value}` ── */
   const requestsSparkline = useMemo(
      () =>
         (dashboardAnalytics?.requestsSparkline ?? []).map((p) => ({
            date: p.date,
            value: p.count,
         })),
      [dashboardAnalytics?.requestsSparkline],
   );

   /* ── Trend series for RequestTrendsCard (keeps the {date,count} shape) ── */
   const requestTrendSeries = useMemo(
      () => dashboardAnalytics?.requestsSparkline ?? [],
      [dashboardAnalytics?.requestsSparkline],
   );

   /* ── Upcoming Schedule entries → ScheduleEntry shape ── */
   const upcomingScheduleEntries = useMemo(
      () =>
         (dashboardAnalytics?.upcomingSchedules ?? []).map((s) => {
            const hour = (() => {
               try {
                  return parseISO(s.scheduledDate).getHours();
               } catch {
                  return 0;
               }
            })();
            return {
               id: s.id,
               hour,
               title: s.title,
               subtitle: s.description,
            };
         }),
      [dashboardAnalytics?.upcomingSchedules],
   );

   /* ── Recent maintenance logs → ActivityEntry shape (top 5) ── */
   const recentActivityEntries = useMemo(
      () =>
         (dashboardAnalytics?.recentMaintenanceLogs ?? []).slice(0, 5).map((m) => ({
            id: m.id,
            title: m.artisanName,
            description: m.description,
            amount: `NGN ${Number(m.costOfMaintenance ?? 0).toLocaleString('en-US')}`,
            date: (() => {
               try {
                  return format(parseISO(m.maintenanceDate), 'dd MMM');
               } catch {
                  return '';
               }
            })(),
         })),
      [dashboardAnalytics?.recentMaintenanceLogs],
   );

   /* ── Role-aware action items (tappable queue counters) ───────────────────
    * Pick the status row(s) that are the actor's responsibility:
    *   SUPER_ADMIN / ADMIN: APPROVED requests need an assignee, NEW
    *     complaints need triage, dueReturns are red-flag overdue.
    *   HOD: PENDING requests are awaiting their approval.
    *   MEMBER: ASSIGNED requests need to be released; COLLECTED ones
    *     need to be returned.
    */
   const actionItems = useMemo<ActionItem[]>(() => {
      const reqByStatus = (status: string): number =>
         (dashboardStats?.requestsByStatus ?? []).find(
            (s) => s.status?.toUpperCase() === status,
         )?.count ?? 0;
      const complaintByStatus = (status: string): number =>
         (dashboardAnalytics?.complaintsByStatus ?? []).find(
            (s) => s.status?.toUpperCase() === status,
         )?.count ?? 0;

      const items: ActionItem[] = [];

      // Capability-driven action items. Multi-role users get the
      // strongest hat: back-office (manage) > approve > release. Each
      // branch is independent so SA+HOD users see the back-office
      // shape (more useful at a glance).
      if (isBackOffice) {
         items.push({
            label: 'Requests pending assignment',
            count: reqByStatus('APPROVED'),
            href: '/admin/requests',
            accent: '#6B8FCC',
         });
         items.push({
            label: 'New complaints to triage',
            count: complaintByStatus('NEW'),
            href: '/admin/reports',
            accent: '#F59E0B',
         });
         const overdue = dashboardStats?.dueReturns ?? 0;
         if (overdue > 0) {
            items.push({
               label: 'Overdue returns',
               count: overdue,
               href: '/admin/requests',
               accent: '#EF4444',
            });
         }
      } else if (canApproveRequests) {
         items.push({
            label: 'Requests awaiting your approval',
            count: reqByStatus('PENDING'),
            href: '/admin/requests',
            accent: '#6B8FCC',
         });
         const overdue = dashboardStats?.dueReturns ?? 0;
         if (overdue > 0) {
            items.push({
               label: "Department's overdue returns",
               count: overdue,
               href: '/admin/requests',
               accent: '#EF4444',
            });
         }
      } else if (canReleaseRequests) {
         items.push({
            label: 'Assigned to you — release pending',
            count: reqByStatus('ASSIGNED'),
            href: '/admin/requests',
            accent: '#6B8FCC',
         });
         items.push({
            label: 'Collected — awaiting return',
            count: reqByStatus('COLLECTED'),
            href: '/admin/requests',
            accent: '#F59E0B',
         });
         items.push({
            label: 'Complaints assigned to you',
            count: complaintByStatus('ASSIGNED'),
            href: '/admin/reports',
            accent: '#10B981',
         });
      }

      return items;
   }, [
      dashboardStats?.requestsByStatus,
      dashboardStats?.dueReturns,
      dashboardAnalytics?.complaintsByStatus,
      isBackOffice,
      canApproveRequests,
      canReleaseRequests,
   ]);

   const totalActionCount = actionItems.reduce((s, i) => s + i.count, 0);

   const totalRequests = Number(dashboardStats?.totalRequests ?? 0) || 0;
   const totalItems = Number(dashboardStats?.totalItems ?? 0) || 0;

   return (
      <PrivateRoute permissions={[Permission.DASHBOARD_READ]}>
         <Layout title="Dashboard">
            <PageHeader
               title="Dashboard"
               subtitle="At-a-glance view of requests, items and activity across your facilities"
               action={<DailyReportAction />}
            />

            {isLoading && <DashboardSkeleton />}

            {!isLoading && (
               <>
                  {/* Action Items — role-aware queue counts (deep-linked) */}
                  {actionItems.length > 0 && (
                     <Card
                        className="mb-4 md:mb-5"
                        style={{ background: 'var(--surface-low, rgba(255,255,255,0.02))' }}
                     >
                        <div className="flex items-center justify-between">
                           <SectionLabel>Action Items</SectionLabel>
                           <span
                              className="text-[0.6rem] font-semibold tabular-nums"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              {totalActionCount > 0
                                 ? `${fmtNumber(totalActionCount)} pending`
                                 : 'all clear'}
                           </span>
                        </div>
                        <h3
                           className="mt-4 font-semibold text-base"
                           style={{ color: 'var(--text-primary)' }}
                        >
                           What needs you right now
                        </h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-hint)' }}>
                           Tap a row to jump to the filtered list.
                        </p>
                        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                           {actionItems.map((item) => (
                              <li key={item.label}>
                                 <Link
                                    href={item.href}
                                    className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors hover:opacity-90"
                                    style={{
                                       background: 'var(--surface-medium)',
                                       border: '1px solid var(--border-default)',
                                    }}
                                 >
                                    <span className="flex items-center gap-2 min-w-0">
                                       <span
                                          className="w-1.5 h-1.5 rounded-full shrink-0"
                                          style={{ background: item.accent }}
                                       />
                                       <span
                                          className="text-xs truncate"
                                          style={{ color: 'var(--text-secondary)' }}
                                       >
                                          {item.label}
                                       </span>
                                    </span>
                                    <span
                                       className="text-lg font-bold tabular-nums shrink-0"
                                       style={{
                                          color:
                                             item.count > 0 ? item.accent : 'var(--text-hint)',
                                       }}
                                    >
                                       {fmtNumber(item.count)}
                                    </span>
                                 </Link>
                              </li>
                           ))}
                        </ul>
                     </Card>
                  )}

                  {/* 2-column grid: 5 cards laid out per the 2026-05-13 mockup */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
                     <div className="flex flex-col gap-4 md:gap-5">
                        <TotalRequestsCard
                           total={totalRequests}
                           approved={{
                              label: 'Approved Rate',
                              percent: requestRatePills.approved,
                              trend: 'up',
                              sparklineData: requestsSparkline,
                              color: 'mint',
                           }}
                           declined={{
                              label: 'Declined Rate',
                              percent: requestRatePills.declined,
                              trend: 'down',
                              sparklineData: requestsSparkline,
                              color: 'coral',
                           }}
                        />
                        <TotalItemsCard count={totalItems} />
                        <RecentActivityCard entries={recentActivityEntries} />
                     </div>
                     <div className="flex flex-col gap-4 md:gap-5">
                        <UpcomingScheduleCard entries={upcomingScheduleEntries} />
                        <RequestTrendsCard data={requestTrendSeries} />
                     </div>
                  </div>
               </>
            )}
         </Layout>
      </PrivateRoute>
   );
};

export default Dashboard;
