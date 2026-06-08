import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';

import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import PageHeader from '@/components/PageHeader';
import type { NextPageWithLayout } from '@/types/next-page-with-layout';
import { RootState } from '@/redux/reducers';
import { reconciliationActions } from '@/actions';
import { reconciliationConstants } from '@/constants';
import { AppEmitter } from '@/controllers/EventEmitter';
import { Permission } from '@/constants/permissions.enum';
import { usePermission } from '@/hooks/usePermission';
import {
   ReconciliationLine,
   ReconciliationLineCountInput,
   ReconciliationReasonCode,
   ReconciliationState,
   ReconciliationUnit,
} from '@/types';

/* ──────────────────────────────────────────────────────────────────────
 * Static metadata
 * ──────────────────────────────────────────────────────────────────── */

/** State → badge colours — mirrors the list page. */
const STATE_BADGE: Record<ReconciliationState, { bg: string; color: string; label: string }> = {
   DRAFT: { bg: 'rgba(107, 114, 128, 0.12)', color: 'rgb(75, 85, 99)', label: 'Draft' },
   SUBMITTED: { bg: 'rgba(178, 131, 9, 0.14)', color: 'var(--color-secondary)', label: 'Submitted' },
   POSTED: { bg: 'rgba(22, 163, 74, 0.12)', color: 'rgb(21, 128, 61)', label: 'Posted' },
   REJECTED: { bg: 'rgba(239, 68, 68, 0.12)', color: 'rgb(185, 28, 28)', label: 'Rejected' },
};

const StateBadge: React.FC<{ state?: ReconciliationState }> = ({ state }) => {
   const meta = (state && STATE_BADGE[state]) || {
      bg: 'rgba(107, 114, 128, 0.12)',
      color: 'rgb(75, 85, 99)',
      label: state ?? '—',
   };
   return (
      <span
         className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold"
         style={{ background: meta.bg, color: meta.color }}
      >
         {meta.label}
      </span>
   );
};

const REASON_OPTIONS: { value: ReconciliationReasonCode; label: string }[] = [
   { value: 'LOST_STOLEN', label: 'Lost / Stolen' },
   { value: 'DAMAGED', label: 'Damaged' },
   { value: 'FOUND_RECOVERED', label: 'Found / Recovered' },
   { value: 'MISCOUNT_DATA_ERROR', label: 'Miscount / Data error' },
];

const REASON_LABEL: Record<string, string> = REASON_OPTIONS.reduce(
   (acc, r) => ({ ...acc, [r.value]: r.label }),
   {} as Record<string, string>,
);

/** Item/unit condition values — match the rest of the app (AddItem, item/[id]). */
const CONDITION_OPTIONS = [
   { value: 'Good', label: 'Good' },
   { value: 'Bad', label: 'Bad' },
];

const DEFAULT_CONDITION = 'Good';

/** The two serialized spellings the API/UI use interchangeably. */
const isSerialized = (mode: string | undefined): boolean =>
   mode === 'SERIAL' || mode === 'Serialized';

/* ──────────────────────────────────────────────────────────────────────
 * Local editable state model
 * ──────────────────────────────────────────────────────────────────── */

interface UnitDraft {
   /** persisted unit row id (undefined for freshly added found units) */
   id?: number;
   itemUnitId?: number;
   serialNumber: string;
   /** undefined = untouched; for existing units we seed to true */
   countedPresent: boolean;
   isFound: boolean;
   conditionObserved: string;
   reasonCode?: ReconciliationReasonCode | '';
}

interface LineDraft {
   id: number;
   itemId: number;
   itemName: string;
   serialized: boolean;
   expectedOnHand: number;
   /** quantity-mode counted value, as a string so the input can be cleared */
   counted: string;
   reasonCode: ReconciliationReasonCode | '';
   note: string;
   units: UnitDraft[];
}

const seedUnit = (u: ReconciliationUnit): UnitDraft => ({
   id: u.id ?? u.unitId,
   itemUnitId: u.itemUnitId,
   serialNumber: u.serialNumber ?? '',
   // existing units default to present unless explicitly marked absent
   countedPresent: u.countedPresent !== false,
   isFound: Boolean(u.isFound),
   conditionObserved: u.conditionObserved ?? DEFAULT_CONDITION,
   reasonCode: (u.reasonCode as ReconciliationReasonCode) ?? '',
});

