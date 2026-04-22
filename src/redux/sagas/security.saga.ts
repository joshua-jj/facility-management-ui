import { all, put, takeLatest } from 'typed-redux-saga';
import { securityConstants } from '@/constants/security.constant';
import { authenticatedRequest, handleSagaError } from '@/utilities/saga-helpers';
import {
   GetLoginHistoryAction,
   RevokeSessionAction,
} from '@/types';

function* getSessions() {
   yield put({ type: securityConstants.REQUEST_GET_SESSIONS });
   try {
      const jsonResponse = yield* authenticatedRequest(
         securityConstants.SESSIONS_URI,
         { method: 'GET' },
      );
      if (!jsonResponse) return;
      const payload = (jsonResponse?.data ?? jsonResponse) as unknown;
      const items = Array.isArray(payload) ? payload : [];
      yield put({
         type: securityConstants.GET_SESSIONS_SUCCESS,
         sessions: items,
      });
   } catch (error: unknown) {
      yield* handleSagaError(error, securityConstants.GET_SESSIONS_FAILURE, false);
   }
}

function* revokeSession({ data }: RevokeSessionAction) {
   yield put({ type: securityConstants.REQUEST_REVOKE_SESSION });
   try {
      const jsonResponse = yield* authenticatedRequest(
         `${securityConstants.SESSIONS_URI}/${data.sessionId}`,
         { method: 'DELETE' },
      );
      if (!jsonResponse) return;
      yield put({
         type: securityConstants.REVOKE_SESSION_SUCCESS,
         sessionId: data.sessionId,
         message: jsonResponse?.message ?? 'Session revoked',
      });
   } catch (error: unknown) {
      yield* handleSagaError(error, securityConstants.REVOKE_SESSION_FAILURE, false);
   }
}

function* revokeAllSessions() {
   yield put({ type: securityConstants.REQUEST_REVOKE_ALL_SESSIONS });
   try {
      const jsonResponse = yield* authenticatedRequest(
         securityConstants.SESSIONS_URI,
         { method: 'DELETE' },
      );
      if (!jsonResponse) return;
      yield put({
         type: securityConstants.REVOKE_ALL_SESSIONS_SUCCESS,
         message: jsonResponse?.message ?? 'Sessions revoked',
      });
   } catch (error: unknown) {
      yield* handleSagaError(
         error,
         securityConstants.REVOKE_ALL_SESSIONS_FAILURE,
         false,
      );
   }
}

function* getLoginHistory({ data }: GetLoginHistoryAction) {
   yield put({ type: securityConstants.REQUEST_GET_LOGIN_HISTORY });
   try {
      const uri = data?.limit
         ? `${securityConstants.LOGIN_HISTORY_URI}?limit=${data.limit}`
         : securityConstants.LOGIN_HISTORY_URI;
      const jsonResponse = yield* authenticatedRequest(uri, { method: 'GET' });
      if (!jsonResponse) return;
      const payload = (jsonResponse?.data ?? jsonResponse) as unknown;
      const items = Array.isArray(payload) ? payload : [];
      yield put({
         type: securityConstants.GET_LOGIN_HISTORY_SUCCESS,
         events: items,
      });
   } catch (error: unknown) {
      yield* handleSagaError(
         error,
         securityConstants.GET_LOGIN_HISTORY_FAILURE,
         false,
      );
   }
}

export default function* securitySaga() {
   yield all([
      takeLatest(securityConstants.GET_SESSIONS, getSessions),
      takeLatest(securityConstants.REVOKE_SESSION, revokeSession),
      takeLatest(securityConstants.REVOKE_ALL_SESSIONS, revokeAllSessions),
      takeLatest(securityConstants.GET_LOGIN_HISTORY, getLoginHistory),
   ]);
}
