import { ReportForm } from '@/types';
import { reportConstants } from '@/constants';

interface SendReportAction {
  type: typeof reportConstants.SEND_REPORT;
  data: ReportForm;
}

const sendReport = (data: ReportForm): SendReportAction => ({
  type: reportConstants.SEND_REPORT,
  data,
});

export const reportActions = {
  sendReport,
};
