import { combineReducers } from 'redux';
import { reconciliationConstants } from '@/constants';
import {
  Action,
  LoadingState,
  PaginationState,
  ReconciliationReport,
  ReconciliationSession,
} from '@/types';
import { updateObject } from '@/utilities/reducerUtility';

type AllReconciliationsState = ReconciliationSession[];

interface ReconciliationAction extends Action {
  data?:
    | ReconciliationSession
    | ReconciliationSession[]
    | ReconciliationReport
    | null;
  links?: { [key: string]: string | number | null };
  meta?: {
    currentPage: number;
    itemCount: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

const IsRequestingReconciliations = (
  state: LoadingState = false,
  action: ReconciliationAction
): LoadingState => {
  switch (action.type) {
    case reconciliationConstants.REQUEST_GET_RECONCILIATIONS:
      return true;
    case reconciliationConstants.GET_RECONCILIATIONS_SUCCESS:
    case reconciliationConstants.GET_RECONCILIATIONS_ERROR:
      return false;
    default:
      return state;
  }
};

const IsOpeningReconciliation = (
  state: LoadingState = false,
  action: ReconciliationAction
): LoadingState => {
  switch (action.type) {
    case reconciliationConstants.REQUEST_OPEN_RECONCILIATION:
      return true;
    case reconciliationConstants.OPEN_RECONCILIATION_SUCCESS:
    case reconciliationConstants.OPEN_RECONCILIATION_ERROR:
      return false;
    default:
      return state;
  }
};

const IsRequestingReconciliationDetail = (
  state: LoadingState = false,
  action: ReconciliationAction
): LoadingState => {
  switch (action.type) {
    case reconciliationConstants.REQUEST_GET_RECONCILIATION_DETAIL:
      return true;
    case reconciliationConstants.GET_RECONCILIATION_DETAIL_SUCCESS:
    case reconciliationConstants.GET_RECONCILIATION_DETAIL_ERROR:
      return false;
    default:
      return state;
  }
};

const IsSavingCounts = (
  state: LoadingState = false,
  action: ReconciliationAction
): LoadingState => {
  switch (action.type) {
    case reconciliationConstants.REQUEST_SAVE_COUNTS:
      return true;
    case reconciliationConstants.SAVE_COUNTS_SUCCESS:
    case reconciliationConstants.SAVE_COUNTS_ERROR:
      return false;
    default:
      return state;
  }
};

const IsSubmittingReconciliation = (
  state: LoadingState = false,
  action: ReconciliationAction
): LoadingState => {
  switch (action.type) {
    case reconciliationConstants.REQUEST_SUBMIT_RECONCILIATION:
      return true;
    case reconciliationConstants.SUBMIT_RECONCILIATION_SUCCESS:
    case reconciliationConstants.SUBMIT_RECONCILIATION_ERROR:
      return false;
    default:
      return state;
  }
};

const IsApprovingReconciliation = (
  state: LoadingState = false,
  action: ReconciliationAction
): LoadingState => {
  switch (action.type) {
    case reconciliationConstants.REQUEST_APPROVE_RECONCILIATION:
      return true;
    case reconciliationConstants.APPROVE_RECONCILIATION_SUCCESS:
    case reconciliationConstants.APPROVE_RECONCILIATION_ERROR:
      return false;
    default:
      return state;
  }
};

const IsRejectingReconciliation = (
  state: LoadingState = false,
  action: ReconciliationAction
): LoadingState => {
  switch (action.type) {
    case reconciliationConstants.REQUEST_REJECT_RECONCILIATION:
      return true;
    case reconciliationConstants.REJECT_RECONCILIATION_SUCCESS:
    case reconciliationConstants.REJECT_RECONCILIATION_ERROR:
      return false;
    default:
      return state;
  }
};

const IsRequestingReconciliationReport = (
  state: LoadingState = false,
  action: ReconciliationAction
): LoadingState => {
  switch (action.type) {
    case reconciliationConstants.REQUEST_GET_RECONCILIATION_REPORT:
      return true;
    case reconciliationConstants.GET_RECONCILIATION_REPORT_SUCCESS:
    case reconciliationConstants.GET_RECONCILIATION_REPORT_ERROR:
      return false;
    default:
      return state;
  }
};

const allReconciliationsList = (
  state: AllReconciliationsState = [],
  action: ReconciliationAction
): AllReconciliationsState => {
  switch (action.type) {
    case reconciliationConstants.GET_RECONCILIATIONS_SUCCESS:
      return (action.data as ReconciliationSession[]) ?? state;
    default:
      return state;
  }
};

const current = (
  state: ReconciliationSession | null = null,
  action: ReconciliationAction
): ReconciliationSession | null => {
  switch (action.type) {
    case reconciliationConstants.GET_RECONCILIATION_DETAIL_SUCCESS:
    case reconciliationConstants.OPEN_RECONCILIATION_SUCCESS:
    case reconciliationConstants.SAVE_COUNTS_SUCCESS:
    case reconciliationConstants.SUBMIT_RECONCILIATION_SUCCESS:
    case reconciliationConstants.APPROVE_RECONCILIATION_SUCCESS:
    case reconciliationConstants.REJECT_RECONCILIATION_SUCCESS:
      return (action.data as ReconciliationSession) ?? state;
    default:
      return state;
  }
};

const report = (
  state: ReconciliationReport | null = null,
  action: ReconciliationAction
): ReconciliationReport | null => {
  switch (action.type) {
    case reconciliationConstants.GET_RECONCILIATION_REPORT_SUCCESS:
      return (action.data as ReconciliationReport) ?? state;
    default:
      return state;
  }
};

const pagination = (
  state: PaginationState = {
    links: {
      first: null,
      last: null,
      next: null,
      previous: null,
    },
    meta: {
      currentPage: 0,
      itemCount: 0,
      itemsPerPage: 0,
      totalItems: 0,
      totalPages: 0,
    },
  },
  action: ReconciliationAction
): PaginationState => {
  switch (action.type) {
    case reconciliationConstants.GET_RECONCILIATIONS_SUCCESS: {
      if (!action.links && !action.meta) return state;
      const result = {
        links: action.links ?? state.links,
        meta: action.meta ?? state.meta,
      };
      return updateObject(state, result);
    }
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  IsRequestingReconciliations,
  IsOpeningReconciliation,
  IsRequestingReconciliationDetail,
  IsSavingCounts,
  IsSubmittingReconciliation,
  IsApprovingReconciliation,
  IsRejectingReconciliation,
  IsRequestingReconciliationReport,
  allReconciliationsList,
  current,
  report,
  pagination,
});

export default rootReducer;
