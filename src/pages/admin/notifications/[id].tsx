import type { NextPageWithLayout } from '@/types/next-page-with-layout';
import { useRouter } from 'next/router';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import PrivateRoute from '@/components/PrivateRoute';

import { notificationsAdminActions } from '@/actions/notificationsAdmin.actions';
import { RootState } from '@/redux/reducers';
import { Permission } from '@/constants/permissions.enum';
import { EmailStatus } from '@/types/notificationsAdmin.types';

/**
 * SA-only detail view for a single notification delivery record.
 *
 * Renders every field returned by `GET /api/v1/notification/admin/:id`
 * (same `NotificationDeliveryDto` shape as a list row) plus the same
 * action buttons exposed on the list page's action menu.
 *
 * Action visibility per spec §6.4:
 *  - SENT               → no actions (idempotency)
 *  - FAILED             → no actions (cron mid-flight)
 *  - PERMANENTLY_FAILED → Retry + Mark abandoned (+ View entity if linked)
 *  - ABANDONED          → no actions
 *
 * Cap: `notifications:admin`. Reached either from a clicked list row
 * or directly via /admin/notifications/<id>.
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

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
   label,
   children,
}) => (
   <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-[#0F2552]/55 dark:text-white/55">
         {label}
      </span>
      <span className="text-sm text-[#0F2552] dark:text-white break-words">
         {children}
      </span>
   </div>
);

const formatAbsolute = (iso: string | null | undefined) =>
   iso ? format(parseISO(iso), 'PPpp') : '—';

const formatRelative = (iso: string | null | undefined) =>
   iso ? formatDistanceToNow(parseISO(iso), { addSuffix: true }) : '—';

const NotificationAdminDetailPage: NextPageWithLayout = () => {
   const router = useRouter();
   const dispatch = useDispatch();
   const { selected, isLoadingSelected, selectedError, isMutating } = useSelector(
      (s: RootState) => s.notificationsAdmin,
   );

   const id = React.useMemo(() => {
      const raw = router.query.id;
      const candidate = Array.isArray(raw) ? raw[0] : raw;
      const n = Number(candidate);
      return Number.isFinite(n) ? n : null;
   }, [router.query.id]);

   useEffect(() => {
      if (id == null) return;
      dispatch(
         notificationsAdminActions.getNotificationAdmin(
            id,
         ) as unknown as UnknownAction,
      );
   }, [dispatch, id]);

   const refetch = () => {
      if (id == null) return;
      dispatch(
         notificationsAdminActions.getNotificationAdmin(
            id,
         ) as unknown as UnknownAction,
      );
   };

   const handleRetry = () => {
      if (id == null) return;
      dispatch(
         notificationsAdminActions.retryNotification(
            id,
         ) as unknown as UnknownAction,
      );
      // Refetch so the status chip flips to FAILED with attemptCount=0.
      setTimeout(refetch, 800);
   };

   const handleAbandon = () => {
      if (id == null) return;
      dispatch(
         notificationsAdminActions.abandonNotification(
            id,
         ) as unknown as UnknownAction,
      );
      setTimeout(refetch, 400);
   };

   const terminal = selected?.emailStatus === EmailStatus.PERMANENTLY_FAILED;
   const chip = selected ? STATUS_CHIP_STYLE[selected.emailStatus] : null;

   return (
      <>
         <div className="mb-4">
               <Link
                  href="/admin/notifications"
                  className="text-xs font-semibold uppercase tracking-wider text-[#0F2552]/65 dark:text-white/65 hover:text-[#0F2552] dark:hover:text-white transition-colors"
               >
                  ← Back to notifications
               </Link>
            </div>

            <PageHeader
               title={
                  selected
                     ? `Notification #${selected.id}`
                     : id != null
                       ? `Notification #${id}`
                       : 'Notification'
               }
               subtitle="Single delivery record. Same data as the list, with every field unfolded."
            />

            {selectedError && !isLoadingSelected && (
               <div className="mb-4 px-4 py-3 rounded-md bg-[color-mix(in_srgb,var(--chart-coral)_12%,transparent)] border border-[var(--chart-coral)] text-sm text-[#0F2552] dark:text-white flex items-center justify-between gap-3">
                  <span>Couldn&apos;t load notification: {selectedError}</span>
                  <button
                     type="button"
                     onClick={refetch}
                     className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-md bg-[var(--chart-coral)] text-white hover:opacity-90 transition-opacity cursor-pointer"
                  >
                     Retry
                  </button>
               </div>
            )}

            {isLoadingSelected && !selected && (
               <div className="text-sm italic text-[#0F2552]/45 dark:text-white/45 py-12 text-center">
                  Loading notification…
               </div>
            )}

            {selected && (
               <div
                  className="rounded-lg border p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5"
                  style={{ borderColor: 'var(--border-default)' }}
               >
                  {/* Status + Actions row — top so it's the first thing the eye lands on. */}
                  <div className="md:col-span-2 flex items-center justify-between gap-4 pb-5 border-b" style={{ borderColor: 'var(--border-default)' }}>
                     <div className="flex items-center gap-3">
                        {chip && (
                           <span
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                              style={{ background: chip.bg, color: chip.color }}
                           >
                              {chip.label}
                           </span>
                        )}
                        <span className="text-xs text-[#0F2552]/60 dark:text-white/60">
                           Attempt {selected.emailAttemptCount}
                        </span>
                     </div>
                     {terminal && (
                        <div className="flex gap-2">
                           <button
                              type="button"
                              onClick={handleRetry}
                              disabled={isMutating}
                              className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-md bg-[var(--color-secondary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                           >
                              Retry
                           </button>
                           <button
                              type="button"
                              onClick={handleAbandon}
                              disabled={isMutating}
                              className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-md border border-[var(--chart-coral)] text-[var(--chart-coral)] hover:bg-[color-mix(in_srgb,var(--chart-coral)_8%,transparent)] transition-colors disabled:opacity-50 cursor-pointer"
                           >
                              Mark abandoned
                           </button>
                        </div>
                     )}
                  </div>

                  <Field label="Recipient">
                     <div className="flex flex-col">
                        <span className="font-medium">
                           {selected.recipient.name ?? selected.recipient.email}
                        </span>
                        <span className="text-xs text-[#0F2552]/60 dark:text-white/60">
                           {selected.recipient.email}
                           {selected.recipient.type === 'guest' && ' · guest'}
                           {selected.recipient.userId != null &&
                              ` · user #${selected.recipient.userId}`}
                        </span>
                     </div>
                  </Field>

                  <Field label="Event type">
                     <span className="font-mono text-xs">{selected.eventType}</span>
                  </Field>

                  <Field label="Entity">
                     {selected.entity?.type ? (
                        <Link
                           href={`/admin/${selected.entity.type}/${selected.entity.id}`}
                           className="underline decoration-dotted hover:decoration-solid"
                        >
                           {selected.entity.type} #{selected.entity.id}
                        </Link>
                     ) : (
                        '—'
                     )}
                  </Field>

                  <Field label="Admin link">
                     {selected.link ? (
                        <a
                           href={selected.link}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="underline decoration-dotted hover:decoration-solid break-all"
                        >
                           {selected.link}
                        </a>
                     ) : (
                        '—'
                     )}
                  </Field>

                  <Field label="Created at">
                     <div className="flex flex-col">
                        <span>{formatAbsolute(selected.createdAt)}</span>
                        <span className="text-xs text-[#0F2552]/60 dark:text-white/60">
                           {formatRelative(selected.createdAt)}
                        </span>
                     </div>
                  </Field>

                  <Field label="Last attempt">
                     <div className="flex flex-col">
                        <span>{formatAbsolute(selected.emailLastAttemptAt)}</span>
                        {selected.emailLastAttemptAt && (
                           <span className="text-xs text-[#0F2552]/60 dark:text-white/60">
                              {formatRelative(selected.emailLastAttemptAt)}
                           </span>
                        )}
                     </div>
                  </Field>

                  <Field label="Next attempt">
                     <div className="flex flex-col">
                        <span>{formatAbsolute(selected.emailNextAttemptAt)}</span>
                        {selected.emailNextAttemptAt && (
                           <span className="text-xs text-[#0F2552]/60 dark:text-white/60">
                              {formatRelative(selected.emailNextAttemptAt)}
                           </span>
                        )}
                     </div>
                  </Field>

                  <Field label="Attempts">
                     <span className="tabular-nums">{selected.emailAttemptCount}</span>
                  </Field>

                  <div className="md:col-span-2">
                     <Field label="Last error">
                        {selected.emailLastError ? (
                           <pre className="text-xs font-mono whitespace-pre-wrap p-3 rounded-md bg-[color-mix(in_srgb,var(--chart-coral)_8%,transparent)] border border-[var(--chart-coral)] text-[var(--chart-coral)]">
                              {selected.emailLastError}
                           </pre>
                        ) : (
                           <span className="text-[#0F2552]/40 dark:text-white/40">—</span>
                        )}
                     </Field>
               </div>
            </div>
         )}
      </>
   );
};

NotificationAdminDetailPage.getLayout = (page) => (
   <PrivateRoute permissions={[Permission.NOTIFICATIONS_ADMIN]}>
      <Layout title="Notification detail">{page}</Layout>
   </PrivateRoute>
);

export default NotificationAdminDetailPage;