const seedLine = (line: ReconciliationLine): LineDraft => ({
   id: line.id,
   itemId: line.itemId,
   itemName: line.itemName,
   serialized: isSerialized(line.trackingMode),
   expectedOnHand: Number(line.expectedOnHand ?? 0),
   counted: line.countedOnHand != null ? String(line.countedOnHand) : '',
   reasonCode: (line.reasonCode as ReconciliationReasonCode) ?? '',
   note: line.note ?? '',
   units: Array.isArray(line.units) ? line.units.map(seedUnit) : [],
});

/** Counted value for a serialized line = present existing units + found units. */
const serializedCounted = (line: LineDraft): number =>
   line.units.filter((u) => u.countedPresent !== false).length;

/** Numeric counted value regardless of mode (NaN when blank quantity). */
const lineCounted = (line: LineDraft): number =>
   line.serialized ? serializedCounted(line) : Number(line.counted);

const lineVariance = (line: LineDraft): number => lineCounted(line) - line.expectedOnHand;

/* ──────────────────────────────────────────────────────────────────────
 * Small presentational helpers
 * ──────────────────────────────────────────────────────────────────── */

const CARD_STYLE: React.CSSProperties = {
   background: 'var(--surface-low, rgba(255,255,255,0.02))',
   border: '1px solid var(--border-default)',
};

const VarianceTag: React.FC<{ value: number }> = ({ value }) => {
   const color = value > 0 ? 'rgb(21, 128, 61)' : value < 0 ? 'rgb(185, 28, 28)' : 'var(--text-hint)';
   const sign = value > 0 ? '+' : '';
   const display = Number.isFinite(value) ? `${sign}${value}` : '—';
   return (
      <span className="tabular-nums font-semibold" style={{ color }}>
         {display}
      </span>
   );
};

/** Bare controlled select styled to match the app surface (no Formsy). */
const inlineFieldClass =
   'w-full rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors disabled:opacity-60';
const inlineFieldStyle: React.CSSProperties = {
   background: 'var(--surface-medium)',
   border: '1px solid var(--border-default)',
   color: 'var(--text-primary)',
};

const SectionLabel: React.FC<{ children: React.ReactNode; accent?: string }> = ({ children, accent }) => (
   <span
      className="inline-flex items-center gap-1.5 text-[0.55rem] uppercase tracking-widest font-semibold px-2 py-1 rounded-md"
      style={{
         background: accent ? `${accent}14` : 'var(--surface-medium)',
         color: accent ?? 'var(--text-hint)',
         border: `1px solid ${accent ? `${accent}33` : 'var(--border-default)'}`,
      }}
   >
      {children}
   </span>
);

const formatDateTime = (value?: string): string => {
   if (!value) return '—';
   try {
      return format(parseISO(value), 'MMM d, yyyy · h:mm a');
   } catch {
      return '—';
   }
};

/* ──────────────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────────────── */

