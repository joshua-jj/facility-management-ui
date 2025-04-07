import { call, put, takeLatest, all } from 'typed-redux-saga';
import {
  reportConstants,
} from '@/constants';
import { appActions } from '@/actions';
import {
  checkStatus,
  parseResponse,
  createRequest,
} from '@/utilities/helpers';
import { ReportForm, SetSnackBarPayload } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';

// interface ActionWithPayload<T> {
//   type: string;
//   payload?: T;
// }

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
  data: {
    user: { [key: string]: unknown };
    id: string;
    redirect_url: string;
    source?: string;
    token: string;
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
        response as unknown as Response,
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

      AppEmitter.emit(
        reportConstants.SEND_REPORT_SUCCESS,
        jsonResponse,
      );
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response,
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

function* sendReportWatcher() {
  yield takeLatest(reportConstants.SEND_REPORT, sendReport);
}

export default function* rootSaga() {
  yield all([sendReportWatcher()]);
}
