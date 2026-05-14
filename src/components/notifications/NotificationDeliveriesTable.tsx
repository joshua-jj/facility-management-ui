import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import Card from '@/components/Cards/Card';
import {
   EmailStatus,
   NotificationDelivery,
} from '@/types/notificationsAdmin.types';

/**
 * Table for the SA-only notification deliveries page. Renders one row per
 * delivery with a colored status chip, attempt counter, relative-time
 * last-attempt, truncated last-error tooltip, and per-row actions.
 *
 * Action visibility rules (spec §6.4):
 *  - SENT               → no actions
 *  - FAILED             → no actions (cron is mid-flight; admin shouldn't
 *                         second-guess auto-retry)
 *  - PERMANENTLY_FAILED → Retry + Mark Abandoned
 *  - ABANDONED          → no actions
 */
interface NotificationDeliveriesTableProps {
   rows: NotificationDelivery[];
   activeStatusFilter: EmailStatus[];
   onRetry: (id: number) => void;
   onAbandon: (id: number) => void;
   isMutating: boolean;
}

interface ChipStyle {
   background: string;
   color: string;
   label: string;
}

const STATUS_CHIP: Record<EmailStatus, ChipStyle> = {
   [EmailStatus.SENT]: {
      background: 'color-mix(in srgb, var(--chart-mint) 16%, transparent)',
      color: 'var(--chart-mint)',
      label: 'Sent',
   },
   [EmailStatus.FAILED]: {
      background: 'color-mix(in srgb, var(--badge-warning) 16%, transparent)',
      color: 'var(--badge-warning)',
      label: 'Failed',
   },
   [EmailStatus.PERMANENTLY_FAILED]: {
      background: 'color-mix(in srgb, var(--chart-coral) 18%, transparent)',
      color: 'var(--chart-coral)',
      label: 'Permanently failed',
   },
   [EmailStatus.ABANDONED]: {
      background: 'color-mix(in srgb, var(--text-secondary) 12%, transparent)',
      color: 'var(--text-secondary)',
      label: 'Abandoned',
   },
};

const MAX_AUTO_RETRY = 3;

/**
 * Convert API event-type tokens (e.g. `MAINTENANCE_LOG_CREATED`) into
 * a human label (`Maintenance log created`).
 */
const formatEventType = (eventType: string): string => {
   if (!eventType) return '—';
   const lower = eventType.toLowerCase().replace(/_/g, ' ');
   return lower.charAt(0).toUpperCase() + lower.slice(1);
};

/**
 * Map known entity types to their detail-page route. Returns `null` for
 * types without a UI detail page (rendered as plain text instead).
 */
const detailHrefFor = (
   entity: NotificationDelivery['entity'],
): string | null => {
   if (!entity?.type || !entity?.id) return null;
   const type = entity.type.toLowerCase();
   switch (type) {
      case 'request':
         return `/admin/request/${entity.id}`;
      case 'item':
         return `/admin/item/${entity.id}`;
      default:
         return null;
   }
};

const formatEntityLabel = (
   entity: NotificationDelivery['entity'],
): string => {
   const human = entity.type
      ? entity.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Entity';
   return `${human} #${entity.id}`;
};

