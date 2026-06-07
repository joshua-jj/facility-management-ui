import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import Link from 'next/link';

import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import PageHeader from '@/components/PageHeader';
import type { NextPageWithLayout } from '@/types/next-page-with-layout';
import { RootState } from '@/redux/reducers';
import { reconciliationActions } from '@/actions';
import { Permission } from '@/constants/permissions.enum';
import { ReconciliationReasonCode, ReconciliationState } from '@/types';

/* ──────────────────────────────────────────────────────────────────────
 * Static metadata
 * ──────────────────────────────────────────────────────────────────── */

/** State → badge colours — mirrors the list page. */
const STATE_META: Record<ReconciliationState, { bg: string; color: string; label: string }> = {
   DRAFT: { bg: 'rgba(107, 114, 128, 0.12)', color: 'rgb(75, 85, 99)', label: 'Draft' },
   SUBMITTED: { bg: 'rgba(178, 131, 9, 0.14)', color: 'var(--color-secondary)', label: 'Submitted' },
   POSTED: { bg: 'rgba(22, 163, 74, 0.12)', color: 'rgb(21, 128, 61)', label: 'Posted' },
   REJECTED: { bg: 'rgba(239, 68, 68, 0.12)', color: 'rgb(185, 28, 28)', label: 'Rejected' },
};

const STATE_ORDER: ReconciliationState[] = ['DRAFT', 'SUBMITTED', 'POSTED', 'REJECTED'];

const REASON_META: Record<ReconciliationReasonCode, { label: string }> = {
   LOST_STOLEN: { label: 'Lost / Stolen' },
   DAMAGED: { label: 'Damaged' },
   FOUND_RECOVERED: { label: 'Found / Recovered' },
   MISCOUNT_DATA_ERROR: { label: 'Miscount / Data error' },
};

const REASON_ORDER: ReconciliationReasonCode[] = [
   'LOST_STOLEN',
   'DAMAGED',
   'FOUND_RECOVERED',
   'MISCOUNT_DATA_ERROR',
];

const GOLD = '#B28309';

/* ──────────────────────────────────────────────────────────────────────
 * Defensive response normalisation
 *
 * The report JSON keys are not contractually fixed. We accept either:
 *   • { byReason: [{ reasonCode, totalVariance, lineCount }], byState: [{ state, count }] }
 *   • object maps, e.g. { byReason: { LOST_STOLEN: 4, ... }, byState: { DRAFT: 2, ... } }
 *   • a handful of alternate key spellings (variance/total, status, etc.)
 * …and reduce whatever arrives into the two normalised arrays below.
 * Anything unparseable yields empty arrays → friendly empty state.
 * ──────────────────────────────────────────────────────────────────── */

interface ReasonRow {
   reasonCode: string;
   label: string;
   totalVariance: number;
   lineCount: number;
}

interface StateRow {
   state: string;
   label: string;
   count: number;
}

type AnyRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is AnyRecord => typeof v === 'object' && v !== null && !Array.isArray(v);

const toNumber = (v: unknown): number => {
   const n = Number(v);
   return Number.isFinite(n) ? n : 0;
};

/** Pull the first defined value across a list of candidate keys. */
const pick = (obj: AnyRecord, keys: string[]): unknown => {
   for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
   }
   return undefined;
};

/** Locate the "by reason" payload across a few likely container keys. */
const findReasonContainer = (root: AnyRecord): unknown =>
   pick(root, ['byReason', 'byReasonCode', 'reasons', 'varianceByReason', 'reasonCodes']);

/** Locate the "by state" payload across a few likely container keys. */
const findStateContainer = (root: AnyRecord): unknown =>
   pick(root, ['byState', 'byStatus', 'states', 'sessionsByState', 'sessionStates', 'counts']);

