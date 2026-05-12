import { combineReducers } from 'redux';
import { reportConstants } from '@/constants';
import { Action, LoadingState, Report, ReportAction } from '@/types';

type ReportsListState = Report[];

interface AllReportsAction extends Action {
  reports: {
    items: Report[];
    links: { [key: string]: string | number | null };
    meta: {
      currentPage: number;
      itemCount: number;
      itemsPerPage: number;
      totalItems: number;
      totalPages: number;
    };
  };
  report: Report[];
}

const IsCreatingReport = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case reportConstants.REQUEST_SEND_REPORT:
      return true;
    case reportConstants.SEND_REPORT_SUCCESS:
    case reportConstants.SEND_REPORT_ERROR:
      return false;
    default:
      return state;
  }
};

const IsRequestingReports = (
  state: LoadingState = false,
  action: ReportAction
): LoadingState => {
  switch (action.type) {
    case reportConstants.REQUEST_GET_REPORTS:
      return true;
    case reportConstants.GET_REPORTS_SUCCESS:
    case reportConstants.GET_REPORTS_ERROR:
      return false;
    default:
      return state;
  }
};

const IsSearchingReport = (
  state: LoadingState = false,
  action: ReportAction
): LoadingState => {
  switch (action.type) {
    case reportConstants.REQUEST_SEARCH_REPORT:
      return true;
    case reportConstants.SEARCH_REPORT_SUCCESS:
    case reportConstants.SEARCH_REPORT_ERROR:
      return false;
    default:
      return state;
  }
};

const allReportsList = (
  state: ReportsListState = [],
  action: AllReportsAction
): ReportsListState => {
  switch (action.type) {
    case reportConstants.GET_REPORTS_SUCCESS:
      return action.reports?.items ?? state;
    case reportConstants.SEARCH_REPORT_SUCCESS:
      return action.report ?? state;
    default:
      return state;
  }
};

interface PaginationMeta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

interface PaginationAction {
  type: string;
  meta?: PaginationMeta | null;
}

const pagination = (
  state: { meta: PaginationMeta | null } = { meta: null },
  action: PaginationAction,
): { meta: PaginationMeta | null } => {
  switch (action.type) {
    case reportConstants.GET_REPORTS_SUCCESS:
      return { meta: action.meta ?? null };
    default:
      return state;
  }
};

// Workflow Rules Module (Phase 4) — server-side complaint action gates.
// `null` is the load-bearing sentinel: the hook treats it as "no server
// verdict yet, fall back to local computation". An empty array means
// "engine evaluated and returned no available actions" (e.g. terminal
// states like Resolved) — semantically different from "haven't asked
// yet".
type ServerActionRow = {
  action: string;
  toState?: string;
  transitionId?: number;
};
type ServerActionsState = ServerActionRow[] | null;

interface ServerActionsAction extends Action {
  actions?: ServerActionRow[];
}

const serverActions = (
  state: ServerActionsState = null,
  action: ServerActionsAction,
): ServerActionsState => {
  switch (action.type) {
    case reportConstants.GET_REPORT_ACTIONS_SUCCESS:
      // Server has spoken — store the array verbatim (may be empty).
      return action.actions ?? [];
    case reportConstants.GET_REPORT_ACTIONS_FAILURE:
    case reportConstants.RESET_REPORT_ACTIONS:
    // Reset when a new detail-page load starts so the hook falls back
    // to local computation until the fresh fetch lands.
    case reportConstants.REQUEST_GET_REPORT_ACTIONS:
      return null;
    default:
      return state;
  }
};

export interface RootState {
  IsCreatingReport: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  IsRequestingReports: (
    state: LoadingState | undefined,
    action: ReportAction
  ) => LoadingState;
  IsSearchingReport: (
    state: LoadingState | undefined,
    action: ReportAction
  ) => LoadingState;
  allReportsList: (
    state: ReportsListState | undefined,
    action: AllReportsAction
  ) => ReportsListState;
  pagination: (
    state: { meta: PaginationMeta | null } | undefined,
    action: PaginationAction,
  ) => { meta: PaginationMeta | null };
  serverActions: (
    state: ServerActionsState | undefined,
    action: ServerActionsAction,
  ) => ServerActionsState;
}

const rootReducer = combineReducers<RootState>({
  IsCreatingReport,
  IsRequestingReports,
  IsSearchingReport,
  allReportsList,
  pagination,
  serverActions,
});

export default rootReducer;
