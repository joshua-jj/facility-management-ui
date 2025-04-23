import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants, reportConstants } from '@/constants';
import { appActions, SearchReportAction } from '@/actions';
import {
  checkStatus,
  parseResponse,
  createRequest,
  createRequestWithToken,
  getObjectFromStorage,
  clearObjectFromStorage,
} from '@/utilities/helpers';
import { Report, ReportForm, User, SetSnackBarPayload } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';

interface SendReportAction {
  type: typeof reportConstants.SEND_REPORT;
  data: ReportForm;
}

interface ResetPasswordData {
  token: string;
  redirect: string;
  password: string;
  nonce?: string;
}

interface ParsedResponse {
  message: string;
  error: string;
  items: {
    user: { [key: string]: unknown };
  };
  data: {
    user: { [key: string]: unknown };
    id: string;
  };
}

interface ApiError {
  response?: Response;
  message?: string;
  error?: string;
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

      const response: ResetPasswordData = yield call(fetch, reportReq);
      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

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
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: reportConstants.SEND_REPORT_ERROR,
        error: res?.error,
      });
      const payload: SetSnackBarPayload = {
        type: 'error',
        message: res?.error ?? res?.message ?? 'Something went wrong',
        variant: 'error',
      };
      yield put(appActions.setSnackBar(payload));

      return;
    }
    yield put({
      type: reportConstants.SEND_REPORT_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
    const payload: SetSnackBarPayload = {
      type: 'error',
      message:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
      variant: 'error',
    };
    yield put(appActions.setSnackBar(payload));
  }
}

function* getReports() {
  yield put({ type: reportConstants.REQUEST_GET_REPORTS });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    const reportUri = `${reportConstants.REPORT_URI}`;

    const requestFn = () =>
      createRequestWithToken(reportUri, { method: 'GET' })(
        user?.token as string
      );
    const reportReq: Request = yield call(requestFn);

    const response: Report = yield call(fetch, reportReq);
    if (response.status === 401) {
      yield call(clearObjectFromStorage, authConstants.USER_KEY);

      yield put({ type: authConstants.TOKEN_HAS_EXPIRED });
      return;
    }
    yield call(checkStatus, response as unknown as Response);

    const jsonResponse: ParsedResponse = yield call(
      parseResponse,
      response as unknown as Response
    );

    yield put({
      type: reportConstants.GET_REPORTS_SUCCESS,
      reports: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: reportConstants.GET_REPORTS_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: reportConstants.GET_REPORTS_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* searchReport({ data }: SearchReportAction) {
  yield put({ type: reportConstants.REQUEST_SEARCH_REPORT });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    const reportUri = `${reportConstants.REPORT_URI}/search?q=${data.text}`;

    const requestFn = () =>
      createRequestWithToken(reportUri, { method: 'GET' })(
        user?.token as string
      );
    const reportReq: Request = yield call(requestFn);

    const response: Report = yield call(fetch, reportReq);
    yield call(checkStatus, response as unknown as Response);

    const jsonResponse: ParsedResponse = yield call(
      parseResponse,
      response as unknown as Response
    );

    yield put({
      type: reportConstants.SEARCH_REPORT_SUCCESS,
      report: jsonResponse,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: reportConstants.SEARCH_REPORT_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: reportConstants.SEARCH_REPORT_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
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
