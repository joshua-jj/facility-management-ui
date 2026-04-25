/// <reference lib="dom" />
import { all, put, takeLatest, takeEvery, take, call, cancelled, fork, race } from 'typed-redux-saga';
import { eventChannel, END, EventChannel } from 'redux-saga';
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
   data?: unknown;
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

// ─── SSE helpers ────────────────────────────────────────────────────────────

interface StreamEvent {
   kind: 'open' | 'message' | 'error';
   payload?: unknown;
}

function createStreamChannel(ticket: string): EventChannel<StreamEvent> {
   const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';
   const url = `${baseUrl}${notificationConstants.NOTIFICATION_STREAM_URI}?ticket=${encodeURIComponent(ticket)}`;
   return eventChannel<StreamEvent>((emit) => {
      const source = new EventSource(url);
      source.onopen = () => emit({ kind: 'open' });
      source.addEventListener('notification', (ev: MessageEvent) => {
         try {
            const data = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
            emit({ kind: 'message', payload: data });
         } catch {
            /* malformed payload — drop */
         }
      });
      source.addEventListener('ping', () => {
         // keep-alive — nothing to dispatch
      });
      source.onerror = () => {
         emit({ kind: 'error' });
         try { source.close(); } catch { /* noop */ }
         emit(END);
      };
      return () => {
         try { source.close(); } catch { /* noop */ }
      };
   });
}

function* fetchTicket(): Generator<unknown, string | null, unknown> {
   try {
      const resp = yield* authenticatedRequest(
         notificationConstants.NOTIFICATION_STREAM_TICKET_URI,
         { method: 'POST' },
      );
      if (!resp) return null;
      return ((resp.data as Record<string, unknown>)?.ticket as string) ?? null;
   } catch {
      return null;
   }
}

function* runStreamOnce(ticket: string) {
   const channel: EventChannel<StreamEvent> = yield call(createStreamChannel, ticket);
   try {
      while (true) {
         const ev: StreamEvent = yield take(channel);
         if (ev.kind === 'open') {
            yield put({ type: notificationConstants.NOTIFICATION_STREAM_OPENED });
         } else if (ev.kind === 'message') {
            yield put({ type: notificationConstants.NOTIFICATION_RECEIVED, data: ev.payload });
         } else if (ev.kind === 'error') {
            break;
         }
      }
   } finally {
      yield put({ type: notificationConstants.NOTIFICATION_STREAM_CLOSED });
      if ((yield cancelled()) as boolean) {
         try { channel.close(); } catch { /* noop */ }
      }
   }
}

const BACKOFF_STEPS_MS = [1000, 2000, 4000, 8000, 16000, 30000];

function* streamWorker() {
   let attempt = 0;
   while (true) {
      const ticket: string | null = yield* fetchTicket();
      if (!ticket) {
         const delay = BACKOFF_STEPS_MS[Math.min(attempt, BACKOFF_STEPS_MS.length - 1)];
         yield call(() => new Promise<void>((r) => setTimeout(r, delay + Math.floor(Math.random() * 250))));
         attempt += 1;
         continue;
      }
      attempt = 0;
      yield call(runStreamOnce, ticket);
      const delay = BACKOFF_STEPS_MS[Math.min(attempt, BACKOFF_STEPS_MS.length - 1)];
      yield call(() => new Promise<void>((r) => setTimeout(r, delay + Math.floor(Math.random() * 250))));
      attempt += 1;
   }
}

function* connectStreamWatcher() {
   while (true) {
      yield take(notificationConstants.CONNECT_NOTIFICATION_STREAM);
      yield race({
         task: call(streamWorker),
         cancel: take(notificationConstants.DISCONNECT_NOTIFICATION_STREAM),
      });
   }
}

// ─── Root saga ───────────────────────────────────────────────────────────────

export default function* notificationSaga() {
   yield* all([
      takeLatest(notificationConstants.GET_NOTIFICATIONS, getNotificationsWorker),
      takeLatest(notificationConstants.GET_NOTIFICATION_SUMMARY, getNotificationSummaryWorker),
      takeEvery(notificationConstants.MARK_NOTIFICATION_READ, markNotificationReadWorker),
      takeLatest(notificationConstants.MARK_ALL_NOTIFICATIONS_READ, markAllReadWorker),
      fork(connectStreamWatcher),
   ]);
}
