import React, { FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import Formsy from 'formsy-react';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import SettingsShell from '@/components/SettingsShell';
import DateInput from '@/components/Inputs/DateInput';
import TableSkeletonRow from '@/components/TableSkeletonRow';
import { RootState } from '@/redux/reducers';
import { auditLogActions } from '@/actions';
import { AuditLogEvent } from '@/types';

const PAGE_SIZE = 10;

const ENTITY_TYPES = ['Request', 'Item', 'Complaint'] as const;
const ACTIONS = [
   'Assigned',
   'Completed',
   'Collected',
   'Leased',
   'Released',
   'Returned',
   'Resolved',
] as const;

const formatDateTime = (iso: string | null | undefined) => {
   if (!iso) return '-';
   try {
      const d = new Date(iso);
      return `${d.toLocaleDateString('en-US', {
         month: 'short',
         day: '2-digit',
         year: 'numeric',
      })} · ${d.toLocaleTimeString('en-US', {
         hour: '2-digit',
         minute: '2-digit',
      })}`;
   } catch {
      return iso;
   }
};

const actionBadgeColor = (action: string) => {
   switch (action) {
      case 'Assigned':
      case 'Completed':
      case 'Resolved':
         return 'bg-green-500/15 text-green-300 border-green-500/30';
      case 'Leased':
      case 'Released':
         return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'Collected':
      case 'Returned':
         return 'bg-[#B28309]/15 text-[#B28309] border-[#B28309]/30';
      default:
         return 'bg-gray-500/15 text-gray-300 border-gray-500/30';
   }
};

const AuditLogs: FC = () => {
   const dispatch = useDispatch();
   const items = useSelector((s: RootState) => s.auditLog.items) as AuditLogEvent[];
   const meta = useSelector((s: RootState) => s.auditLog.meta);
   const loading = useSelector((s: RootState) => s.auditLog.IsFetchingAuditLogs);

   const [page, setPage] = useState(1);
   const [from, setFrom] = useState('');
   const [to, setTo] = useState('');
   const [entityType, setEntityType] = useState('');
   const [action, setAction] = useState('');
   const [actor, setActor] = useState('');
   const [q, setQ] = useState('');
   const [debouncedQ, setDebouncedQ] = useState('');
   const [debouncedActor, setDebouncedActor] = useState('');
   const [selectedEvent, setSelectedEvent] = useState<AuditLogEvent | null>(null);

   useEffect(() => {
      const id = setTimeout(() => setDebouncedQ(q.trim()), 300);
      return () => clearTimeout(id);
   }, [q]);

   useEffect(() => {
      const id = setTimeout(() => setDebouncedActor(actor.trim()), 300);
      return () => clearTimeout(id);
   }, [actor]);

   useEffect(() => {
      setPage(1);
   }, [from, to, entityType, action, debouncedActor, debouncedQ]);

   useEffect(() => {
      dispatch(
         auditLogActions.getAuditLogs({
            page,
            limit: PAGE_SIZE,
            from: from || undefined,
            to: to || undefined,
            entityType: (entityType as 'Request' | 'Item' | 'Complaint') || undefined,
            action: action || undefined,
            actor: debouncedActor || undefined,
            q: debouncedQ || undefined,
         }) as unknown as UnknownAction,
      );
   }, [dispatch, page, from, to, entityType, action, debouncedActor, debouncedQ]);

   const totalItems = meta?.totalItems ?? 0;
   const totalPages = Math.max(1, meta?.totalPages ?? 1);
   const currentPage = meta?.currentPage ?? page;
   const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
   const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalItems);

   const clearFilters = () => {
      setFrom('');
      setTo('');
      setEntityType('');
      setAction('');
      setActor('');
      setQ('');
   };

   return (
      <PrivateRoute>
         <Layout title="Audit Logs">
            <SettingsShell active="audit-logs">
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h2 className="text-lg font-bold text-[#0F2552] dark:text-white/90">
                        Audit Logs
                     </h2>
                     <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#B28309] text-[#B28309] text-xs font-semibold hover:bg-[#B28309]/10 cursor-pointer"
                     >
                        Clear filters
                     </button>
                  </div>

                  {/* Filter bar */}
                  <Formsy className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 p-4">
                     <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <div className="md:col-span-2">
                           <label className="block text-[0.6rem] uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1">
                              Search
                           </label>
                           <input
                              type="text"
                              placeholder="Search actor, action, entity…"
                              value={q}
                              onChange={(e) => setQ(e.target.value)}
                              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-white/10 bg-transparent text-sm text-[#0F2552] dark:text-white/90 focus:outline-none focus:border-[#B28309]"
                           />
                        </div>
                        <div>
                           <label className="block text-[0.6rem] uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1">
                              Actor
                           </label>
                           <input
                              type="text"
                              placeholder="User name"
                              value={actor}
                              onChange={(e) => setActor(e.target.value)}
                              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-white/10 bg-transparent text-sm text-[#0F2552] dark:text-white/90 focus:outline-none focus:border-[#B28309]"
                           />
                        </div>
                        <div>
                           <label className="block text-[0.6rem] uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1">
                              Entity
                           </label>
                           <select
                              value={entityType}
                              onChange={(e) => setEntityType(e.target.value)}
                              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-white/10 bg-transparent text-sm text-[#0F2552] dark:text-white/90 focus:outline-none focus:border-[#B28309]"
                           >
                              <option value="">All</option>
                              {ENTITY_TYPES.map((t) => (
                                 <option key={t} value={t}>
                                    {t}
                                 </option>
                              ))}
                           </select>
                        </div>
                        <div>
                           <label className="block text-[0.6rem] uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1">
                              Action
                           </label>
                           <select
                              value={action}
                              onChange={(e) => setAction(e.target.value)}
                              className="w-full px-3 py-2 rounded border border-gray-200 dark:border-white/10 bg-transparent text-sm text-[#0F2552] dark:text-white/90 focus:outline-none focus:border-[#B28309]"
                           >
                              <option value="">All</option>
                              {ACTIONS.map((a) => (
                                 <option key={a} value={a}>
                                    {a}
                                 </option>
                              ))}
                           </select>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        <DateInput
                           name="from"
                           label="From"
                           placeholder="Select start date"
                           value={from}
                           onValueChange={(val: string) => setFrom(val)}
                        />
                        <DateInput
                           name="to"
                           label="To"
                           placeholder="Select end date"
                           value={to}
                           onValueChange={(val: string) => setTo(val)}
                           minDate={from || undefined}
                        />
                     </div>
                  </Formsy>

                  {/* Table */}
                  <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 overflow-hidden">
                     <table className="w-full">
                        <thead>
                           <tr className="text-[0.65rem] uppercase tracking-wider text-gray-400 dark:text-white/40 border-b border-gray-100 dark:border-white/5">
                              <th className="px-6 py-3 text-left font-semibold">When</th>
                              <th className="px-6 py-3 text-left font-semibold">Actor</th>
                              <th className="px-6 py-3 text-left font-semibold">Entity</th>
                              <th className="px-6 py-3 text-left font-semibold">Action</th>
                           </tr>
                        </thead>
                        <tbody>
                           {loading &&
                              Array.from({ length: 6 }).map((_, i) => (
                                 <TableSkeletonRow
                                    key={`sk-${i}`}
                                    cols={4}
                                    widths={['45%', '50%', '55%', '30%']}
                                 />
                              ))}
                           {!loading && items.length === 0 && (
                              <tr>
                                 <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                                    No events match the current filters.
                                 </td>
                              </tr>
                           )}
                           {!loading &&
                              items.map((ev) => (
                                 <tr
                                    key={ev.id}
                                    onClick={() => setSelectedEvent(ev)}
                                    className="border-b border-gray-100 dark:border-white/5 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                                 >
                                    <td className="px-6 py-3 text-sm text-[#0F2552] dark:text-white/80">
                                       {formatDateTime(ev.occurredAt)}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-500 dark:text-white/60">
                                       {ev.actor ?? '-'}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-[#0F2552] dark:text-white/80">
                                       {ev.entityType} <span className="text-gray-400">#{ev.entityId}</span>
                                    </td>
                                    <td className="px-6 py-3">
                                       <span
                                          className={`px-2 py-0.5 rounded border text-[0.65rem] font-semibold uppercase tracking-wide ${actionBadgeColor(
                                             ev.action,
                                          )}`}
                                       >
                                          {ev.action}
                                       </span>
                                    </td>
                                 </tr>
                              ))}
                        </tbody>
                     </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/60">
                     <span>
                        Showing {rangeStart} to {rangeEnd} of {totalItems} results
                     </span>
                     <div className="flex gap-1 items-center">
                        <button
                           onClick={() => setPage(1)}
                           disabled={page === 1}
                           className="px-3 py-1.5 rounded border border-gray-200 dark:border-white/10 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                           aria-label="First page"
                        >
                           «
                        </button>
                        <button
                           onClick={() => setPage((p) => Math.max(1, p - 1))}
                           disabled={page === 1}
                           className="px-3 py-1.5 rounded border border-gray-200 dark:border-white/10 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                           aria-label="Previous page"
                        >
                           ‹
                        </button>
                        <span className="px-3 py-1.5">
                           Page {currentPage} of {totalPages}
                        </span>
                        <button
                           onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                           disabled={page >= totalPages}
                           className="px-3 py-1.5 rounded border border-gray-200 dark:border-white/10 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                           aria-label="Next page"
                        >
                           ›
                        </button>
                        <button
                           onClick={() => setPage(totalPages)}
                           disabled={page >= totalPages}
                           className="px-3 py-1.5 rounded border border-gray-200 dark:border-white/10 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                           aria-label="Last page"
                        >
                           »
                        </button>
                     </div>
                  </div>
               </div>

               {/* Detail drawer */}
               {selectedEvent && (
                  <div
                     className="fixed inset-0 bg-black/60 z-[1000] flex justify-end"
                     onClick={() => setSelectedEvent(null)}
                  >
                     <div
                        className="w-full max-w-md bg-white dark:bg-[#0e0e1a] h-full overflow-y-auto border-l border-gray-200 dark:border-white/10 p-6"
                        onClick={(e) => e.stopPropagation()}
                     >
                        <div className="flex items-center justify-between mb-6">
                           <h3 className="text-base font-bold text-[#0F2552] dark:text-white">
                              Event Detail
                           </h3>
                           <button
                              onClick={() => setSelectedEvent(null)}
                              className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                           >
                              ✕
                           </button>
                        </div>
                        <dl className="space-y-4 text-sm">
                           <div>
                              <dt className="text-[0.6rem] uppercase tracking-wider text-gray-400">
                                 When
                              </dt>
                              <dd className="text-[#0F2552] dark:text-white/90 mt-1">
                                 {formatDateTime(selectedEvent.occurredAt)}
                              </dd>
                           </div>
                           <div>
                              <dt className="text-[0.6rem] uppercase tracking-wider text-gray-400">
                                 Actor
                              </dt>
                              <dd className="text-[#0F2552] dark:text-white/90 mt-1">
                                 {selectedEvent.actor ?? '(system)'}
                              </dd>
                           </div>
                           <div>
                              <dt className="text-[0.6rem] uppercase tracking-wider text-gray-400">
                                 Entity
                              </dt>
                              <dd className="text-[#0F2552] dark:text-white/90 mt-1">
                                 {selectedEvent.entityType} · ID {selectedEvent.entityId}
                              </dd>
                           </div>
                           <div>
                              <dt className="text-[0.6rem] uppercase tracking-wider text-gray-400">
                                 Action
                              </dt>
                              <dd className="mt-1">
                                 <span
                                    className={`px-2 py-0.5 rounded border text-[0.65rem] font-semibold uppercase tracking-wide ${actionBadgeColor(
                                       selectedEvent.action,
                                    )}`}
                                 >
                                    {selectedEvent.action}
                                 </span>
                              </dd>
                           </div>
                           <div>
                              <dt className="text-[0.6rem] uppercase tracking-wider text-gray-400">
                                 Source
                              </dt>
                              <dd className="text-[#0F2552] dark:text-white/90 mt-1 capitalize">
                                 {selectedEvent.source} audit table
                              </dd>
                           </div>
                           <div>
                              <dt className="text-[0.6rem] uppercase tracking-wider text-gray-400">
                                 Event ID
                              </dt>
                              <dd className="text-[#0F2552]/70 dark:text-white/60 mt-1 text-xs font-mono break-all">
                                 {selectedEvent.id}
                              </dd>
                           </div>
                        </dl>
                     </div>
                  </div>
               )}
            </SettingsShell>
         </Layout>
      </PrivateRoute>
   );
};

export default AuditLogs;
