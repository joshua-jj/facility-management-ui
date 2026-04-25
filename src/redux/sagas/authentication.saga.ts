import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants } from '@/constants';
import { appActions } from '@/actions';
import { notificationConstants } from '@/constants/notification.constant';
import {
  checkStatus,
  parseResponse,
  createRequest,
  setObjectInStorage,
  clearObjectFromStorage,
  createRequestWithToken,
  getObjectFromStorage,
} from '@/utilities/helpers';
import { SetSnackBarPayload, User } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';
import {
  ChangePasswordAction,
  LoginAction,
  ResendEmailAction,
} from '@/actions/authentication.action';
import { handleSagaError } from '@/utilities/saga-helpers';
import Cookies from 'js-cookie';

const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined;

interface ParsedResponse {
  message: string;
  error: string;
  data: {
    user: { [key: string]: unknown };
    refreshToken: string;
    accessToken: string;
  };
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

      Cookies.set('authToken', jsonResponse?.data.accessToken, {
        domain: COOKIE_DOMAIN,
        path: '/',
        secure: true,
        sameSite: 'lax',
        expires: 30,
      });

      yield put({
        type: authConstants.LOGIN_SUCCESS,
        user: jsonResponse?.data.user,
      });

      yield put({ type: notificationConstants.CONNECT_NOTIFICATION_STREAM });
      yield put({ type: notificationConstants.GET_NOTIFICATION_SUMMARY });

      AppEmitter.emit(authConstants.LOGIN_SUCCESS, jsonResponse);
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, authConstants.LOGIN_FAILURE);
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
        user: jsonResponse?.data,
      });

      AppEmitter.emit(authConstants.RESEND_EMAIL_LINK_SUCCESS, jsonResponse);

      const payload: SetSnackBarPayload = {
        type: 'success',
        message:
          jsonResponse?.message ?? 'Reset password link sent successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, authConstants.RESEND_EMAIL_LINK_ERROR);
  }
}

function* changePassword({ data }: ChangePasswordAction) {
  yield put({ type: authConstants.REQUEST_CHANGE_PASSWORD });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    if (data) {
      const changePasswordUri = `${authConstants.AUTH_URI}/change-password`;
      const token = data.token || user?.token;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { token: _token, confirmNewPassword: _confirm, ...payload } = data;
      const changePasswordReq = createRequestWithToken(changePasswordUri, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const req: Request = yield call(changePasswordReq, token as string);
      const response: ResendEmailAction = yield call(fetch, req);

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

      const successPayload: SetSnackBarPayload = {
        type: 'success',
        message: jsonResponse?.message ?? 'Password changed successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(successPayload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, authConstants.CHANGE_PASSWORD_FAILURE);
  }
}

function* logout() {
  yield put({ type: authConstants.LOGGING_OUT });
  try {
    yield put({ type: notificationConstants.DISCONNECT_NOTIFICATION_STREAM });
    yield call(clearObjectFromStorage, authConstants.USER_KEY);

    Cookies.remove('authToken', { domain: COOKIE_DOMAIN, path: '/' });

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
