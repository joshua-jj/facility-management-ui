import { all, put, takeLatest, takeEvery } from 'typed-redux-saga';
import { notificationConstants } from '@/constants/notification.constant';
import type { NotificationListQuery, NotificationListResponse } from '@/types/notification';
import { authenticatedRequest, handleSagaError } from '@/utilities/saga-helpers';

function buildListUri(query: NotificationListQuery): string {
   const params = new URLSearchParams();
   if (query.limit != null) params.set('limit', String(query.limit));
   if (query.cursor) params.set('cursor', query.cursor);
   if (query.unreadOnly) params.set('unreadOnly', 'true');
   if (query.assignedToMe) params.set('assignedToMe', 'true');
   const qs = params.toString();
   return notificationConstants.NOTIFICATION_URI + (qs ? `?${qs}` : '');
}

interface ActionShape {
   type: string;
   data?: any;
}

function* getNotificationsWorker(action: ActionShape) {
   yield put({ type: notificationConstants.REQUEST_GET_NOTIFICATIONS });
   try {
      const query = (action.data ?? {}) as NotificationListQuery;
      const resp = yield* authenticatedRequest(buildListUri(query), { method: 'GET' });
      if (!resp) return;
      yield put({
         type: notificationConstants.GET_NOTIFICATIONS_SUCCESS,
         data: { ...(resp.data as NotificationListResponse) },
      });
   } catch (error: unknown) {
      yield* handleSagaError(error, notificationConstants.GET_NOTIFICATIONS_ERROR, false);
   }
}

function* getNotificationSummaryWorker() {
   try {
      const resp = yield* authenticatedRequest(notificationConstants.NOTIFICATION_SUMMARY_URI, { method: 'GET' });
      if (!resp) return;
      yield put({
         type: notificationConstants.GET_NOTIFICATION_SUMMARY_SUCCESS,
         data: resp.data as { unreadCount: number },
      });
   } catch {
      /* summary failure non-fatal — fail silent */
   }
}

function* markNotificationReadWorker(action: ActionShape) {
   const id = (action.data as { id: number }).id;
   try {
      const uri = notificationConstants.NOTIFICATION_READ_URI.replace('{id}', String(id));
      const resp = yield* authenticatedRequest(uri, { method: 'PATCH' });
      if (!resp) return;
      yield put({
         type: notificationConstants.MARK_NOTIFICATION_READ_SUCCESS,
         data: { id },
      });
   } catch (error: unknown) {
      yield* handleSagaError(error, notificationConstants.MARK_NOTIFICATION_READ_ERROR);
   }
}

function* markAllReadWorker() {
   try {
      const resp = yield* authenticatedRequest(notificationConstants.NOTIFICATION_READ_ALL_URI, { method: 'PATCH' });
      if (!resp) return;
      yield put({ type: notificationConstants.MARK_ALL_NOTIFICATIONS_READ_SUCCESS });
   } catch (error: unknown) {
      yield* handleSagaError(error, notificationConstants.MARK_ALL_NOTIFICATIONS_READ_ERROR);
   }
}

export default function* notificationSaga() {
   yield* all([
      takeLatest(notificationConstants.GET_NOTIFICATIONS, getNotificationsWorker),
      takeLatest(notificationConstants.GET_NOTIFICATION_SUMMARY, getNotificationSummaryWorker),
      takeEvery(notificationConstants.MARK_NOTIFICATION_READ, markNotificationReadWorker),
      takeLatest(notificationConstants.MARK_ALL_NOTIFICATIONS_READ, markAllReadWorker),
   ]);
}
