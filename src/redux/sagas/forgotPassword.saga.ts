import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants, forgotPasswordConstants } from '@/constants';
import {
  appActions,
  ForgotPasswordAction,
  ResetPasswordAction,
} from '@/actions';
import {
  checkStatus,
  parseResponse,
  createRequest,
  //   setObjectInStorage,
  //   clearObjectFromStorage,
  //   createRequestWithToken,
} from '@/utilities/helpers';
import { SetSnackBarPayload } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';

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

function* getResetPasswordLink({ data }: ForgotPasswordAction) {
  yield put({ type: forgotPasswordConstants.REQUEST_SEND_RESET_PASSWORD_LINK });

  try {
    if (data) {
      const resetPasswordLinkUri = `${authConstants.AUTH_URI}/forgot-password`;
      const resetPasswordLinkReq = createRequest(resetPasswordLinkUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const response: ForgotPasswordAction = yield call(
        fetch,
        resetPasswordLinkReq
      );
      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: forgotPasswordConstants.SEND_RESET_PASSWORD_LINK_SUCCESS,
        user: jsonResponse?.data,
      });

      AppEmitter.emit(
        forgotPasswordConstants.SEND_RESET_PASSWORD_LINK_SUCCESS,
        jsonResponse
      );

      const payload: SetSnackBarPayload = {
        type: 'success',
        message:
          jsonResponse?.message ?? 'Reset password link sent successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      console.log('got hereeeee');

      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      console.log('got res', res?.message);
      yield put({
        type: forgotPasswordConstants.SEND_RESET_PASSWORD_LINK_ERROR,
        // error: res?.message ?? res?.message?.[0],
        error:
          typeof res?.message === 'string'
            ? res.message
            : Array.isArray(res?.message)
              ? res.message[0]
              : 'Something went wrong',
      });
      const payload: SetSnackBarPayload = {
        type: 'error',
        message:
          typeof res?.message === 'string'
            ? res.message
            : Array.isArray(res?.message)
              ? res.message[0]
              : 'Something went wrong',
        // message: res?.message ?? res?.message?.[0] ?? 'Something went wrong',
        variant: 'error',
      };
      console.log('payload', payload);

      yield put(appActions.setSnackBar(payload));

      return;
    }
    // yield put({
    //   type: authConstants.LOGIN_FAILURE,
    //   error:
    //     ((error as ApiError)?.error || (error as ApiError)?.message) ??
    //     'Something went wrong',
    // });
    // const payload: SetSnackBarPayload = {
    //   type: 'error',
    //   message:
    //     ((error as ApiError)?.error || (error as ApiError)?.message) ??
    //     'Something went wrong',
    //   variant: 'error',
    // };
    // yield put(appActions.setSnackBar(payload));
  }
}

function* resetPassword({ data }: ResetPasswordAction) {
  yield put({ type: forgotPasswordConstants.REQUEST_RESET_PASSWORD });

  try {
    if (data) {
      const resetPasswordLinkUri = `${authConstants.AUTH_URI}/password-reset`;
      const resetPasswordLinkReq = createRequest(resetPasswordLinkUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const response: ResetPasswordAction = yield call(
        fetch,
        resetPasswordLinkReq
      );
      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: forgotPasswordConstants.RESET_PASSWORD_SUCCESS,
        user: jsonResponse?.data,
      });

      AppEmitter.emit(
        forgotPasswordConstants.RESET_PASSWORD_SUCCESS,
        jsonResponse
      );

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: jsonResponse?.message ?? 'Password reset successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: forgotPasswordConstants.RESET_PASSWORD_ERROR,
        error:
          typeof res?.message === 'string'
            ? res.message
            : Array.isArray(res?.message)
              ? res.message[0]
              : 'Something went wrong',
      });
      const payload: SetSnackBarPayload = {
        type: 'error',
        message:
          typeof res?.message === 'string'
            ? res.message
            : Array.isArray(res?.message)
              ? res.message[0]
              : 'Something went wrong',
        variant: 'error',
      };

      yield put(appActions.setSnackBar(payload));

      return;
    }
  }
}

function* getResetPasswordLinkWatcher() {
  yield takeLatest(
    forgotPasswordConstants.SEND_RESET_PASSWORD_LINK,
    getResetPasswordLink
  );
}

function* resetPasswordWatcher() {
  yield takeLatest(forgotPasswordConstants.RESET_PASSWORD, resetPassword);
}

export default function* rootSaga() {
  yield all([getResetPasswordLinkWatcher(), resetPasswordWatcher()]);
}