const NotificationDeliveriesTable: React.FC<NotificationDeliveriesTableProps> = ({
   rows,
   activeStatusFilter,
   onRetry,
   onAbandon,
   isMutating,
}) => {
   if (rows.length === 0) {
      const isOnlySent =
         activeStatusFilter.length === 1 &&
         activeStatusFilter[0] === EmailStatus.SENT;
      const isOnlyFailures =
         activeStatusFilter.length > 0 &&
         activeStatusFilter.every(
            (s) =>
               s === EmailStatus.FAILED || s === EmailStatus.PERMANENTLY_FAILED,
         );

      const message = isOnlySent
         ? 'No sent notifications in this range.'
         : isOnlyFailures
            ? "Everything's been delivered. ✓"
            : 'No notifications match the current filters.';

      return (
         <Card>
            <div className="py-12 text-center text-sm italic text-[#0F2552]/45 dark:text-white/45">
               {message}
            </div>
         </Card>
      );
   }

   return (
      <Card className="!p-0 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-sm">
               <thead>
                  <tr className="border-b border-[var(--border-default)] text-[0.6rem] uppercase tracking-widest text-[#0F2552]/50 dark:text-white/40 text-left">
                     <th className="px-4 py-3 font-semibold">Recipient</th>
                     <th className="px-4 py-3 font-semibold">Entity</th>
                     <th className="px-4 py-3 font-semibold">Event</th>
                     <th className="px-4 py-3 font-semibold">Status</th>
                     <th className="px-4 py-3 font-semibold">Attempts</th>
                     <th className="px-4 py-3 font-semibold">Last attempt</th>
                     <th className="px-4 py-3 font-semibold">Last error</th>
                     <th className="px-4 py-3 font-semibold text-right">
                        Actions
                     </th>
                  </tr>
               </thead>
               <tbody>
                  {rows.map((row) => {
                     const chip = STATUS_CHIP[row.emailStatus] ?? {
                        background: 'color-mix(in srgb, var(--text-secondary) 12%, transparent)',
                        color: 'var(--text-secondary)',
                        label: row.emailStatus,
                     };
                     const showAttempts =
                        row.emailStatus === EmailStatus.FAILED ||
                        row.emailStatus === EmailStatus.PERMANENTLY_FAILED;
                     const showRetry =
                        row.emailStatus === EmailStatus.PERMANENTLY_FAILED;
                     const showAbandon =
                        row.emailStatus === EmailStatus.PERMANENTLY_FAILED;
                     const detailHref = detailHrefFor(row.entity);
                     const entityLabel = formatEntityLabel(row.entity);

                     return (
                        <tr
                           key={row.id}
                           className="border-b border-[var(--border-default)] last:border-0 align-top"
                        >
                           <td className="px-4 py-3 text-[#0F2552] dark:text-white">
                              <div className="font-semibold break-all">
                                 {row.recipient.email}
                              </div>
                              {row.recipient.name && (
                                 <div className="text-xs text-[#0F2552]/55 dark:text-white/55 mt-0.5">
                                    {row.recipient.name}
                                 </div>
                              )}
                              {row.recipient.type === 'guest' && (
                                 <span className="inline-block text-[0.6rem] uppercase tracking-wider font-semibold px-2 py-0.5 mt-1 rounded border border-[var(--border-default)] text-[#0F2552]/55 dark:text-white/55">
                                    Guest
                                 </span>
                              )}
                           </td>
                           <td className="px-4 py-3 text-[#0F2552]/75 dark:text-white/75 text-xs">
                              {detailHref ? (
                                 <Link
                                    href={detailHref}
                                    className="hover:text-[var(--color-secondary)] transition-colors"
                                 >
                                    {entityLabel}
                                 </Link>
                              ) : (
                                 <span>{entityLabel}</span>
                              )}
                           </td>
                           <td className="px-4 py-3 text-[#0F2552]/75 dark:text-white/75 text-xs">
                              {formatEventType(row.eventType)}
                           </td>
                           <td className="px-4 py-3">
                              <span
                                 className="inline-block text-[0.65rem] font-semibold uppercase tracking-wider px-2 py-1 rounded"
                                 style={{
                                    background: chip.background,
                                    color: chip.color,
                                 }}
                              >
                                 {chip.label}
                              </span>
                           </td>
                           <td className="px-4 py-3 text-[#0F2552]/65 dark:text-white/65 tabular-nums text-xs">
                              {showAttempts
                                 ? `${row.emailAttemptCount}/${MAX_AUTO_RETRY}`
                                 : '—'}
                           </td>
                           <td className="px-4 py-3 text-[#0F2552]/55 dark:text-white/55 text-xs">
                              {row.emailLastAttemptAt ? (
                                 <span title={row.emailLastAttemptAt}>
                                    {formatDistanceToNow(
                                       parseISO(row.emailLastAttemptAt),
                                       { addSuffix: true },
                                    )}
                                 </span>
                              ) : (
                                 '—'
                              )}
                           </td>
                           <td className="px-4 py-3 text-[#0F2552]/55 dark:text-white/55 text-xs max-w-[16rem]">
                              {row.emailLastError ? (
                                 <span
                                    className="block truncate"
                                    title={row.emailLastError}
                                 >
                                    {row.emailLastError}
                                 </span>
                              ) : (
                                 '—'
                              )}
                           </td>
                           <td className="px-4 py-3 text-right">
                              {(showRetry || showAbandon) && (
                                 <div className="inline-flex gap-2">
                                    {showRetry && (
                                       <button
                                          type="button"
                                          disabled={isMutating}
                                          onClick={() => {
                                             if (
                                                window.confirm(
                                                   `Retry sending to ${row.recipient.email}? The notification will re-enter the auto-retry queue with a fresh attempt count.`,
                                                )
                                             ) {
                                                onRetry(row.id);
                                             }
                                          }}
                                          style={{
                                             background: 'var(--color-secondary)',
                                          }}
                                          className="text-xs font-semibold px-3 py-1.5 rounded-md text-white hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                       >
                                          Retry
                                       </button>
                                    )}
                                    {showAbandon && (
                                       <button
                                          type="button"
                                          disabled={isMutating}
                                          onClick={() => {
                                             if (
                                                window.confirm(
                                                   'Mark this notification as abandoned? Future automatic retries will not happen and this row will be terminal in the audit log.',
                                                )
                                             ) {
                                                onAbandon(row.id);
                                             }
                                          }}
                                          className="text-xs font-semibold px-3 py-1.5 rounded-md border border-[var(--border-default)] text-[#0F2552]/75 dark:text-white/75 hover:bg-[#0F2552]/5 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                       >
                                          Mark abandoned
                                       </button>
                                    )}
                                 </div>
                              )}
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </Card>
   );
};

export default NotificationDeliveriesTable;
