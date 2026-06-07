import { reconciliationConstants } from '@/constants';
import {
  OpenReconciliationPayload,
  RejectReconciliationPayload,
  ReconciliationListQuery,
  SaveReconciliationCountsPayload,
} from '@/types';

export interface GetReconciliationsAction {
  type: typeof reconciliationConstants.GET_RECONCILIATIONS;
  data?: ReconciliationListQuery;
}

export interface OpenReconciliationAction {
  type: typeof reconciliationConstants.OPEN_RECONCILIATION;
  data: OpenReconciliationPayload;
}

export interface GetReconciliationDetailAction {
  type: typeof reconciliationConstants.GET_RECONCILIATION_DETAIL;
  data: { id: number };
}

export interface SaveCountsAction {
  type: typeof reconciliationConstants.SAVE_COUNTS;
  data: SaveReconciliationCountsPayload;
}

export interface SubmitReconciliationAction {
  type: typeof reconciliationConstants.SUBMIT_RECONCILIATION;
  data: { id: number };
}

export interface ApproveReconciliationAction {
  type: typeof reconciliationConstants.APPROVE_RECONCILIATION;
  data: { id: number };
}

export interface RejectReconciliationAction {
  type: typeof reconciliationConstants.REJECT_RECONCILIATION;
  data: RejectReconciliationPayload;
}

export interface GetReconciliationReportAction {
  type: typeof reconciliationConstants.GET_RECONCILIATION_REPORT;
}

const getReconciliations = (
  data?: ReconciliationListQuery
): GetReconciliationsAction => ({
  type: reconciliationConstants.GET_RECONCILIATIONS,
  data,
});

const openReconciliation = (
  data: OpenReconciliationPayload
): OpenReconciliationAction => ({
  type: reconciliationConstants.OPEN_RECONCILIATION,
  data,
});

const getReconciliationDetail = (
  id: number
): GetReconciliationDetailAction => ({
  type: reconciliationConstants.GET_RECONCILIATION_DETAIL,
  data: { id },
});

const saveCounts = (
  data: SaveReconciliationCountsPayload
): SaveCountsAction => ({
  type: reconciliationConstants.SAVE_COUNTS,
  data,
});

const submitReconciliation = (id: number): SubmitReconciliationAction => ({
  type: reconciliationConstants.SUBMIT_RECONCILIATION,
  data: { id },
});

const approveReconciliation = (id: number): ApproveReconciliationAction => ({
  type: reconciliationConstants.APPROVE_RECONCILIATION,
  data: { id },
});

const rejectReconciliation = (
  data: RejectReconciliationPayload
): RejectReconciliationAction => ({
  type: reconciliationConstants.REJECT_RECONCILIATION,
  data,
});

const getReconciliationReport = (): GetReconciliationReportAction => ({
  type: reconciliationConstants.GET_RECONCILIATION_REPORT,
});

export const reconciliationActions = {
  getReconciliations,
  openReconciliation,
  getReconciliationDetail,
  saveCounts,
  submitReconciliation,
  approveReconciliation,
  rejectReconciliation,
  getReconciliationReport,
};
