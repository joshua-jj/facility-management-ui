import { appConstants } from '@/constants/app.constant';

/**
 * Constants for the SA-only notification delivery admin slice.
 *
 * The API controller is mounted at `notification` (singular, see
 * `facility-management-api/src/core/notification/notification.controller.ts`),
 * so all admin URIs hang off `BASE_URI + 'notification/admin'`. `BASE_URI`
 * already includes `/api/v1/` and a trailing slash — don't prepend it
 * again here.
 */
const ADMIN_BASE = `${appConstants.BASE_URI}notification/admin`;

export const notificationsAdminConstants = {
   // ── API URIs ──────────────────────────────────────────────────────
   ADMIN_LIST_URI: ADMIN_BASE,
   ADMIN_DETAIL_URI: (id: number) => `${ADMIN_BASE}/${id}`,
   ADMIN_RETRY_URI: (id: number) => `${ADMIN_BASE}/${id}/retry`,
   ADMIN_ABANDON_URI: (id: number) => `${ADMIN_BASE}/${id}/abandon`,

   // ── Action types ──────────────────────────────────────────────────
   GET_NOTIFICATIONS_ADMIN: 'GET_NOTIFICATIONS_ADMIN',
   GET_NOTIFICATIONS_ADMIN_SUCCESS: 'GET_NOTIFICATIONS_ADMIN_SUCCESS',
   GET_NOTIFICATIONS_ADMIN_FAILURE: 'GET_NOTIFICATIONS_ADMIN_FAILURE',

   GET_NOTIFICATION_ADMIN: 'GET_NOTIFICATION_ADMIN',
   GET_NOTIFICATION_ADMIN_SUCCESS: 'GET_NOTIFICATION_ADMIN_SUCCESS',
   GET_NOTIFICATION_ADMIN_FAILURE: 'GET_NOTIFICATION_ADMIN_FAILURE',

   RETRY_NOTIFICATION: 'RETRY_NOTIFICATION',
   RETRY_NOTIFICATION_SUCCESS: 'RETRY_NOTIFICATION_SUCCESS',
   RETRY_NOTIFICATION_FAILURE: 'RETRY_NOTIFICATION_FAILURE',

   ABANDON_NOTIFICATION: 'ABANDON_NOTIFICATION',
   ABANDON_NOTIFICATION_SUCCESS: 'ABANDON_NOTIFICATION_SUCCESS',
   ABANDON_NOTIFICATION_FAILURE: 'ABANDON_NOTIFICATION_FAILURE',
} as const;
