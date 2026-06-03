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
import { EmailStatus, EmailItem } from '@/types/notificationsAdmin.types';

/**
 * SA-only detail view for a single notification delivery record.
 *
 * Card-based layout with four sections:
 *  1. Status & Actions — status chip, attempt counter, expanded action bar
 *  2. Delivery Details — recipient, event context, timestamps
 *  3. Email Content Preview — subject, body, items table
 *  4. Error Details — last error in a code block (only when present)
 *
 * Action visibility (expanded from v1):
 *  - SENT               → no mutating actions
 *  - FAILED             → Retry (override cron backoff)
 *  - PERMANENTLY_FAILED → Retry, Mark Abandoned, Delete
 *  - ABANDONED          → Retry (un-abandon), Delete
 */

// ── Status chip styling ──────────────────────────────────────────────

const STATUS_CHIP_STYLE: Record<EmailStatus, { bg: string; color: string; label: string; icon: string }> = {
   [EmailStatus.SENT]: {
      bg: 'color-mix(in srgb, var(--chart-mint) 16%, transparent)',
      color: 'var(--chart-mint)',
      label: 'Sent',
      icon: '✓',
   },
   [EmailStatus.FAILED]: {
      bg: 'color-mix(in srgb, var(--badge-warning) 16%, transparent)',
      color: 'var(--badge-warning)',
      label: 'Failed — retrying',
      icon: '⟳',
   },
   [EmailStatus.PERMANENTLY_FAILED]: {
      bg: 'color-mix(in srgb, var(--chart-coral) 18%, transparent)',
      color: 'var(--chart-coral)',
      label: 'Permanently failed',
      icon: '✕',
   },
   [EmailStatus.ABANDONED]: {
      bg: 'color-mix(in srgb, var(--bg-elevated) 80%, transparent)',
      color: 'var(--text-muted)',
      label: 'Abandoned',
      icon: '—',
   },
};

// ── Helpers ──────────────────────────────────────────────────────────

const Field: React.FC<{ label: string; children: React.ReactNode; fullWidth?: boolean }> = ({
   label,
   children,
   fullWidth,
}) => (
   <div className={`flex flex-col gap-1 ${fullWidth ? 'md:col-span-2' : ''}`}>
      <span className="text-[11px] uppercase tracking-wider font-semibold text-[#0F2552]/55 dark:text-white/55">
         {label}
      </span>
      <span className="text-sm text-[#0F2552] dark:text-white break-words">
         {children}
      </span>
   </div>
);

const SectionCard: React.FC<{
   title: string;
   subtitle?: string;
   children: React.ReactNode;
   className?: string;
}> = ({ title, subtitle, children, className = '' }) => (
   <div
      className={`rounded-lg border p-6 ${className}`}
      style={{ borderColor: 'var(--border-default)' }}
   >
      <div className="mb-4">
         <h3 className="text-sm font-semibold text-[#0F2552] dark:text-white">{title}</h3>
         {subtitle && (
            <p className="text-xs text-[#0F2552]/50 dark:text-white/50 mt-0.5">{subtitle}</p>
         )}
      </div>
      {children}
   </div>
);

const formatAbsolute = (iso: string | null | undefined) =>
   iso ? format(parseISO(iso), 'PPpp') : '—';

const formatRelative = (iso: string | null | undefined) =>
   iso ? formatDistanceToNow(parseISO(iso), { addSuffix: true }) : '—';

/**
 * Convert API event-type tokens (e.g. `MAINTENANCE_LOG_CREATED`) into
 * a human label (`Maintenance log created`).
 */
const formatEventType = (eventType: string): string => {
   if (!eventType) return '—';
   const lower = eventType.toLowerCase().replace(/_/g, ' ');
   return lower.charAt(0).toUpperCase() + lower.slice(1);
};

// ── Email items table ────────────────────────────────────────────────

