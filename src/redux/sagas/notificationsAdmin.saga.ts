import { all, put, takeLatest } from 'typed-redux-saga';
import { notificationsAdminConstants } from '@/constants/notifications-admin.constant';
import { appActions } from '@/actions';
import { authenticatedRequest, handleSagaError } from '@/utilities/saga-helpers';
import {
   NotificationDeliveriesQuery,
   NotificationDeliveriesPage,
} from '@/types/notificationsAdmin.types';
import { SetSnackBarPayload } from '@/types';

/**
 * Build the `?key=val&...` querystring for the admin list endpoint.
 *
 * Drops empty / null / undefined / empty-array values so the URI stays
 * lean; arrays (e.g. `status`) are joined with commas to match the API's
 * CSV-array convention used by `ListNotificationDeliveriesQueryDto`.
 */
function buildQueryString(params: Record<string, unknown>): string {
   const searchParams = new URLSearchParams();
   for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') continue;
      if (Array.isArray(value)) {
         if (value.length === 0) continue;
         searchParams.set(key, value.join(','));
      } else {
         searchParams.set(key, String(value));
      }
   }
   const qs = searchParams.toString();
   return qs ? `?${qs}` : '';
}

interface GetAction {
   type: string;
   payload: NotificationDeliveriesQuery;
}

interface MutateAction {
   type: string;
   payload: { id: number };
}

function* getNotificationsAdmin({ payload }: GetAction) {
   try {
      const qs = buildQueryString((payload || {}) as Record<string, unknown>);
      const uri = `${notificationsAdminConstants.ADMIN_LIST_URI}${qs}`;
      const resp = yield* authenticatedRequest(uri, { method: 'GET' });
      if (!resp) return;
      // The list endpoint returns `{ message, data, meta }` at the top
      // level — pack `data + meta` into the page shape the reducer
      // stores.
      const page: NotificationDeliveriesPage = {
         data: (resp as { data?: NotificationDeliveriesPage['data'] }).data ?? [],
         meta: (resp as { meta?: NotificationDeliveriesPage['meta'] }).meta ?? {
            totalItems: 0,
            itemCount: 0,
            itemsPerPage: payload?.limit ?? 25,
            totalPages: 1,
            currentPage: payload?.page ?? 1,
         },
      };
      yield put({
         type: notificationsAdminConstants.GET_NOTIFICATIONS_ADMIN_SUCCESS,
         payload: page,
      });
   } catch (error: unknown) {
      yield* handleSagaError(
         error,
         notificationsAdminConstants.GET_NOTIFICATIONS_ADMIN_FAILURE,
      );
   }
}

function* getNotificationAdmin({ payload }: MutateAction) {
   try {
      const resp = yield* authenticatedRequest(
         notificationsAdminConstants.ADMIN_DETAIL_URI(payload.id),
         { method: 'GET' },
      );
      if (!resp) return;
      yield put({
         type: notificationsAdminConstants.GET_NOTIFICATION_ADMIN_SUCCESS,
         payload: resp.data ?? null,
      });
   } catch (error: unknown) {
      yield* handleSagaError(
         error,
         notificationsAdminConstants.GET_NOTIFICATION_ADMIN_FAILURE,
      );
   }
}

function* retryNotification({ payload }: MutateAction) {
   try {
      const resp = yield* authenticatedRequest(
         notificationsAdminConstants.ADMIN_RETRY_URI(payload.id),
         { method: 'POST' },
      );
      if (!resp) return;
      yield put({
         type: notificationsAdminConstants.RETRY_NOTIFICATION_SUCCESS,
         payload: resp.data ?? null,
      });
      const snack: SetSnackBarPayload = {
         type: 'success',
         message:
            (typeof resp.message === 'string' ? resp.message : null) ??
            'Notification queued for retry',
         variant: 'success',
      };
      yield put(appActions.setSnackBar(snack));
   } catch (error: unknown) {
      yield* handleSagaError(
         error,
         notificationsAdminConstants.RETRY_NOTIFICATION_FAILURE,
      );
   }
}

function* abandonNotification({ payload }: MutateAction) {
   try {
      const resp = yield* authenticatedRequest(
         notificationsAdminConstants.ADMIN_ABANDON_URI(payload.id),
         { method: 'POST' },
      );
      if (!resp) return;
      yield put({
         type: notificationsAdminConstants.ABANDON_NOTIFICATION_SUCCESS,
         payload: resp.data ?? null,
      });
      const snack: SetSnackBarPayload = {
         type: 'success',
         message:
            (typeof resp.message === 'string' ? resp.message : null) ??
            'Notification marked as abandoned',
         variant: 'success',
      };
      yield put(appActions.setSnackBar(snack));
   } catch (error: unknown) {
      yield* handleSagaError(
         error,
         notificationsAdminConstants.ABANDON_NOTIFICATION_FAILURE,
      );
   }
}

export default function* notificationsAdminSaga() {
   yield* all([
      takeLatest(
         notificationsAdminConstants.GET_NOTIFICATIONS_ADMIN,
         getNotificationsAdmin,
      ),
      takeLatest(
         notificationsAdminConstants.GET_NOTIFICATION_ADMIN,
         getNotificationAdmin,
      ),
      takeLatest(
         notificationsAdminConstants.RETRY_NOTIFICATION,
         retryNotification,
      ),
      takeLatest(
         notificationsAdminConstants.ABANDON_NOTIFICATION,
         abandonNotification,
      ),
   ]);
}