const normaliseReasons = (raw: unknown): ReasonRow[] => {
   const out: Record<string, ReasonRow> = {};

   const upsert = (code: string, totalVariance: number, lineCount: number) => {
      const key = String(code).toUpperCase();
      const existing = out[key];
      if (existing) {
         existing.totalVariance += totalVariance;
         existing.lineCount += lineCount;
      } else {
         out[key] = {
            reasonCode: key,
            label: REASON_META[key as ReconciliationReasonCode]?.label ?? (code || '—'),
            totalVariance,
            lineCount,
         };
      }
   };

   if (Array.isArray(raw)) {
      for (const entry of raw) {
         if (!isRecord(entry)) continue;
         const code = String(pick(entry, ['reasonCode', 'reason', 'code', 'key']) ?? '');
         if (!code) continue;
         const totalVariance = toNumber(
            pick(entry, ['totalVariance', 'variance', 'total', 'sum', 'value', 'absVariance']),
         );
         const lineCount = toNumber(pick(entry, ['lineCount', 'lines', 'count', 'occurrences']));
         upsert(code, totalVariance, lineCount);
      }
   } else if (isRecord(raw)) {
      // Object map: { LOST_STOLEN: 4 } or { LOST_STOLEN: { totalVariance, lineCount } }
      for (const [code, val] of Object.entries(raw)) {
         if (isRecord(val)) {
            const totalVariance = toNumber(
               pick(val, ['totalVariance', 'variance', 'total', 'sum', 'value', 'absVariance']),
            );
            const lineCount = toNumber(pick(val, ['lineCount', 'lines', 'count', 'occurrences']));
            upsert(code, totalVariance, lineCount);
         } else {
            upsert(code, toNumber(val), 0);
         }
      }
   }

   const rows = Object.values(out);
   // Stable ordering: known reasons first (canonical order), then any extras.
   rows.sort((a, b) => {
      const ia = REASON_ORDER.indexOf(a.reasonCode as ReconciliationReasonCode);
      const ib = REASON_ORDER.indexOf(b.reasonCode as ReconciliationReasonCode);
      if (ia === -1 && ib === -1) return a.reasonCode.localeCompare(b.reasonCode);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
   });
   return rows;
};

const normaliseStates = (raw: unknown): StateRow[] => {
   const out: Record<string, StateRow> = {};

   const upsert = (state: string, count: number) => {
      const key = String(state).toUpperCase();
      const existing = out[key];
      if (existing) {
         existing.count += count;
      } else {
         out[key] = {
            state: key,
            label: STATE_META[key as ReconciliationState]?.label ?? (state || '—'),
            count,
         };
      }
   };

   if (Array.isArray(raw)) {
      for (const entry of raw) {
         if (!isRecord(entry)) continue;
         const state = String(pick(entry, ['state', 'status', 'key', 'name']) ?? '');
         if (!state) continue;
         upsert(state, toNumber(pick(entry, ['count', 'total', 'value', 'sessions'])));
      }
   } else if (isRecord(raw)) {
      for (const [state, val] of Object.entries(raw)) {
         if (isRecord(val)) {
            upsert(state, toNumber(pick(val, ['count', 'total', 'value', 'sessions'])));
         } else {
            upsert(state, toNumber(val));
         }
      }
   }

   const rows = Object.values(out);
   rows.sort((a, b) => {
      const ia = STATE_ORDER.indexOf(a.state as ReconciliationState);
      const ib = STATE_ORDER.indexOf(b.state as ReconciliationState);
      if (ia === -1 && ib === -1) return a.state.localeCompare(b.state);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
   });
   return rows;
};

/* ──────────────────────────────────────────────────────────────────────
 * Presentational pieces
 * ──────────────────────────────────────────────────────────────────── */

const CARD_STYLE: React.CSSProperties = {
   background: 'var(--surface-low, rgba(255,255,255,0.02))',
   border: '1px solid var(--border-default)',
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
   <span
      className="inline-flex items-center gap-1.5 text-[0.55rem] uppercase tracking-widest font-semibold px-2 py-1 rounded-md"
      style={{
         background: 'var(--surface-medium)',
         color: 'var(--text-hint)',
         border: '1px solid var(--border-default)',
      }}
   >
      {children}
   </span>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
   <div className="py-8 text-center text-sm" style={{ color: 'var(--text-hint)' }}>
      {message}
   </div>
);

