export interface ReportConstants {
  REQUEST_SEND_REPORT: string;
  SEND_REPORT_SUCCESS: string;
  SEND_REPORT_ERROR: string;

  SEND_REPORT: string;

  REPORT_URI: string;
}

export interface ReportForm {
  complainerPhone: number;
  complainerName: string;
  complainerEmail: string;
  complaintSubject: string;
  complaintDescription: string;
}