const ReconciliationDetail: NextPageWithLayout = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const { can } = usePermission();

   const {
      current,
      IsRequestingReconciliationDetail,
      IsSavingCounts,
      IsSubmittingReconciliation,
      IsApprovingReconciliation,
      IsRejectingReconciliation,
   } = useSelector((s: RootState) => s.reconciliation);

   // Current user id — used for the segregation-of-duties check. The auth
   // payload lands on the user slice as `userDetails` (see user.reducer.ts).
   const currentUserId = useSelector((s: RootState) => s.user.userDetails?.id);

   const id = useMemo(() => {
      const raw = router.query.id;
      const candidate = Array.isArray(raw) ? raw[0] : raw;
      const n = Number(candidate);
      return Number.isFinite(n) ? n : null;
   }, [router.query.id]);

   const loadDetail = useCallback(() => {
      if (id == null) return;
      dispatch(reconciliationActions.getReconciliationDetail(id) as unknown as UnknownAction);
   }, [dispatch, id]);

   useEffect(() => {
      loadDetail();
   }, [loadDetail]);

   /* ── Editable count-sheet local state (DRAFT only) ── */
   const [draft, setDraft] = useState<LineDraft[]>([]);
   const [expanded, setExpanded] = useState<Record<number, boolean>>({});

   // Seed local draft whenever the loaded session matches the route id. The
   // saga puts the refreshed session into `current` after every mutation, so
   // this re-seeds after a successful save too.
   useEffect(() => {
      if (current && current.id === id && Array.isArray(current.lines)) {
         setDraft(current.lines.map(seedLine));
      }
   }, [current, id]);

   // Belt-and-braces: also re-load detail after save/submit so the snapshot
   // (and any server-computed variance) is authoritative.
   useEffect(() => {
      const events = [
         reconciliationConstants.SAVE_COUNTS_SUCCESS,
         reconciliationConstants.SUBMIT_RECONCILIATION_SUCCESS,
         reconciliationConstants.APPROVE_RECONCILIATION_SUCCESS,
         reconciliationConstants.REJECT_RECONCILIATION_SUCCESS,
      ];
      const subs = events.map((evt) => AppEmitter.addListener(evt, () => loadDetail()));
      return () => subs.forEach((s) => s.remove());
   }, [loadDetail]);

   const state = current?.state;
   const isDraft = state === 'DRAFT';
   const isSubmitted = state === 'SUBMITTED';
   const canCount = can(Permission.RECONCILIATION_COUNT);
   const canApprove = can(Permission.RECONCILIATION_APPROVE);
   const editable = isDraft && canCount;

   /* ── Draft mutators ── */
   const patchLine = (lineId: number, patch: Partial<LineDraft>) =>
      setDraft((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l)));

   const patchUnit = (lineId: number, unitIdx: number, patch: Partial<UnitDraft>) =>
      setDraft((prev) =>
         prev.map((l) =>
            l.id === lineId
               ? { ...l, units: l.units.map((u, i) => (i === unitIdx ? { ...u, ...patch } : u)) }
               : l,
         ),
      );

   const addFoundUnit = (lineId: number) =>
      setDraft((prev) =>
         prev.map((l) =>
            l.id === lineId
               ? {
                    ...l,
                    units: [
                       ...l.units,
                       {
                          serialNumber: '',
                          countedPresent: true,
                          isFound: true,
                          conditionObserved: DEFAULT_CONDITION,
                          reasonCode: 'FOUND_RECOVERED',
                       },
                    ],
                 }
               : l,
         ),
      );

   const removeFoundUnit = (lineId: number, unitIdx: number) =>
      setDraft((prev) =>
         prev.map((l) => (l.id === lineId ? { ...l, units: l.units.filter((_, i) => i !== unitIdx) } : l)),
      );

   /* ── Validation mirroring the API submit guard (UX only) ── */
   const submitBlockedReason = useMemo<string | null>(() => {
      for (const line of draft) {
         if (line.serialized) {
            // Mirrors the API's assertSubmittable: EACH variance unit needs a reason,
            // independent of the line's NET variance. A variance unit is one that is
            // missing (countedPresent === false), found (isFound), or downgraded
            // (conditionObserved set and not 'Good'). This catches the found-offsets-
            // missing case (net 0) that the API still rejects on submit.
            const offending = line.units.filter(
               (u) =>
                  u.countedPresent === false ||
                  u.isFound ||
                  (u.conditionObserved && u.conditionObserved !== DEFAULT_CONDITION),
            );
            const missingReason = offending.some((u) => !u.reasonCode);
            if (missingReason) return `“${line.itemName}” has a variance unit without a reason.`;
         } else {
            if (line.counted === '' || !Number.isFinite(Number(line.counted))) {
               return `“${line.itemName}” has no counted quantity.`;
            }
            if (lineVariance(line) !== 0 && !line.reasonCode) {
               return `“${line.itemName}” has a variance and needs a reason.`;
            }
         }
      }
      return null;
   }, [draft]);

   /* ── Map draft → PATCH body ── */
   const buildCountPayload = (): ReconciliationLineCountInput[] =>
      draft.map((line) => {
         if (line.serialized) {
            return {
               lineId: line.id,
               units: line.units.map((u) => ({
                  unitId: u.id,
                  itemUnitId: u.itemUnitId,
                  serialNumber: u.serialNumber || undefined,
                  countedPresent: u.countedPresent,
                  isFound: u.isFound,
                  conditionObserved: u.conditionObserved || undefined,
                  reasonCode: (u.reasonCode || undefined) as ReconciliationReasonCode | undefined,
               })),
            };
         }
         return {
            lineId: line.id,
            countedOnHand: line.counted === '' ? undefined : Number(line.counted),
            reasonCode: (line.reasonCode || undefined) as ReconciliationReasonCode | undefined,
            note: line.note || undefined,
         };
      });

   const handleSave = () => {
      if (id == null) return;
      dispatch(
         reconciliationActions.saveCounts({ id, lines: buildCountPayload() }) as unknown as UnknownAction,
      );
   };

   const handleSubmit = () => {
      if (id == null) return;
      dispatch(reconciliationActions.submitReconciliation(id) as unknown as UnknownAction);
   };

   const handleApprove = () => {
      if (id == null) return;
      dispatch(reconciliationActions.approveReconciliation(id) as unknown as UnknownAction);
   };

   /* ── Reject modal ── */
   const [rejectOpen, setRejectOpen] = useState(false);
   const [rejectReason, setRejectReason] = useState('');

   useEffect(() => {
      const sub = AppEmitter.addListener(reconciliationConstants.REJECT_RECONCILIATION_SUCCESS, () => {
         setRejectOpen(false);
         setRejectReason('');
      });
      return () => sub.remove();
   }, []);

   const handleReject = () => {
      if (id == null || !rejectReason.trim()) return;
      dispatch(
         reconciliationActions.rejectReconciliation({ id, reason: rejectReason.trim() }) as unknown as UnknownAction,
      );
   };

   const saving = !!IsSavingCounts;
   const submitting = !!IsSubmittingReconciliation;
   const approving = !!IsApprovingReconciliation;
   const rejecting = !!IsRejectingReconciliation;

   // Segregation of duties: a counter cannot approve their own session. Mirrors
   // the API ForbiddenException — buttons hidden when the viewer IS the counter.
   const viewerIsCounter = (() => {
      const counterId = Number(current?.countedByUserId);
      const viewerId = Number(currentUserId);
      // Only treat them as equal when both ids are present (non-NaN) and numerically match.
      return Number.isFinite(counterId) && Number.isFinite(viewerId) && counterId === viewerId;
   })();
   const showApprovalActions = isSubmitted && canApprove && !viewerIsCounter;

   /* ── Loading / not-found ── */
   if (IsRequestingReconciliationDetail && !current) {
      return (
         <div className="flex items-center justify-center h-64">
            <p className="text-sm" style={{ color: 'var(--text-hint)' }}>
               Loading reconciliation…
            </p>
         </div>
      );
   }

   if (!current || current.id !== id) {
      return (
         <div className="flex items-center justify-center h-64">
            <p className="text-sm" style={{ color: 'var(--text-hint)' }}>
               Reconciliation not found.
            </p>
         </div>
      );
   }

   const scopeLabel =
      current.scopeType === 'DEPARTMENT'
         ? current.departmentId != null
            ? `Department #${current.departmentId}`
            : 'Department'
         : current.scopeType === 'CATEGORY'
           ? current.categoryId != null
              ? `Category #${current.categoryId}`
              : 'Category'
           : current.scopeType ?? '—';

   return (
      <div className="max-w-6xl mx-auto space-y-5">
         <PageHeader />

         {/* ── Header card ── */}
         <div className="rounded-2xl p-6" style={CARD_STYLE}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
               <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                     <SectionLabel>Reconciliation · #{current.id}</SectionLabel>
                     <StateBadge state={current.state} />
                  </div>
                  <h1
                     className="text-2xl md:text-3xl font-bold tracking-tight truncate"
                     style={{ color: 'var(--text-primary)' }}
                  >
                     {current.reference}
                  </h1>
                  <p
                     className="text-xs md:text-sm mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1"
                     style={{ color: 'var(--text-hint)' }}
                  >
                     <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {scopeLabel}
                     </span>
                     <span>·</span>
                     <span>Counted by {current.createdBy || '—'}</span>
                  </p>
               </div>
            </div>
         </div>

         {/* ── POSTED / REJECTED banners ── */}
         {state === 'POSTED' && (
            <div
               className="rounded-xl p-4 text-sm"
               style={{
                  background: 'rgba(22, 163, 74, 0.1)',
                  border: '1px solid rgba(22, 163, 74, 0.25)',
                  color: 'rgb(21, 128, 61)',
               }}
            >
               <span className="font-semibold">Posted.</span> This reconciliation was approved and applied to
               inventory.
               {current.approvedAt ? <span> Approved at {formatDateTime(current.approvedAt)}.</span> : null}
            </div>
         )}
         {state === 'REJECTED' && (
            <div
               className="rounded-xl p-4 text-sm"
               style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: 'rgb(185, 28, 28)',
               }}
            >
               <span className="font-semibold">Rejected.</span>{' '}
               {current.rejectReason ? current.rejectReason : 'No reason was recorded.'}
            </div>
         )}

         {/* ── Count sheet ── */}
         <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
            <div className="flex items-center justify-between mb-4">
               <SectionLabel>Count Sheet</SectionLabel>
               {editable && (
                  <span className="text-[0.65rem]" style={{ color: 'var(--text-hint)' }}>
                     {draft.length} line{draft.length === 1 ? '' : 's'}
                  </span>
               )}
            </div>

            <div className="space-y-3">
               {draft.map((line) => {
                  const variance = lineVariance(line);
                  const counted = lineCounted(line);
                  return (
                     <div
                        key={line.id}
                        className="rounded-xl p-4"
                        style={{ background: 'var(--surface-medium)', border: '1px solid var(--border-default)' }}
                     >
                        {/* Line summary row */}
                        <div className="grid grid-cols-12 gap-3 items-end">
                           <div className="col-span-12 md:col-span-4 min-w-0">
                              <div
                                 className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 Item
                              </div>
                              <div
                                 className="text-sm font-medium truncate"
                                 style={{ color: 'var(--text-primary)' }}
                                 title={line.itemName}
                              >
                                 {line.itemName}
                                 {line.serialized && (
                                    <span className="ml-2 text-[0.6rem]" style={{ color: 'var(--text-hint)' }}>
                                       serialized
                                    </span>
                                 )}
                              </div>
                           </div>

                           <div className="col-span-4 md:col-span-2">
                              <div
                                 className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 Expected
                              </div>
                              <div className="text-sm tabular-nums" style={{ color: 'var(--text-primary)' }}>
                                 {line.expectedOnHand}
                              </div>
                           </div>

                           <div className="col-span-4 md:col-span-2">
                              <div
                                 className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 Counted
                              </div>
                              {editable && !line.serialized ? (
                                 <input
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    aria-label={`Counted quantity for ${line.itemName}`}
                                    className={inlineFieldClass}
                                    style={inlineFieldStyle}
                                    value={line.counted}
                                    onChange={(e) => patchLine(line.id, { counted: e.target.value })}
                                 />
                              ) : (
                                 <div className="text-sm tabular-nums" style={{ color: 'var(--text-primary)' }}>
                                    {Number.isFinite(counted) ? counted : '—'}
                                 </div>
                              )}
                           </div>

                           <div className="col-span-4 md:col-span-2">
                              <div
                                 className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 Variance
                              </div>
                              <div className="text-sm">
                                 <VarianceTag value={variance} />
                              </div>
                           </div>

                           {/* Serialized lines: per-unit toggle */}
                           {line.serialized && (
                              <div className="col-span-12 md:col-span-2 md:text-right">
                                 <button
                                    type="button"
                                    onClick={() => setExpanded((p) => ({ ...p, [line.id]: !p[line.id] }))}
                                    className="text-xs font-semibold cursor-pointer"
                                    style={{ color: 'var(--color-secondary)' }}
                                 >
                                    {expanded[line.id] ? 'Hide units' : `Units (${line.units.length})`}
                                 </button>
                              </div>
                           )}
                        </div>

                        {/* Quantity line: reason (variance≠0) + note */}
                        {!line.serialized && (
                           <div className="grid grid-cols-12 gap-3 mt-3">
                              {variance !== 0 && (
                                 <div className="col-span-12 md:col-span-4">
                                    <div
                                       className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1"
                                       style={{ color: 'var(--text-hint)' }}
                                    >
                                       Reason
                                    </div>
                                    {editable ? (
                                       <select
                                          aria-label={`Variance reason for ${line.itemName}`}
                                          className={inlineFieldClass}
                                          style={inlineFieldStyle}
                                          value={line.reasonCode}
                                          onChange={(e) =>
                                             patchLine(line.id, {
                                                reasonCode: e.target.value as ReconciliationReasonCode | '',
                                             })
                                          }
                                       >
                                          <option value="">Select a reason…</option>
                                          {REASON_OPTIONS.map((r) => (
                                             <option key={r.value} value={r.value}>
                                                {r.label}
                                             </option>
                                          ))}
                                       </select>
                                    ) : (
                                       <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                          {line.reasonCode ? REASON_LABEL[line.reasonCode] : '—'}
                                       </div>
                                    )}
                                 </div>
                              )}
                              <div className={variance !== 0 ? 'col-span-12 md:col-span-8' : 'col-span-12'}>
                                 <div
                                    className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1"
                                    style={{ color: 'var(--text-hint)' }}
                                 >
                                    Note
                                 </div>
                                 {editable ? (
                                    <input
                                       type="text"
                                       aria-label={`Note for ${line.itemName}`}
                                       className={inlineFieldClass}
                                       style={inlineFieldStyle}
                                       value={line.note}
                                       onChange={(e) => patchLine(line.id, { note: e.target.value })}
                                       placeholder="Optional"
                                    />
                                 ) : (
                                    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                       {line.note || '—'}
                                    </div>
                                 )}
                              </div>
                           </div>
                        )}

                        {/* Serialized line: per-unit checklist */}
                        {line.serialized && (expanded[line.id] || !editable) && (
                           <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
                              <div className="space-y-2">
                                 {line.units.length === 0 && (
                                    <div className="text-xs" style={{ color: 'var(--text-hint)' }}>
                                       No units on this line.
                                    </div>
                                 )}
                                 {line.units.map((unit, idx) => {
                                    const present = unit.countedPresent !== false;
                                    const needsReason = !present || unit.conditionObserved !== DEFAULT_CONDITION;
                                    return (
                                       <div
                                          key={unit.id ?? `found-${idx}`}
                                          className="grid grid-cols-12 gap-2 items-center rounded-lg px-3 py-2"
                                          style={{
                                             background: 'var(--surface-low)',
                                             border: '1px solid var(--border-default)',
                                          }}
                                       >
                                          <div className="col-span-12 md:col-span-3 min-w-0">
                                             {editable && unit.isFound && !unit.id ? (
                                                <input
                                                   type="text"
                                                   aria-label="Found unit serial number"
                                                   className={inlineFieldClass}
                                                   style={inlineFieldStyle}
                                                   value={unit.serialNumber}
                                                   placeholder="Serial number"
                                                   onChange={(e) =>
                                                      patchUnit(line.id, idx, { serialNumber: e.target.value })
                                                   }
                                                />
                                             ) : (
                                                <div
                                                   className="text-sm font-mono truncate"
                                                   style={{ color: 'var(--text-primary)' }}
                                                   title={unit.serialNumber}
                                                >
                                                   {unit.serialNumber || '—'}
                                                   {unit.isFound && (
                                                      <span
                                                         className="ml-2 text-[0.55rem] font-semibold uppercase"
                                                         style={{ color: 'rgb(21, 128, 61)' }}
                                                      >
                                                         found
                                                      </span>
                                                   )}
                                                </div>
                                             )}
                                          </div>

                                          {/* Present / Missing toggle */}
                                          <div className="col-span-6 md:col-span-3">
                                             {editable && !unit.isFound ? (
                                                <div className="inline-flex rounded-md overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
                                                   <button
                                                      type="button"
                                                      onClick={() => patchUnit(line.id, idx, { countedPresent: true })}
                                                      className="px-2.5 py-1 text-xs font-semibold cursor-pointer"
                                                      style={{
                                                         background: present ? 'rgba(22,163,74,0.16)' : 'transparent',
                                                         color: present ? 'rgb(21,128,61)' : 'var(--text-hint)',
                                                      }}
                                                   >
                                                      Present
                                                   </button>
                                                   <button
                                                      type="button"
                                                      onClick={() => patchUnit(line.id, idx, { countedPresent: false })}
                                                      className="px-2.5 py-1 text-xs font-semibold cursor-pointer"
                                                      style={{
                                                         background: !present ? 'rgba(239,68,68,0.16)' : 'transparent',
                                                         color: !present ? 'rgb(185,28,28)' : 'var(--text-hint)',
                                                      }}
                                                   >
                                                      Missing
                                                   </button>
                                                </div>
                                             ) : (
                                                <span
                                                   className="text-xs font-semibold"
                                                   style={{ color: present ? 'rgb(21,128,61)' : 'rgb(185,28,28)' }}
                                                >
                                                   {present ? 'Present' : 'Missing'}
                                                </span>
                                             )}
                                          </div>

                                          {/* Condition */}
                                          <div className="col-span-6 md:col-span-3">
                                             {editable ? (
                                                <select
                                                   aria-label="Observed condition"
                                                   className={inlineFieldClass}
                                                   style={inlineFieldStyle}
                                                   value={unit.conditionObserved}
                                                   onChange={(e) =>
                                                      patchUnit(line.id, idx, { conditionObserved: e.target.value })
                                                   }
                                                >
                                                   {CONDITION_OPTIONS.map((c) => (
                                                      <option key={c.value} value={c.value}>
                                                         {c.label}
                                                      </option>
                                                   ))}
                                                </select>
                                             ) : (
                                                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                   {unit.conditionObserved || '—'}
                                                </span>
                                             )}
                                          </div>

                                          {/* Reason (when missing or condition ≠ Good) + remove for found */}
                                          <div className="col-span-12 md:col-span-3 flex items-center gap-2">
                                             {needsReason ? (
                                                editable ? (
                                                   <select
                                                      aria-label="Unit reason"
                                                      className={inlineFieldClass}
                                                      style={inlineFieldStyle}
                                                      value={unit.reasonCode ?? ''}
                                                      onChange={(e) =>
                                                         patchUnit(line.id, idx, {
                                                            reasonCode: e.target.value as ReconciliationReasonCode | '',
                                                         })
                                                      }
                                                   >
                                                      <option value="">Reason…</option>
                                                      {REASON_OPTIONS.map((r) => (
                                                         <option key={r.value} value={r.value}>
                                                            {r.label}
                                                         </option>
                                                      ))}
                                                   </select>
                                                ) : (
                                                   <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                      {unit.reasonCode ? REASON_LABEL[unit.reasonCode] : '—'}
                                                   </span>
                                                )
                                             ) : (
                                                <span className="text-xs" style={{ color: 'var(--text-hint)' }}>
                                                   —
                                                </span>
                                             )}
                                             {editable && unit.isFound && !unit.id && (
                                                <button
                                                   type="button"
                                                   onClick={() => removeFoundUnit(line.id, idx)}
                                                   className="text-xs cursor-pointer shrink-0"
                                                   style={{ color: 'rgb(185,28,28)' }}
                                                   aria-label="Remove found unit"
                                                >
                                                   Remove
                                                </button>
                                             )}
                                          </div>
                                       </div>
                                    );
                                 })}
                              </div>

                              {editable && (
                                 <button
                                    type="button"
                                    onClick={() => addFoundUnit(line.id)}
                                    className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                                    style={{
                                       color: 'var(--color-secondary)',
                                       border: '1px solid var(--border-strong)',
                                    }}
                                 >
                                    + Add found unit
                                 </button>
                              )}
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>

            {/* ── DRAFT actions ── */}
            {editable && (
               <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                     type="button"
                     onClick={handleSave}
                     disabled={saving}
                     className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors disabled:opacity-60"
                     style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
                  >
                     {saving ? 'Saving…' : 'Save counts'}
                  </button>
                  <button
                     type="button"
                     onClick={handleSubmit}
                     disabled={submitting || !!submitBlockedReason}
                     title={submitBlockedReason ?? undefined}
                     className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors disabled:opacity-60"
                     style={{ background: 'var(--color-secondary)', color: '#fff' }}
                  >
                     {submitting ? 'Submitting…' : 'Submit for approval'}
                  </button>
                  {submitBlockedReason && (
                     <span className="text-xs" style={{ color: 'var(--text-hint)' }}>
                        {submitBlockedReason}
                     </span>
                  )}
               </div>
            )}

            {/* DRAFT but viewer cannot count */}
            {isDraft && !canCount && (
               <div className="mt-4 text-xs" style={{ color: 'var(--text-hint)' }}>
                  This count is still a draft. You do not have permission to record counts.
               </div>
            )}
         </div>

         {/* ── Approve / reject actions (SUBMITTED) ── */}
         {isSubmitted && (
            <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                     <SectionLabel accent="var(--color-secondary)">Pending Approval</SectionLabel>
                     <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                        {showApprovalActions
                           ? 'Review the variances above, then approve to post or reject with a reason.'
                           : viewerIsCounter
                             ? 'You recorded this count, so you cannot approve it (segregation of duties).'
                             : 'Awaiting approval by an authorised reviewer.'}
                     </p>
                  </div>
                  {showApprovalActions && (
                     <div className="flex items-center gap-2 shrink-0">
                        <button
                           type="button"
                           onClick={() => setRejectOpen(true)}
                           disabled={rejecting || approving}
                           className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors disabled:opacity-60"
                           style={{ color: 'rgb(185,28,28)', border: '1px solid rgba(239,68,68,0.4)' }}
                        >
                           Reject
                        </button>
                        <button
                           type="button"
                           onClick={handleApprove}
                           disabled={approving || rejecting}
                           className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors disabled:opacity-60"
                           style={{ background: 'rgb(21,128,61)', color: '#fff' }}
                        >
                           {approving ? 'Approving…' : 'Approve & post'}
                        </button>
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* ── Reject reason modal ── */}
         {rejectOpen && (
            <div
               className="fixed inset-0 z-50 flex items-center justify-center p-4"
               style={{ background: 'rgba(0,0,0,0.45)' }}
               role="dialog"
               aria-modal="true"
            >
               <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--surface-low)', border: '1px solid var(--border-strong)' }}>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                     Reject reconciliation
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-hint)' }}>
                     Provide a reason. The counter will see this on the session.
                  </p>
                  <textarea
                     className="mt-3 w-full rounded-md px-3 py-2 text-sm outline-none"
                     style={inlineFieldStyle}
                     rows={4}
                     aria-label="Rejection reason"
                     value={rejectReason}
                     onChange={(e) => setRejectReason(e.target.value)}
                     placeholder="e.g. Counts don't match the physical audit…"
                  />
                  <div className="mt-4 flex items-center justify-end gap-2">
                     <button
                        type="button"
                        onClick={() => setRejectOpen(false)}
                        disabled={rejecting}
                        className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-60"
                        style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
                     >
                        Cancel
                     </button>
                     <button
                        type="button"
                        onClick={handleReject}
                        disabled={rejecting || !rejectReason.trim()}
                        className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-60"
                        style={{ background: 'rgb(185,28,28)', color: '#fff' }}
                     >
                        {rejecting ? 'Rejecting…' : 'Confirm reject'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

ReconciliationDetail.getLayout = (page) => (
   <PrivateRoute permissions={[Permission.RECONCILIATION_READ]}>
      <Layout title="Reconciliation">{page}</Layout>
   </PrivateRoute>
);

export default ReconciliationDetail;
