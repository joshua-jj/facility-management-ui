import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants, maintenanceConstants } from '@/constants';
import {
  checkStatus,
  parseResponse,
  createRequestWithToken,
  getObjectFromStorage,
  clearObjectFromStorage,
} from '@/utilities/helpers';
import { MaintenanceLog } from '@/types';
import { SearchMaintenanceLogAction } from '@/actions';

interface User {
  user: { [key: string]: unknown };
  refreshToken: string;
  token: string;
}

interface ParsedResponse {
  message: string;
  error: string;
  data: {
    items: { [key: string]: unknown };
    links: { [key: string]: unknown };
    meta: { [key: string]: unknown };
  };
}

interface ApiError {
  response?: Response;
  message?: string;
  error?: string;
}

function* getMaintenanceLogs() {
  yield put({ type: maintenanceConstants.REQUEST_GET_MAINTENANCE_LOGS });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    const logsUri = `${maintenanceConstants.MAINTENANCE_URI}`;

    const requestFn = () =>
      createRequestWithToken(logsUri, { method: 'GET' })(user?.token as string);
    const logsReq: Request = yield call(requestFn);

    const response: MaintenanceLog = yield call(fetch, logsReq);
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
      type: maintenanceConstants.GET_MAINTENANCE_LOGS_SUCCESS,
      logs: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: maintenanceConstants.GET_MAINTENANCE_LOGS_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: maintenanceConstants.GET_MAINTENANCE_LOGS_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* searchMaintenanceLog({ data }: SearchMaintenanceLogAction) {
  yield put({ type: maintenanceConstants.REQUEST_SEARCH_MAINTENANCE_LOG });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    const logsUri = `${maintenanceConstants.MAINTENANCE_URI}/search?q=${data.text}`;

    const requestFn = () =>
      createRequestWithToken(logsUri, { method: 'GET' })(user?.token as string);
    const logsReq: Request = yield call(requestFn);

    const response: MaintenanceLog = yield call(fetch, logsReq);
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
      type: maintenanceConstants.SEARCH_MAINTENANCE_LOG_SUCCESS,
      log: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: maintenanceConstants.SEARCH_MAINTENANCE_LOG_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: maintenanceConstants.SEARCH_MAINTENANCE_LOG_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* getMaintenanceLogsWatcher() {
  yield takeLatest(
    maintenanceConstants.GET_MAINTENANCE_LOGS,
    getMaintenanceLogs
  );
}

function* searchMaintenanceLogWatcher() {
  yield takeLatest(
    maintenanceConstants.SEARCH_MAINTENANCE_LOG,
    searchMaintenanceLog
  );
}

export default function* rootSaga() {
  yield all([getMaintenanceLogsWatcher(), searchMaintenanceLogWatcher()]);
}