/** Horizontal gold progress bar sized by `share` (0..1), value beside it. */
const ReasonBar: React.FC<{ row: ReasonRow; share: number }> = ({ row, share }) => {
   const pct = Math.max(0, Math.min(1, share)) * 100;
   return (
      <div className="space-y-1.5">
         <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
               {row.label}
            </span>
            <span className="text-sm tabular-nums font-semibold" style={{ color: 'var(--text-primary)' }}>
               {row.totalVariance}
               {row.lineCount > 0 && (
                  <span className="ml-2 text-[0.65rem] font-normal" style={{ color: 'var(--text-hint)' }}>
                     {row.lineCount} line{row.lineCount === 1 ? '' : 's'}
                  </span>
               )}
            </span>
         </div>
         <div
            className="h-2.5 w-full rounded-full overflow-hidden"
            style={{ background: 'var(--surface-medium)' }}
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${row.label} share of total variance`}
         >
            <div
               className="h-full rounded-full transition-all"
               style={{ width: `${pct}%`, background: GOLD, minWidth: pct > 0 ? '0.4rem' : 0 }}
            />
         </div>
      </div>
   );
};

const StateStatCard: React.FC<{ row: StateRow }> = ({ row }) => {
   const meta = STATE_META[row.state as ReconciliationState] ?? {
      bg: 'rgba(107, 114, 128, 0.12)',
      color: 'rgb(75, 85, 99)',
      label: row.label,
   };
   return (
      <div
         className="rounded-xl px-4 py-3 flex flex-col gap-1"
         style={{ background: meta.bg, border: `1px solid ${meta.color}22` }}
      >
         <span className="text-[0.6rem] uppercase tracking-widest font-semibold" style={{ color: meta.color }}>
            {meta.label}
         </span>
         <span className="text-2xl font-bold tabular-nums" style={{ color: meta.color }}>
            {row.count}
         </span>
      </div>
   );
};

/* ──────────────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────────────── */

const ReconciliationReport: NextPageWithLayout = () => {
   const dispatch = useDispatch();

   const { report, IsRequestingReconciliationReport } = useSelector((s: RootState) => s.reconciliation);

   useEffect(() => {
      dispatch(reconciliationActions.getReconciliationReport() as unknown as UnknownAction);
   }, [dispatch]);

   const { reasonRows, stateRows, totalAbsVariance } = useMemo(() => {
      const root = isRecord(report) ? (report as AnyRecord) : null;
      const reasons = root ? normaliseReasons(findReasonContainer(root)) : [];
      const states = root ? normaliseStates(findStateContainer(root)) : [];
      const total = reasons.reduce((sum, r) => sum + Math.abs(r.totalVariance), 0);
      return { reasonRows: reasons, stateRows: states, totalAbsVariance: total };
   }, [report]);

   const loading = !!IsRequestingReconciliationReport && !report;
   const hasReasonData = reasonRows.length > 0;
   const hasStateData = stateRows.length > 0;

   return (
      <div className="max-w-4xl mx-auto space-y-5">
         <PageHeader title="Variance Report" subtitle="Inventory reconciliation variances and session activity." />

         <Link
            href="/admin/reconciliation"
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: 'var(--color-secondary)' }}
         >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to reconciliations
         </Link>

         {loading ? (
            <div className="flex items-center justify-center h-48">
               <p className="text-sm" style={{ color: 'var(--text-hint)' }}>
                  Loading report…
               </p>
            </div>
         ) : (
            <>
               {/* ── Variance by reason ── */}
               <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                  <div className="flex items-center justify-between mb-4">
                     <SectionLabel>Variance by reason</SectionLabel>
                     <span className="text-[0.65rem] tabular-nums" style={{ color: 'var(--text-hint)' }}>
                        {hasReasonData ? (
                           <>
                              total{' '}
                              <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                 {totalAbsVariance}
                              </span>
                           </>
                        ) : (
                           '—'
                        )}
                     </span>
                  </div>

                  {hasReasonData ? (
                     <div className="space-y-4">
                        {reasonRows.map((row) => (
                           <ReasonBar
                              key={row.reasonCode}
                              row={row}
                              share={totalAbsVariance > 0 ? Math.abs(row.totalVariance) / totalAbsVariance : 0}
                           />
                        ))}
                     </div>
                  ) : (
                     <EmptyState message="No variance data available yet." />
                  )}
               </div>

               {/* ── Sessions by state ── */}
               <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                  <div className="mb-4">
                     <SectionLabel>Sessions by state</SectionLabel>
                  </div>

                  {hasStateData ? (
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {stateRows.map((row) => (
                           <StateStatCard key={row.state} row={row} />
                        ))}
                     </div>
                  ) : (
                     <EmptyState message="No session activity to report." />
                  )}
               </div>
            </>
         )}
      </div>
   );
};

ReconciliationReport.getLayout = (page) => (
   <PrivateRoute permissions={[Permission.RECONCILIATION_READ]}>
      <Layout title="Variance Report">{page}</Layout>
   </PrivateRoute>
);

export default ReconciliationReport;
