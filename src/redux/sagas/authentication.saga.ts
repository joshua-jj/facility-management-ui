import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants } from '@/constants';
import { appActions } from '@/actions';
import {
  checkStatus,
  parseResponse,
  createRequest,
  setObjectInStorage,
  clearObjectFromStorage,
  createRequestWithToken,
} from '@/utilities/helpers';
import { SetSnackBarPayload } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';
import {
  ChangePasswordAction,
  LoginAction,
  ResendEmailAction,
} from '@/actions/authentication.action';

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

function* resendEmail({ data }: ResendEmailAction) {
  yield put({ type: authConstants.REQUEST_RESEND_EMAIL_LINK });

  try {
    if (data) {
      const resendUri = `${authConstants.AUTH_URI}/verification/resend`;
      const resendReq = createRequest(resendUri, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      const response: ResendEmailAction = yield call(fetch, resendReq);
      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: authConstants.RESEND_EMAIL_LINK_SUCCESS,
        user: jsonResponse?.data.user,
      });

      AppEmitter.emit(authConstants.RESEND_EMAIL_LINK_SUCCESS, jsonResponse);
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: authConstants.RESEND_EMAIL_LINK_ERROR,
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
      type: authConstants.RESEND_EMAIL_LINK_ERROR,
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

function* changePassword({ data }: ChangePasswordAction) {
  yield put({ type: authConstants.REQUEST_CHANGE_PASSWORD });

  try {
    // const user: User | null = yield call(
    //       getObjectFromStorage,
    //       authConstants.USER_KEY
    //     );
    if (data) {
      const changePasswordUri = `${authConstants.AUTH_URI}/change-password`;
      // const resendReq = createRequest(resendUri, {
      //   method: 'PATCH',
      //   body: JSON.stringify(data),
      // });
      const changePasswordReq = createRequestWithToken(changePasswordUri, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      const req: Request = yield call(changePasswordReq, data?.token as string);
      const response: ResendEmailAction = yield call(fetch, req);

      // const response: ResendEmailAction = yield call(fetch, resendReq);
      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: authConstants.CHANGE_PASSWORD_SUCCESS,
        user: jsonResponse,
      });

      AppEmitter.emit(authConstants.CHANGE_PASSWORD_SUCCESS, jsonResponse);
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: authConstants.CHANGE_PASSWORD_FAILURE,
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
      type: authConstants.CHANGE_PASSWORD_FAILURE,
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

function* resendEmailWatcher() {
  yield takeLatest(authConstants.RESEND_EMAIL_LINK, resendEmail);
}

function* changePasswordWatcher() {
  yield takeLatest(authConstants.CHANGE_PASSWORD, changePassword);
}

function* logoutWatcher() {
  yield takeLatest(authConstants.LOGOUT, logout);
}

export default function* rootSaga() {
  yield all([
    loginWatcher(),
    resendEmailWatcher(),
    changePasswordWatcher(),
    logoutWatcher(),
  ]);
}
