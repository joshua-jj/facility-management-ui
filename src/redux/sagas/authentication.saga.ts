import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants } from '@/constants';
import { appActions } from '@/actions';
import {
  checkStatus,
  parseResponse,
  createRequest,
  setObjectInStorage,
  clearObjectFromStorage,
} from '@/utilities/helpers';
import { SetSnackBarPayload } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';
import { LoginAction } from '@/actions/authentication.action';

// interface ResetPasswordData {
//   token: string;
//   redirect: string;
//   password: string;
//   nonce?: string;
// }

interface ParsedResponse {
  message: string;
  error: string;
  data: {
    user: { [key: string]: unknown };
    refreshToken: string;
    accessToken: string;
  };
}

interface ApiError {
  response?: Response;
  message?: string;
  error?: string;
}

function* login({ data }: LoginAction) {
  yield put({ type: authConstants.LOGGING_IN });

  try {
    if (data) {
      const loginUri = `${authConstants.LOGIN_URI}`;
      const loginReq = createRequest(loginUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const response: LoginAction = yield call(fetch, loginReq);
      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield call(setObjectInStorage, authConstants.USER_KEY, {
        user: jsonResponse?.data.user,
        token: jsonResponse?.data.accessToken,
        refreshToken: jsonResponse?.data.refreshToken,
      });

      yield put({
        type: authConstants.LOGIN_SUCCESS,
        user: jsonResponse?.data.user,
      });

      AppEmitter.emit(authConstants.LOGIN_SUCCESS, jsonResponse);
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: authConstants.LOGIN_FAILURE,
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
      type: authConstants.LOGIN_FAILURE,
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

function* logout() {
  yield put({ type: authConstants.LOGGING_OUT });
  try {
    yield call(clearObjectFromStorage, authConstants.USER_KEY);

    yield put({ type: authConstants.LOGOUT_SUCCESS });
  } catch {
    yield put({ type: authConstants.LOGOUT_FAILURE });
  }
}

function* loginWatcher() {
  yield takeLatest(authConstants.LOGIN, login);
}
function* logoutWatcher() {
  yield takeLatest(authConstants.LOGOUT, logout);
}

export default function* rootSaga() {
  yield all([loginWatcher(), logoutWatcher()]);
}
