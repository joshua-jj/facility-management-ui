// ─── String-literal unions (mirror the API enums) ────────────────────
export type ReconciliationState = 'DRAFT' | 'SUBMITTED' | 'POSTED' | 'REJECTED';

export type ReconciliationScopeType = 'DEPARTMENT' | 'CATEGORY';

export type ReconciliationReasonCode =
  | 'LOST_STOLEN'
  | 'DAMAGED'
  | 'FOUND_RECOVERED'
  | 'MISCOUNT_DATA_ERROR';

export type ReconciliationTrackingMode = 'QUANTITY' | 'SERIAL';

// ─── Domain shapes ───────────────────────────────────────────────────
export interface ReconciliationUnit {
  id?: number;
  unitId?: number;
  itemUnitId?: number;
  serialNumber?: string;
  countedPresent?: boolean;
  isFound?: boolean;
  conditionObserved?: string;
  reasonCode?: ReconciliationReasonCode;
  note?: string;
}

export interface ReconciliationLine {
  id: number;
  itemId: number;
  itemName: string;
  trackingMode: ReconciliationTrackingMode | string;
  expectedOnHand: number;
  actualQuantitySnapshot: number;
  countedOnHand?: number;
  variance: number;
  reasonCode?: ReconciliationReasonCode;
  note?: string;
  units?: ReconciliationUnit[];
}

export interface ReconciliationSession {
  id: number;
  reference: string;
  scopeType: ReconciliationScopeType;
  departmentId?: number;
  categoryId?: number;
  state: ReconciliationState;
  countedByUserId?: number;
  approvedByUserId?: number;
  submittedAt?: string;
  approvedAt?: string;
  rejectReason?: string;
  note?: string;
  createdBy: string;
  createdAt: string;
  lines: ReconciliationLine[];
}

// ─── saveCounts payload shapes ───────────────────────────────────────
export interface ReconciliationUnitCountInput {
  unitId?: number;
  itemUnitId?: number;
  serialNumber?: string;
  countedPresent?: boolean;
  isFound?: boolean;
  conditionObserved?: string;
  reasonCode?: ReconciliationReasonCode;
}

export interface ReconciliationLineCountInput {
  lineId: number;
  countedOnHand?: number;
  reasonCode?: ReconciliationReasonCode;
  note?: string;
  units?: ReconciliationUnitCountInput[];
}

export interface OpenReconciliationPayload {
  scopeType: ReconciliationScopeType;
  departmentId?: number;
  categoryId?: number;
  note?: string;
}

export interface SaveReconciliationCountsPayload {
  id: number;
  lines: ReconciliationLineCountInput[];
}

export interface RejectReconciliationPayload {
  id: number;
  reason: string;
}

export interface ReconciliationListQuery {
  page?: number;
  limit?: number;
  state?: ReconciliationState;
}

export interface ReconciliationReport {
  [key: string]: unknown;
}

// ─── Redux slice shape ───────────────────────────────────────────────
export interface ReconciliationReduxState {
  allReconciliationsList: ReconciliationSession[];
  current: ReconciliationSession | null;
  report: ReconciliationReport | null;
  pagination: PaginationState;
  IsRequestingReconciliations: LoadingState;
  IsOpeningReconciliation: LoadingState;
  IsRequestingReconciliationDetail: LoadingState;
  IsSavingCounts: LoadingState;
  IsSubmittingReconciliation: LoadingState;
  IsApprovingReconciliation: LoadingState;
  IsRejectingReconciliation: LoadingState;
  IsRequestingReconciliationReport: LoadingState;
}

// ─── Constants contract ──────────────────────────────────────────────
export interface ReconciliationConstants {
  GET_RECONCILIATIONS: string;
  REQUEST_GET_RECONCILIATIONS: string;
  GET_RECONCILIATIONS_SUCCESS: string;
  GET_RECONCILIATIONS_ERROR: string;

  OPEN_RECONCILIATION: string;
  REQUEST_OPEN_RECONCILIATION: string;
  OPEN_RECONCILIATION_SUCCESS: string;
  OPEN_RECONCILIATION_ERROR: string;

  GET_RECONCILIATION_DETAIL: string;
  REQUEST_GET_RECONCILIATION_DETAIL: string;
  GET_RECONCILIATION_DETAIL_SUCCESS: string;
  GET_RECONCILIATION_DETAIL_ERROR: string;

  SAVE_COUNTS: string;
  REQUEST_SAVE_COUNTS: string;
  SAVE_COUNTS_SUCCESS: string;
  SAVE_COUNTS_ERROR: string;

  SUBMIT_RECONCILIATION: string;
  REQUEST_SUBMIT_RECONCILIATION: string;
  SUBMIT_RECONCILIATION_SUCCESS: string;
  SUBMIT_RECONCILIATION_ERROR: string;

  APPROVE_RECONCILIATION: string;
  REQUEST_APPROVE_RECONCILIATION: string;
  APPROVE_RECONCILIATION_SUCCESS: string;
  APPROVE_RECONCILIATION_ERROR: string;

  REJECT_RECONCILIATION: string;
  REQUEST_REJECT_RECONCILIATION: string;
  REJECT_RECONCILIATION_SUCCESS: string;
  REJECT_RECONCILIATION_ERROR: string;

  GET_RECONCILIATION_REPORT: string;
  REQUEST_GET_RECONCILIATION_REPORT: string;
  GET_RECONCILIATION_REPORT_SUCCESS: string;
  GET_RECONCILIATION_REPORT_ERROR: string;

  RECONCILIATION_URI: string;
}
