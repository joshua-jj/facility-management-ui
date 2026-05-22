import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { formatDistanceToNow, parseISO } from 'date-fns';

import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import PrivateRoute from '@/components/PrivateRoute';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';

import { notificationsAdminActions } from '@/actions/notificationsAdmin.actions';
import { RootState } from '@/redux/reducers';
import { Permission } from '@/constants/permissions.enum';
import {
   EmailStatus,
   NotificationDelivery,
   NotificationDeliveriesQuery,
} from '@/types/notificationsAdmin.types';

/**
 * SA-only notification delivery admin page.
 *
 * Rendered with the shared DataTable so the page inherits the same
 * pagination / search / refresh chrome as every other admin table
 * (requests, users, etc.). Action visibility per spec §6.4:
 *  - SENT               → no actions
 *  - FAILED             → no actions (cron is mid-flight; admin shouldn't
 *                         second-guess auto-retry)
 *  - PERMANENTLY_FAILED → Retry + Mark Abandoned
 *  - ABANDONED          → no actions
 *
 * Default filter is `[FAILED, PERMANENTLY_FAILED]` so ops sees what
 * needs attention without scrolling through the wall of successful
 * sends. Default page size is 10 to match the rest of the admin tables.
 * Capability gate is `notifications:admin`.
 */

const STATUS_CHIP_STYLE: Record<EmailStatus, { bg: string; color: string; label: string }> = {
   [EmailStatus.SENT]: {
      bg: 'color-mix(in srgb, var(--chart-mint) 16%, transparent)',
      color: 'var(--chart-mint)',
      label: 'Sent',
   },
   [EmailStatus.FAILED]: {
      bg: 'color-mix(in srgb, var(--badge-warning) 16%, transparent)',
      color: 'var(--badge-warning)',
      label: 'Failed',
   },
   [EmailStatus.PERMANENTLY_FAILED]: {
      bg: 'color-mix(in srgb, var(--chart-coral) 18%, transparent)',
      color: 'var(--chart-coral)',
      label: 'Permanently failed',
   },
   [EmailStatus.ABANDONED]: {
      bg: 'color-mix(in srgb, var(--bg-elevated) 80%, transparent)',
      color: 'var(--text-muted)',
      label: 'Abandoned',
   },
};

const STATUS_FILTER_DEF: FilterDef = {
   key: 'status',
   label: 'Status',
   // The blank '' option means "any status" — DataTable's onFilterChange
   // for an empty value lets us drop the filter from the query.
   options: [
      { value: '', label: 'Any status' },
      { value: EmailStatus.FAILED, label: 'Failed' },
      { value: EmailStatus.PERMANENTLY_FAILED, label: 'Permanently failed' },
      { value: EmailStatus.SENT, label: 'Sent' },
      { value: EmailStatus.ABANDONED, label: 'Abandoned' },
   ],
};

const DEFAULT_LIMIT = 10;

