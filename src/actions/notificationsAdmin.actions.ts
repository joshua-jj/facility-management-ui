import { notificationsAdminConstants } from '@/constants/notifications-admin.constant';
import { NotificationDeliveriesQuery } from '@/types/notificationsAdmin.types';

/**
 * Action creators for the SA-only notification delivery admin slice.
 * Sagas live in `src/redux/sagas/notificationsAdmin.saga.ts`.
 */
export const notificationsAdminActions = {
   getNotificationsAdmin: (query: NotificationDeliveriesQuery) => ({
      type: notificationsAdminConstants.GET_NOTIFICATIONS_ADMIN,
      payload: query,
   }),
   getNotificationAdmin: (id: number) => ({
      type: notificationsAdminConstants.GET_NOTIFICATION_ADMIN,
      payload: { id },
   }),
   retryNotification: (id: number) => ({
      type: notificationsAdminConstants.RETRY_NOTIFICATION,
      payload: { id },
   }),
   abandonNotification: (id: number) => ({
      type: notificationsAdminConstants.ABANDON_NOTIFICATION,
      payload: { id },
   }),
   deleteNotification: (id: number) => ({
      type: notificationsAdminConstants.DELETE_NOTIFICATION,
      payload: { id },
   }),
};
