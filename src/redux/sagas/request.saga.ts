import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants, requestConstants } from '@/constants';
import { appActions, CreateRequestAction } from '@/actions';
import {
  checkStatus,
  parseResponse,
  createRequest,
  getObjectFromStorage,
  createRequestWithToken,
} from '@/utilities/helpers';
import { Request as CustomRequest, SetSnackBarPayload } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';

interface User {
  user: { [key: string]: unknown };
  refreshToken: string;
  token: string;
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
  };
}

interface ApiError {
  response?: Response;
  message?: string;
  error?: string;
}

function* createNewRequest({ data }: CreateRequestAction) {
  yield put({ type: requestConstants.REQUEST_CREATE_REQUEST });

  try {
    if (data) {
      const requestUri = `${requestConstants.REQUEST_URI}/new`;
      const requestReq = createRequest(requestUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const response: ResetPasswordData = yield call(fetch, requestReq);
      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: requestConstants.CREATE_REQUEST_SUCCESS,
        request: jsonResponse?.data,
      });

      AppEmitter.emit(requestConstants.CREATE_REQUEST_SUCCESS, jsonResponse);
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: requestConstants.CREATE_REQUEST_ERROR,
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
      type: requestConstants.CREATE_REQUEST_ERROR,
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

function* getAllRequests() {
  yield put({ type: requestConstants.REQUEST_GET_ALL_REQUESTS });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    const storeUri = `${requestConstants.REQUEST_URI}`;

    const requestFn = () =>
      createRequestWithToken(storeUri, { method: 'GET' })(
        user?.token as string
      );
    const storeReq: Request = yield call(requestFn);

    const response: CustomRequest = yield call(fetch, storeReq);
    yield call(checkStatus, response as unknown as Response);

    const jsonResponse: ParsedResponse = yield call(
      parseResponse,
      response as unknown as Response
    );

    yield put({
      type: requestConstants.GET_ALL_REQUESTS_SUCCESS,
      requests: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: requestConstants.GET_ALL_REQUESTS_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: requestConstants.GET_ALL_REQUESTS_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* createNewRequestWatcher() {
  yield takeLatest(requestConstants.CREATE_REQUEST, createNewRequest);
}

function* getAllRequestsWatcher() {
  yield takeLatest(requestConstants.GET_ALL_REQUESTS, getAllRequests);
}

export default function* rootSaga() {
  yield all([createNewRequestWatcher(), getAllRequestsWatcher()]);
}
