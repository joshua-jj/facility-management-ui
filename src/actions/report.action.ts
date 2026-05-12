import { ReportForm } from '@/types';
import { reportConstants } from '@/constants';

interface SendReportAction {
  type: typeof reportConstants.SEND_REPORT;
  data: ReportForm;
}

export interface GetReportsAction {
  type: typeof reportConstants.GET_REPORTS;
  data?: {
    page?: number;
    limit?: number;
    search?: string;
    complaintStatus?: string;
    attendedTo?: boolean;
  };
}

export interface SearchReportAction {
  type: typeof reportConstants.SEARCH_REPORT;
  data: { text: string };
}

// Workflow Rules Module (Phase 4) — fetch the engine's verdict on
// which actions the current viewer can fire on this complaint. Same
// shape as request.action.ts::GetRequestActionsAction.
export interface GetReportActionsAction {
  type: typeof reportConstants.GET_REPORT_ACTIONS;
  data: { id: number };
}

export interface ResetReportActionsAction {
  type: typeof reportConstants.RESET_REPORT_ACTIONS;
}

const sendReport = (data: ReportForm): SendReportAction => ({
  type: reportConstants.SEND_REPORT,
  data,
});

const getReports = (data?: GetReportsAction['data']): GetReportsAction => ({
  type: reportConstants.GET_REPORTS,
  data,
});

const searchReport = (data: { text: string }): SearchReportAction => ({
  type: reportConstants.SEARCH_REPORT,
  data,
});

const getReportActions = (data: { id: number }): GetReportActionsAction => ({
  type: reportConstants.GET_REPORT_ACTIONS,
  data,
});

const resetReportActions = (): ResetReportActionsAction => ({
  type: reportConstants.RESET_REPORT_ACTIONS,
});

export const reportActions = {
  sendReport,
  getReports,
  searchReport,
  getReportActions,
  resetReportActions,
};
