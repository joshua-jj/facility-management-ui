export interface ReportConstants {
  REQUEST_SEND_REPORT: string;
  SEND_REPORT_SUCCESS: string;
  SEND_REPORT_ERROR: string;

  REQUEST_GET_REPORTS: string;
  GET_REPORTS_SUCCESS: string;
  GET_REPORTS_ERROR: string;

  REQUEST_SEARCH_REPORT: string;
  SEARCH_REPORT_SUCCESS: string;
  SEARCH_REPORT_ERROR: string;

  SEND_REPORT: string;
  GET_REPORTS: string;
  SEARCH_REPORT: string;

  REPORT_URI: string;
}

export interface ReportForm {
  complainerPhone: number;
  complainerName: string;
  complainerEmail: string;
  complaintSubject: string;
  complaintDescription: string;
}
export interface Report {
  id: number;
  complainerPhone: number;
  complainerName: string;
  createdBy: string;
  complainerEmail: string;
  complaintSubject: string;
  complaintDescription: string;
  createdAt: string;
  updatedAt: string;
  status: number | string;
}
export interface ReportState {
  reports: Report[];
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
  report: Report | null;
  reportForm: ReportForm;
  pagination: PaginationState;
  loadingState: LoadingState;
  paginationState: PaginationState;
}
export interface ReportAction {
  type: string;
  reports?: Report[];
  report?: Report[];
  message?: string;
  error?: string;
  loading?: boolean;
  success?: boolean;
  reportForm?: ReportForm;
  pagination?: PaginationState;
  loadingState?: LoadingState;
  paginationState?: PaginationState;
}
