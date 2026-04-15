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

export const reportActions = {
  sendReport,
  getReports,
  searchReport,
};
