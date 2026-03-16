import { call, put, takeLatest, all } from 'typed-redux-saga';
import { reportConstants } from '@/constants';
import { appActions, SearchReportAction } from '@/actions';
import { checkStatus, parseResponse, createRequest } from '@/utilities/helpers';
import { ReportForm, SetSnackBarPayload } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

interface SendReportAction {
  type: typeof reportConstants.SEND_REPORT;
  data: ReportForm;
}

function* sendReport({ data }: SendReportAction) {
  yield put({ type: reportConstants.REQUEST_SEND_REPORT });

  try {
    if (data) {
      const reportUri = `${reportConstants.REPORT_URI}/new`;
      const reportReq = createRequest(reportUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const response: Response = yield call(fetch, reportReq);
      yield call(checkStatus, response);

      // @ts-expect-error legacy saga pattern
      const jsonResponse = yield call(parseResponse, response);

      yield put({
        type: reportConstants.SEND_REPORT_SUCCESS,
        report: jsonResponse?.data,
      });

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: 'Report saved successfully!',
        variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));

      AppEmitter.emit(reportConstants.SEND_REPORT_SUCCESS, jsonResponse);
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, reportConstants.SEND_REPORT_ERROR);
  }
}

function* getReports() {
  yield put({ type: reportConstants.REQUEST_GET_REPORTS });

  try {
    const reportUri = `${reportConstants.REPORT_URI}`;

    const jsonResponse = yield* authenticatedRequest(reportUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: reportConstants.GET_REPORTS_SUCCESS,
      reports: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, reportConstants.GET_REPORTS_ERROR, false);
  }
}

function* searchReport({ data }: SearchReportAction) {
  yield put({ type: reportConstants.REQUEST_SEARCH_REPORT });

  try {
    const reportUri = `${reportConstants.REPORT_URI}/search?q=${data.text}`;

    const jsonResponse = yield* authenticatedRequest(reportUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: reportConstants.SEARCH_REPORT_SUCCESS,
      report: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, reportConstants.SEARCH_REPORT_ERROR, false);
  }
}

function* sendReportWatcher() {
  yield takeLatest(reportConstants.SEND_REPORT, sendReport);
}

function* getReportsWatcher() {
  yield takeLatest(reportConstants.GET_REPORTS, getReports);
}

function* searchReportWatcher() {
  yield takeLatest(reportConstants.SEARCH_REPORT, searchReport);
}

export default function* rootSaga() {
  yield all([sendReportWatcher(), getReportsWatcher(), searchReportWatcher()]);
}
