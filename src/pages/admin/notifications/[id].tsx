import type { NextPageWithLayout } from '@/types/next-page-with-layout';
import { useRouter } from 'next/router';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import ConfirmDialog, { ConfirmTone } from '@/components/ConfirmDialog';

import { notificationsAdminActions } from '@/actions/notificationsAdmin.actions';
import { RootState } from '@/redux/reducers';
import { Permission } from '@/constants/permissions.enum';
import { EmailStatus, EmailItem } from '@/types/notificationsAdmin.types';
import { entityHref } from '@/constants/entityRoute';

/**
 * SA-only detail view for a single notification delivery record.
 *
 * Layout: a status hero (status, recipient, actions, at-a-glance stats) over a
 * two-column body — email content on the left, delivery metadata + attempt
 * timeline (incl. last error) on the right.
 */

// ── Status styling ───────────────────────────────────────────────────

const STATUS_STYLE: Record<
   EmailStatus,
   { bg: string; color: string; label: string; icon: string }
> = {
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

// ── Small presentational helpers ─────────────────────────────────────

const Card: React.FC<{
   title?: string;
   subtitle?: string;
   children: React.ReactNode;
   className?: string;
   accent?: string;
}> = ({ title, subtitle, children, className = '', accent }) => (
   <div
      className={`rounded-xl border bg-white dark:bg-white/[0.03] p-5 ${className}`}
      style={{ borderColor: accent ?? 'var(--border-default)' }}
   >
      {title && (
         <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#0F2552] dark:text-white">{title}</h3>
            {subtitle && (
               <p className="text-xs text-[#0F2552]/50 dark:text-white/50 mt-0.5">{subtitle}</p>
            )}
         </div>
      )}
      {children}
   </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
   <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-[#0F2552]/55 dark:text-white/55">
         {label}
      </span>
      <span className="text-sm text-[#0F2552] dark:text-white break-words">{children}</span>
   </div>
);

const Stat: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
   <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#0F2552]/45 dark:text-white/45">
         {label}
      </span>
      <span className="text-sm text-[#0F2552] dark:text-white">{value}</span>
      {hint && <span className="text-[10px] text-[#0F2552]/50 dark:text-white/50">{hint}</span>}
   </div>
);

const formatAbsolute = (iso: string | null | undefined) =>
   iso ? format(parseISO(iso), 'PPpp') : '—';

const formatRelative = (iso: string | null | undefined) =>
   iso ? formatDistanceToNow(parseISO(iso), { addSuffix: true }) : null;

const formatEventType = (eventType: string): string => {
   if (!eventType) return '—';
   const lower = eventType.toLowerCase().replace(/_/g, ' ');
   return lower.charAt(0).toUpperCase() + lower.slice(1);
};

// ── Email items table ────────────────────────────────────────────────

const EmailItemsTable: React.FC<{ items: EmailItem[] }> = ({ items }) => {
   const hasDepartments = items.some((item) => item.department);

   const rows = (list: EmailItem[]) =>
      list.map((item, idx) => (
         <tr key={idx} className="border-b border-[var(--border-default)] last:border-0">
            <td className="py-1.5 text-[#0F2552] dark:text-white">{item.name}</td>
            <td className="py-1.5 text-right tabular-nums text-[#0F2552]/60 dark:text-white/60">
               {item.quantity != null ? `×${item.quantity}` : ''}
            </td>
         </tr>
      ));

   if (hasDepartments) {
      const groups: Record<string, EmailItem[]> = {};
      for (const item of items) {
         const dept = item.department ?? 'Other';
         (groups[dept] ??= []).push(item);
      }
      return (
         <div className="space-y-3">
            {Object.entries(groups).map(([dept, groupItems]) => (
               <div key={dept}>
                  <div className="text-xs font-semibold text-[#0F2552]/70 dark:text-white/70 mb-1">
                     {dept}
                  </div>
                  <table className="w-full text-xs">
                     <tbody>{rows(groupItems)}</tbody>
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
         <tbody>{rows(items)}</tbody>
      </table>
   );
};

// ── Page ─────────────────────────────────────────────────────────────

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

   const load = React.useCallback(() => {
      if (id == null) return;
      dispatch(
         notificationsAdminActions.getNotificationAdmin(id) as unknown as UnknownAction,
      );
   }, [dispatch, id]);

   useEffect(() => {
      load();
   }, [load]);

   // ── Modals (consistent with the list page) ──
   const [confirm, setConfirm] = useState<{
      title: string;
      description: React.ReactNode;
      confirmLabel: string;
      tone: ConfirmTone;
      run: () => void;
   } | null>(null);

   // Retry sends synchronously; the saga shows an outcome-aware snackbar and
   // the reducer merges the fresh row, so the status here flips on its own.
   const handleRetry = () => {
      if (id == null || !selected) return;
      dispatch(
         notificationsAdminActions.retryNotification(id) as unknown as UnknownAction,
      );
   };

   const handleAbandon = () => {
      if (id == null) return;
      setConfirm({
         title: 'Mark as abandoned',
         description:
            'Mark this notification as abandoned? Future automatic retries will not happen and this row will be terminal in the audit log.',
         confirmLabel: 'Mark abandoned',
         tone: 'danger',
         run: () =>
            dispatch(
               notificationsAdminActions.abandonNotification(id) as unknown as UnknownAction,
            ),
      });
   };

   const handleDelete = () => {
      if (id == null) return;
      setConfirm({
         title: 'Delete notification',
         description:
            'Delete this notification from the queue? The row is soft-deleted; it will survive in the audit log but no longer appear here.',
         confirmLabel: 'Delete',
         tone: 'danger',
         run: () => {
            dispatch(
               notificationsAdminActions.deleteNotification(id) as unknown as UnknownAction,
            );
            setTimeout(() => router.push('/admin/notifications'), 600);
         },
      });
   };

   // ── Action visibility ──
   const canRetry =
      selected?.emailStatus === EmailStatus.FAILED ||
      selected?.emailStatus === EmailStatus.PERMANENTLY_FAILED ||
      selected?.emailStatus === EmailStatus.ABANDONED;
   const canAbandon = selected?.emailStatus === EmailStatus.PERMANENTLY_FAILED;
   const canDelete =
      selected?.emailStatus === EmailStatus.PERMANENTLY_FAILED ||
      selected?.emailStatus === EmailStatus.ABANDONED;

   const status = selected ? STATUS_STYLE[selected.emailStatus] : null;
   const linkHref = selected ? entityHref(selected.entity?.type, selected.entity?.id) : null;

   const retryLabel =
      selected?.emailStatus === EmailStatus.ABANDONED
         ? 'Retry (un-abandon)'
         : selected?.emailStatus === EmailStatus.FAILED
           ? 'Retry (override backoff)'
           : 'Retry';

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

         {selectedError && !isLoadingSelected && (
            <div className="mb-4 px-4 py-3 rounded-md bg-[color-mix(in_srgb,var(--chart-coral)_12%,transparent)] border border-[var(--chart-coral)] text-sm text-[#0F2552] dark:text-white flex items-center justify-between gap-3">
               <span>Couldn&apos;t load notification: {selectedError}</span>
               <button
                  type="button"
                  onClick={load}
                  className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-md bg-[var(--chart-coral)] text-white hover:opacity-90 transition-opacity cursor-pointer"
               >
                  Retry
               </button>
            </div>
         )}

         {isLoadingSelected && !selected && (
            <div className="text-sm italic text-[#0F2552]/45 dark:text-white/45 py-16 text-center">
               Loading notification…
            </div>
         )}

         {selected && status && (
            <div className="space-y-5">
               {/* ── Status hero ── */}
               <div
                  className="rounded-xl border p-6"
                  style={{
                     borderColor: 'var(--border-default)',
                     background:
                        'linear-gradient(135deg, color-mix(in srgb, var(--color-secondary) 6%, transparent), transparent 60%)',
                  }}
               >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                     <div className="space-y-2.5">
                        <span
                           className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                           style={{ background: status.bg, color: status.color }}
                        >
                           <span className="text-[10px]">{status.icon}</span>
                           {status.label}
                        </span>
                        <h1 className="text-xl font-bold text-[#0F2552] dark:text-white">
                           Notification #{selected.id}
                           {selected.title ? (
                              <span className="font-normal text-[#0F2552]/60 dark:text-white/55">
                                 {' '}
                                 · {selected.title}
                              </span>
                           ) : null}
                        </h1>
                        <p className="text-sm text-[#0F2552]/70 dark:text-white/70">
                           To{' '}
                           <span className="font-medium text-[#0F2552] dark:text-white">
                              {selected.recipient.name ?? selected.recipient.email}
                           </span>{' '}
                           <span className="text-[#0F2552]/55 dark:text-white/55">
                              {selected.recipient.email}
                              {selected.recipient.type === 'guest' && ' · guest'}
                           </span>
                        </p>
                     </div>

                     {(canRetry || canAbandon || canDelete) && (
                        <div className="flex flex-wrap gap-2 shrink-0">
                           {canRetry && (
                              <button
                                 type="button"
                                 onClick={handleRetry}
                                 disabled={isMutating}
                                 className="text-xs font-semibold px-4 py-2 rounded-lg bg-[var(--color-secondary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                              >
                                 ⟳ {retryLabel}
                              </button>
                           )}
                           {canAbandon && (
                              <button
                                 type="button"
                                 onClick={handleAbandon}
                                 disabled={isMutating}
                                 className="text-xs font-semibold px-4 py-2 rounded-lg border border-[var(--chart-coral)] text-[var(--chart-coral)] hover:bg-[color-mix(in_srgb,var(--chart-coral)_8%,transparent)] transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                 Mark abandoned
                              </button>
                           )}
                           {canDelete && (
                              <button
                                 type="button"
                                 onClick={handleDelete}
                                 disabled={isMutating}
                                 className="text-xs font-semibold px-4 py-2 rounded-lg border border-[var(--border-default)] text-[#0F2552]/65 dark:text-white/55 hover:border-[var(--chart-coral)] hover:text-[var(--chart-coral)] transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                 Delete
                              </button>
                           )}
                        </div>
                     )}
                  </div>

                  {/* At-a-glance stats */}
                  <div
                     className="mt-5 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-4"
                     style={{ borderColor: 'var(--border-default)' }}
                  >
                     <Stat label="Attempts" value={String(selected.emailTotalAttempts)} />
                     <Stat
                        label="Created"
                        value={formatRelative(selected.createdAt) ?? '—'}
                        hint={formatAbsolute(selected.createdAt)}
                     />
                     <Stat
                        label="Last attempt"
                        value={formatRelative(selected.emailLastAttemptAt) ?? 'never'}
                        hint={selected.emailLastAttemptAt ? formatAbsolute(selected.emailLastAttemptAt) : undefined}
                     />
                     <Stat
                        label="Next attempt"
                        value={formatRelative(selected.emailNextAttemptAt) ?? '—'}
                        hint={selected.emailNextAttemptAt ? formatAbsolute(selected.emailNextAttemptAt) : undefined}
                     />
                  </div>
               </div>

               {/* ── Two-column body ── */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Left: email content */}
                  <div className="lg:col-span-2 space-y-5">
                     <Card title="Email content" subtitle="What the recipient would have received">
                        <div className="space-y-4">
                           <Field label="Subject">
                              <span className="font-medium">
                                 {selected.emailSubject ?? selected.title ?? '—'}
                              </span>
                           </Field>

                           <div className="flex flex-col gap-1">
                              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#0F2552]/55 dark:text-white/55">
                                 Body
                              </span>
                              {selected.emailBody ? (
                                 <div
                                    className="text-sm whitespace-pre-wrap p-4 rounded-lg border mt-1"
                                    style={{
                                       borderColor: 'var(--border-default)',
                                       background:
                                          'color-mix(in srgb, var(--bg-elevated) 50%, transparent)',
                                    }}
                                 >
                                    {selected.emailBody}
                                 </div>
                              ) : (
                                 <span className="text-[#0F2552]/40 dark:text-white/40 italic text-sm">
                                    No email body persisted for this row.
                                 </span>
                              )}
                           </div>

                           {selected.emailItems && selected.emailItems.length > 0 && (
                              <div className="flex flex-col gap-1">
                                 <span className="text-[11px] uppercase tracking-wider font-semibold text-[#0F2552]/55 dark:text-white/55">
                                    Items
                                 </span>
                                 <div
                                    className="p-4 rounded-lg border mt-1"
                                    style={{
                                       borderColor: 'var(--border-default)',
                                       background:
                                          'color-mix(in srgb, var(--bg-elevated) 50%, transparent)',
                                    }}
                                 >
                                    <EmailItemsTable items={selected.emailItems} />
                                 </div>
                              </div>
                           )}
                        </div>
                     </Card>

                     {/* Last error — moved here from the list table */}
                     {selected.emailLastError && (
                        <Card title="Last error" subtitle="Most recent delivery failure" accent="var(--chart-coral)">
                           <pre
                              className="text-xs font-mono whitespace-pre-wrap p-4 rounded-lg border overflow-x-auto"
                              style={{
                                 borderColor: 'var(--chart-coral)',
                                 background: 'color-mix(in srgb, var(--chart-coral) 8%, transparent)',
                                 color: 'var(--chart-coral)',
                              }}
                           >
                              {selected.emailLastError}
                           </pre>
                        </Card>
                     )}
                  </div>

                  {/* Right: delivery metadata */}
                  <div className="space-y-5">
                     <Card title="Delivery details">
                        <div className="space-y-4">
                           <Field label="Event">
                              <span className="font-medium">{formatEventType(selected.eventType)}</span>
                              <span className="block font-mono text-[10px] text-[#0F2552]/40 dark:text-white/40">
                                 {selected.eventType}
                              </span>
                           </Field>

                           <Field label="Entity">
                              {selected.entity?.type ? (
                                 linkHref ? (
                                    <Link
                                       href={linkHref}
                                       className="text-[var(--color-secondary)] underline decoration-dotted hover:decoration-solid"
                                    >
                                       {formatEventType(selected.entity.type)} #{selected.entity.id}
                                    </Link>
                                 ) : (
                                    <span>
                                       {formatEventType(selected.entity.type)} #{selected.entity.id}
                                    </span>
                                 )
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
                                    className="text-[var(--color-secondary)] underline decoration-dotted hover:decoration-solid break-all text-xs"
                                 >
                                    {selected.link}
                                 </a>
                              ) : (
                                 '—'
                              )}
                           </Field>
                        </div>
                     </Card>
                  </div>
               </div>
            </div>
         )}

         <ConfirmDialog
            open={!!confirm}
            onClose={() => setConfirm(null)}
            onConfirm={() => {
               confirm?.run();
               setConfirm(null);
            }}
            title={confirm?.title ?? ''}
            description={confirm?.description}
            confirmLabel={confirm?.confirmLabel}
            tone={confirm?.tone}
         />
      </>
   );
};

NotificationAdminDetailPage.getLayout = (page) => (
   <PrivateRoute permissions={[Permission.NOTIFICATIONS_ADMIN]}>
      <Layout title="Notification detail">{page}</Layout>
   </PrivateRoute>
);

export default NotificationAdminDetailPage;