const EmailItemsTable: React.FC<{ items: EmailItem[] }> = ({ items }) => {
   // Group by department if any item has one
   const hasDepartments = items.some((item) => item.department);

   if (hasDepartments) {
      const groups: Record<string, EmailItem[]> = {};
      for (const item of items) {
         const dept = item.department ?? 'Other';
         if (!groups[dept]) groups[dept] = [];
         groups[dept].push(item);
      }
      return (
         <div className="space-y-3">
            {Object.entries(groups).map(([dept, groupItems]) => (
               <div key={dept}>
                  <div className="text-xs font-semibold text-[#0F2552]/70 dark:text-white/70 mb-1">
                     {dept}
                  </div>
                  <table className="w-full text-xs">
                     <tbody>
                        {groupItems.map((item, idx) => (
                           <tr key={idx} className="border-b border-[var(--border-default)] last:border-0">
                              <td className="py-1.5 text-[#0F2552] dark:text-white">{item.name}</td>
                              <td className="py-1.5 text-right tabular-nums text-[#0F2552]/60 dark:text-white/60">
                                 {item.quantity != null ? `×${item.quantity}` : ''}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            ))}
         </div>
      );
   }

   return (
      <table className="w-full text-xs">
         <thead>
            <tr className="border-b border-[var(--border-default)] text-[0.6rem] uppercase tracking-widest text-[#0F2552]/50 dark:text-white/40">
               <th className="py-1.5 text-left font-semibold">Item</th>
               <th className="py-1.5 text-right font-semibold">Qty</th>
            </tr>
         </thead>
         <tbody>
            {items.map((item, idx) => (
               <tr key={idx} className="border-b border-[var(--border-default)] last:border-0">
                  <td className="py-1.5 text-[#0F2552] dark:text-white">{item.name}</td>
                  <td className="py-1.5 text-right tabular-nums text-[#0F2552]/60 dark:text-white/60">
                     {item.quantity != null ? `×${item.quantity}` : ''}
                  </td>
               </tr>
            ))}
         </tbody>
      </table>
   );
};

// ── Main page component ──────────────────────────────────────────────

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
      if (id == null || !selected) return;
      if (typeof window !== 'undefined') {
         const ok = window.confirm(
            `Retry sending to ${selected.recipient.email}? The notification will re-enter the auto-retry queue with a fresh attempt count.`,
         );
         if (!ok) return;
      }
      dispatch(
         notificationsAdminActions.retryNotification(
            id,
         ) as unknown as UnknownAction,
      );
      // Saga auto-refetches via GET_NOTIFICATION_ADMIN dispatch.
   };

   const handleAbandon = () => {
      if (id == null) return;
      if (typeof window !== 'undefined') {
         const ok = window.confirm(
            'Mark this notification as abandoned? Future automatic retries will not happen and this row will be terminal in the audit log.',
         );
         if (!ok) return;
      }
      dispatch(
         notificationsAdminActions.abandonNotification(
            id,
         ) as unknown as UnknownAction,
      );
      // Saga auto-refetches via GET_NOTIFICATION_ADMIN dispatch.
   };

   const handleDelete = () => {
      if (id == null) return;
      if (typeof window !== 'undefined') {
         const ok = window.confirm(
            'Delete this notification from the queue? The row is soft-deleted; it will survive in the audit log but no longer appear here.',
         );
         if (!ok) return;
      }
      dispatch(
         notificationsAdminActions.deleteNotification(
            id,
         ) as unknown as UnknownAction,
      );
      // Navigate back to list after delete
      setTimeout(() => router.push('/admin/notifications'), 600);
   };

   // Action visibility rules
   const canRetry =
      selected?.emailStatus === EmailStatus.FAILED ||
      selected?.emailStatus === EmailStatus.PERMANENTLY_FAILED ||
      selected?.emailStatus === EmailStatus.ABANDONED;
   const canAbandon =
      selected?.emailStatus === EmailStatus.PERMANENTLY_FAILED;
   const canDelete =
      selected?.emailStatus === EmailStatus.PERMANENTLY_FAILED ||
      selected?.emailStatus === EmailStatus.ABANDONED;
   const hasActions = canRetry || canAbandon || canDelete;

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
            subtitle={
               selected?.title
                  ? selected.title
                  : 'Single delivery record — full detail view.'
            }
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
            <div className="space-y-5">

               {/* ─── Section 1: Status & Actions ──────────────────────── */}
               <SectionCard title="Delivery Status">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        {chip && (
                           <span
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                              style={{ background: chip.bg, color: chip.color }}
                           >
                              <span className="text-[10px]">{chip.icon}</span>
                              {chip.label}
                           </span>
                        )}
                        <span className="text-xs text-[#0F2552]/60 dark:text-white/60 tabular-nums">
                           {selected.emailAttemptCount} attempt{selected.emailAttemptCount !== 1 ? 's' : ''}
                        </span>
                     </div>

                     {hasActions && (
                        <div className="flex flex-wrap gap-2">
                           {canRetry && (
                              <button
                                 type="button"
                                 onClick={handleRetry}
                                 disabled={isMutating}
                                 className="text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-md bg-[var(--color-secondary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                              >
                                 {selected.emailStatus === EmailStatus.ABANDONED
                                    ? '⟳ Retry (un-abandon)'
                                    : selected.emailStatus === EmailStatus.FAILED
                                      ? '⟳ Retry (override backoff)'
                                      : '⟳ Retry'}
                              </button>
                           )}
                           {canAbandon && (
                              <button
                                 type="button"
                                 onClick={handleAbandon}
                                 disabled={isMutating}
                                 className="text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-md border border-[var(--chart-coral)] text-[var(--chart-coral)] hover:bg-[color-mix(in_srgb,var(--chart-coral)_8%,transparent)] transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                 Mark abandoned
                              </button>
                           )}
                           {canDelete && (
                              <button
                                 type="button"
                                 onClick={handleDelete}
                                 disabled={isMutating}
                                 className="text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-md border border-[var(--border-default)] text-[#0F2552]/65 dark:text-white/55 hover:border-[var(--chart-coral)] hover:text-[var(--chart-coral)] transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                 Delete
                              </button>
                           )}
                        </div>
                     )}
                  </div>

                  {/* Timeline-style attempt details */}
                  <div className="mt-5 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ borderColor: 'var(--border-default)' }}>
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#0F2552]/45 dark:text-white/45">Created</span>
                        <span className="text-xs text-[#0F2552] dark:text-white">{formatAbsolute(selected.createdAt)}</span>
                        <span className="text-[10px] text-[#0F2552]/50 dark:text-white/50">{formatRelative(selected.createdAt)}</span>
                     </div>
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#0F2552]/45 dark:text-white/45">Last attempt</span>
                        <span className="text-xs text-[#0F2552] dark:text-white">{formatAbsolute(selected.emailLastAttemptAt)}</span>
                        {selected.emailLastAttemptAt && (
                           <span className="text-[10px] text-[#0F2552]/50 dark:text-white/50">{formatRelative(selected.emailLastAttemptAt)}</span>
                        )}
                     </div>
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#0F2552]/45 dark:text-white/45">Next attempt</span>
                        <span className="text-xs text-[#0F2552] dark:text-white">{formatAbsolute(selected.emailNextAttemptAt)}</span>
                        {selected.emailNextAttemptAt && (
                           <span className="text-[10px] text-[#0F2552]/50 dark:text-white/50">{formatRelative(selected.emailNextAttemptAt)}</span>
                        )}
                     </div>
                  </div>
               </SectionCard>

               {/* ─── Section 2: Delivery Details ──────────────────────── */}
               <SectionCard title="Delivery Details" subtitle="Recipient, event context, and routing">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
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
                        <div className="flex flex-col gap-0.5">
                           <span className="font-medium">{formatEventType(selected.eventType)}</span>
                           <span className="font-mono text-[10px] text-[#0F2552]/40 dark:text-white/40">
                              {selected.eventType}
                           </span>
                        </div>
                     </Field>

                     <Field label="Entity">
                        {selected.entity?.type ? (
                           <Link
                              href={`/admin/${selected.entity.type}/${selected.entity.id}`}
                              className="underline decoration-dotted hover:decoration-solid"
                           >
                              {selected.entity.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} #{selected.entity.id}
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
                              className="underline decoration-dotted hover:decoration-solid break-all text-xs"
                           >
                              {selected.link}
                           </a>
                        ) : (
                           '—'
                        )}
                     </Field>
                  </div>
               </SectionCard>

               {/* ─── Section 3: Email Content Preview ─────────────────── */}
               <SectionCard
                  title="Email Content Preview"
                  subtitle="What the recipient would have received"
               >
                  <div className="space-y-4">
                     <Field label="Subject">
                        <span className="font-medium">
                           {selected.emailSubject ?? selected.title ?? '—'}
                        </span>
                     </Field>

                     <Field label="Body" fullWidth>
                        {selected.emailBody ? (
                           <div
                              className="text-sm whitespace-pre-wrap p-4 rounded-md border"
                              style={{
                                 borderColor: 'var(--border-default)',
                                 background: 'color-mix(in srgb, var(--bg-elevated) 50%, transparent)',
                              }}
                           >
                              {selected.emailBody}
                           </div>
                        ) : (
                           <span className="text-[#0F2552]/40 dark:text-white/40 italic">
                              No email body persisted for this row (pre-migration row or body-less event).
                           </span>
                        )}
                     </Field>

                     {selected.emailItems && selected.emailItems.length > 0 && (
                        <Field label="Items" fullWidth>
                           <div
                              className="p-4 rounded-md border"
                              style={{
                                 borderColor: 'var(--border-default)',
                                 background: 'color-mix(in srgb, var(--bg-elevated) 50%, transparent)',
                              }}
                           >
                              <EmailItemsTable items={selected.emailItems} />
                           </div>
                        </Field>
                     )}
                  </div>
               </SectionCard>

               {/* ─── Section 4: Error Details (conditional) ───────────── */}
               {selected.emailLastError && (
                  <SectionCard title="Last Error" subtitle="Truncated to 1000 characters">
                     <pre
                        className="text-xs font-mono whitespace-pre-wrap p-4 rounded-md border"
                        style={{
                           borderColor: 'var(--chart-coral)',
                           background: 'color-mix(in srgb, var(--chart-coral) 8%, transparent)',
                           color: 'var(--chart-coral)',
                        }}
                     >
                        {selected.emailLastError}
                     </pre>
                  </SectionCard>
               )}
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