const NotificationsAdminPage: NextPage = () => {
   const router = useRouter();
   const dispatch = useDispatch();
   const { page, isLoading, isMutating, error } = useSelector(
      (s: RootState) => s.notificationsAdmin,
   );

   const [query, setQuery] = useState<NotificationDeliveriesQuery>({
      page: 1,
      limit: DEFAULT_LIMIT,
      status: [EmailStatus.FAILED, EmailStatus.PERMANENTLY_FAILED],
   });

   useEffect(() => {
      dispatch(
         notificationsAdminActions.getNotificationsAdmin(
            query,
         ) as unknown as UnknownAction,
      );
   }, [dispatch, query]);

   const refetch = () =>
      dispatch(
         notificationsAdminActions.getNotificationsAdmin(
            query,
         ) as unknown as UnknownAction,
      );

   const handleRetry = (id: number) => {
      dispatch(
         notificationsAdminActions.retryNotification(
            id,
         ) as unknown as UnknownAction,
      );
      // Refetch shortly after so the row's reset state appears in the
      // table without the operator having to refresh the page.
      setTimeout(refetch, 800);
   };

   const handleAbandon = (id: number) => {
      dispatch(
         notificationsAdminActions.abandonNotification(
            id,
         ) as unknown as UnknownAction,
      );
      setTimeout(refetch, 400);
   };

   const getActions = (row: NotificationDelivery): ActionMenuItem[] => {
      // Only PERMANENTLY_FAILED rows expose actions per spec §6.4.
      const terminal = row.emailStatus === EmailStatus.PERMANENTLY_FAILED;
      return [
         {
            label: 'Retry',
            onClick: () => handleRetry(row.id),
            hidden: !terminal || isMutating,
         },
         {
            label: 'Mark abandoned',
            variant: 'danger',
            onClick: () => handleAbandon(row.id),
            hidden: !terminal || isMutating,
         },
         {
            label: 'View entity',
            onClick: () => {
               if (row.entity?.type && row.entity?.id) {
                  // entity.type is a snake/lower-case slug; admin links
                  // follow /admin/<slug>/<id>.
                  window.location.href = `/admin/${row.entity.type}/${row.entity.id}`;
               }
            },
            hidden: !row.entity?.id,
         },
      ];
   };

   const columns: Column<NotificationDelivery>[] = useMemo(
      () => [
         {
            key: 'recipient',
            header: 'Recipient',
            render: (_value, row) => (
               <div className="flex flex-col">
                  <span className="font-medium text-[#0F2552] dark:text-white">
                     {row.recipient.name ?? row.recipient.email}
                  </span>
                  <span className="text-xs text-[#0F2552]/60 dark:text-white/60">
                     {row.recipient.email}
                     {row.recipient.type === 'guest' && ' · guest'}
                  </span>
               </div>
            ),
         },
         {
            key: 'entity',
            header: 'Entity',
            render: (_value, row) => (
               <span className="text-sm text-[#0F2552] dark:text-white">
                  {row.entity?.type ?? '—'}
                  {row.entity?.id ? ` #${row.entity.id}` : ''}
               </span>
            ),
         },
         {
            key: 'eventType',
            header: 'Event',
            render: (_value, row) => (
               <span className="text-xs font-mono text-[#0F2552]/80 dark:text-white/80">
                  {row.eventType}
               </span>
            ),
         },
         {
            key: 'emailStatus',
            header: 'Status',
            render: (_value, row) => {
               const chip = STATUS_CHIP_STYLE[row.emailStatus];
               return (
                  <span
                     className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                     style={{ background: chip.bg, color: chip.color }}
                  >
                     {chip.label}
                  </span>
               );
            },
         },
         {
            key: 'emailAttemptCount',
            header: 'Attempts',
            align: 'center',
            render: (_value, row) => (
               <span className="text-sm tabular-nums text-[#0F2552] dark:text-white">
                  {row.emailAttemptCount}
               </span>
            ),
         },
         {
            key: 'emailLastAttemptAt',
            header: 'Last attempt',
            render: (_value, row) =>
               row.emailLastAttemptAt ? (
                  <span
                     className="text-xs text-[#0F2552]/70 dark:text-white/70"
                     title={row.emailLastAttemptAt}
                  >
                     {formatDistanceToNow(parseISO(row.emailLastAttemptAt), {
                        addSuffix: true,
                     })}
                  </span>
               ) : (
                  <span className="text-xs italic text-[#0F2552]/40 dark:text-white/40">
                     never
                  </span>
               ),
         },
         {
            key: 'emailLastError',
            header: 'Last error',
            render: (_value, row) =>
               row.emailLastError ? (
                  <span
                     className="text-xs text-[var(--chart-coral)] line-clamp-2"
                     title={row.emailLastError}
                  >
                     {row.emailLastError}
                  </span>
               ) : (
                  <span className="text-xs text-[#0F2552]/30 dark:text-white/30">
                     —
                  </span>
               ),
         },
         {
            key: 'actions',
            header: 'Actions',
            align: 'center',
            width: '80px',
            render: (_value, row) => <ActionMenu items={getActions(row)} />,
         },
      ],
      // getActions closes over isMutating + the dispatched handlers; the
      // handlers' identity is stable across renders (defined in this
      // component closure) so isMutating is the only thing that
      // meaningfully changes the action menu's visibility.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [isMutating],
   );

   const filterValues: Record<string, string> = {
      status:
         query.status && query.status.length === 1 ? query.status[0] : '',
   };

   const handleFilterChange = (key: string, value: string) => {
      if (key !== 'status') return;
      setQuery((q) => ({
         ...q,
         page: 1,
         status: value
            ? [value as EmailStatus]
            : // Empty → restore the default "needs attention" filter so the
              // table doesn't suddenly flood with every Sent row.
              [EmailStatus.FAILED, EmailStatus.PERMANENTLY_FAILED],
      }));
   };

   const meta = page?.meta;
   const paginationMeta = meta
      ? {
           currentPage: meta.currentPage,
           totalItems: meta.totalItems,
           itemsPerPage: meta.itemsPerPage,
           totalPages: meta.totalPages,
        }
      : undefined;

   return (
      <PrivateRoute permissions={[Permission.NOTIFICATIONS_ADMIN]}>
         <Layout title="Notifications">
            <PageHeader
               title="Notifications"
               subtitle="Email delivery records and retry status across all notifications fired by the system."
            />

            {error && !isLoading && (
               <div className="mb-4 px-4 py-3 rounded-md bg-[color-mix(in_srgb,var(--chart-coral)_12%,transparent)] border border-[var(--chart-coral)] text-sm text-[#0F2552] dark:text-white flex items-center justify-between gap-3">
                  <span>Couldn&apos;t load notifications: {error}</span>
                  <button
                     type="button"
                     onClick={refetch}
                     className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-md bg-[var(--chart-coral)] text-white hover:opacity-90 transition-opacity cursor-pointer"
                  >
                     Retry
                  </button>
               </div>
            )}

            <DataTable<NotificationDelivery>
               columns={columns}
               data={page?.data ?? []}
               loading={isLoading}
               pagination={paginationMeta}
               onPageChange={(next) => setQuery((q) => ({ ...q, page: next }))}
               filters={[STATUS_FILTER_DEF]}
               filterValues={filterValues}
               onFilterChange={handleFilterChange}
               onRefresh={refetch}
               searchPlaceholder="Search recipient email…"
               onSearch={(q) => setQuery((qry) => ({ ...qry, page: 1, search: q }))}
               onRowClick={(row) => router.push(`/admin/notifications/${row.id}`)}
               emptyTitle="No notifications"
               emptyDescription="No delivery records match the current filters."
               getRowId={(row) => row.id}
            />
         </Layout>
      </PrivateRoute>
   );
};

export default NotificationsAdminPage;
