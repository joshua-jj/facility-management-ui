import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants, forgotPasswordConstants } from '@/constants';
import {
  appActions,
  ForgotPasswordAction,
  ResetPasswordAction,
} from '@/actions';
import { checkStatus, parseResponse, createRequest } from '@/utilities/helpers';
import { SetSnackBarPayload } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';
import { handleSagaError } from '@/utilities/saga-helpers';

function* getResetPasswordLink({ data }: ForgotPasswordAction) {
  yield put({ type: forgotPasswordConstants.REQUEST_SEND_RESET_PASSWORD_LINK });

  try {
    if (data) {
      const resetPasswordLinkUri = `${authConstants.AUTH_URI}/forgot-password`;
      const resetPasswordLinkReq = createRequest(resetPasswordLinkUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const response: Response = yield call(fetch, resetPasswordLinkReq);
      yield call(checkStatus, response);

      // @ts-expect-error legacy saga pattern
      const jsonResponse = yield call(parseResponse, response);

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
    yield* handleSagaError(error, forgotPasswordConstants.SEND_RESET_PASSWORD_LINK_ERROR);
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

      const response: Response = yield call(fetch, resetPasswordLinkReq);
      yield call(checkStatus, response);

      // @ts-expect-error legacy saga pattern
      const jsonResponse = yield call(parseResponse, response);

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
    yield* handleSagaError(error, forgotPasswordConstants.RESET_PASSWORD_ERROR);
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
