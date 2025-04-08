import { call, put, takeLatest, all } from 'typed-redux-saga';
import { requestConstants } from '@/constants';
import { appActions } from '@/actions';
import { checkStatus, parseResponse, createRequest } from '@/utilities/helpers';
import { RequestForm, SetSnackBarPayload } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';

interface CreateRequestAction {
  type: typeof requestConstants.CREATE_REQUEST;
  data: RequestForm;
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

function* createNewRequestWatcher() {
  yield takeLatest(requestConstants.CREATE_REQUEST, createNewRequest);
}

export default function* rootSaga() {
  yield all([createNewRequestWatcher()]);
}
