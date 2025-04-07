import { ReportConstants } from '@/types';
import { appConstants } from './app.constant';

const report: string = 'complaint';

export const reportConstants: ReportConstants = {
    REQUEST_SEND_REPORT: 'REQUEST_SEND_REPORT',
    SEND_REPORT_SUCCESS: 'SEND_REPORT_SUCCESS',
    SEND_REPORT_ERROR: 'SEND_REPORT_ERROR',
  
    SEND_REPORT: 'SEND_REPORT',
  
  REPORT_URI: `${appConstants.BASE_URI}${report}`,
};
