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

// const pagination = (
//   state: PaginationState = null,
//   action: Action
// ): PaginationState => {
//   switch (action.type) {
//     case eventConstants.GET_ALL_EVENTS_SUCCESS:
//       return action.pagination ?? state;
//     default:
//       return state;
//   }
// };

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
  //   pagination: PaginationState;
}

const rootReducer = combineReducers<RootState>({
  IsCreatingReport,
  IsRequestingReports,
  IsSearchingReport,
  allReportsList,
  //   pagination,
});

export default rootReducer;
