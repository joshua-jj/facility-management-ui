import { all, put, takeLatest } from 'typed-redux-saga';
import { auditLogConstants } from '@/constants/auditLog.constant';
import { authenticatedRequest, handleSagaError } from '@/utilities/saga-helpers';
import { GetAuditLogsAction } from '@/types';

function* getAuditLogs({ data }: GetAuditLogsAction) {
   yield put({ type: auditLogConstants.REQUEST_GET_AUDIT_LOGS });

   try {
      const params = new URLSearchParams();
      if (data?.page) params.set('page', String(data.page));
      if (data?.limit) params.set('limit', String(data.limit));
      if (data?.from) params.set('from', data.from);
      if (data?.to) params.set('to', data.to);
      if (data?.entityType) params.set('entityType', data.entityType);
      if (data?.action) params.set('action', data.action);
      if (data?.actor) params.set('actor', data.actor);
      if (data?.q) params.set('q', data.q);

      const uri = params.toString()
         ? `${auditLogConstants.AUDIT_LOGS_URI}?${params.toString()}`
         : auditLogConstants.AUDIT_LOGS_URI;

      const jsonResponse = yield* authenticatedRequest(uri, { method: 'GET' });
      if (!jsonResponse) return;

      const payload =
         (jsonResponse?.data ?? jsonResponse) as {
            items?: unknown[];
            meta?: Record<string, unknown> | null;
         };
      const items = payload?.items ?? [];
      const meta = payload?.meta ?? null;

      yield put({
         type: auditLogConstants.GET_AUDIT_LOGS_SUCCESS,
         items,
         meta,
      });
   } catch (error: unknown) {
      yield* handleSagaError(error, auditLogConstants.GET_AUDIT_LOGS_FAILURE, false);
   }
}

function* getAuditLogsWatcher() {
   yield takeLatest(auditLogConstants.GET_AUDIT_LOGS, getAuditLogs);
}

export default function* auditLogSaga() {
   yield all([getAuditLogsWatcher()]);
}
