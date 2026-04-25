import { notificationConstants } from '@/constants/notification.constant';
import type { NotificationDto, NotificationListQuery } from '@/types/notification';

const getNotifications = (query?: NotificationListQuery) => ({
   type: notificationConstants.GET_NOTIFICATIONS,
   data: query ?? {},
});

const getNotificationSummary = () => ({
   type: notificationConstants.GET_NOTIFICATION_SUMMARY,
});

const markNotificationRead = (id: number) => ({
   type: notificationConstants.MARK_NOTIFICATION_READ,
   data: { id },
});

const markAllNotificationsRead = () => ({
   type: notificationConstants.MARK_ALL_NOTIFICATIONS_READ,
});

const connectNotificationStream = () => ({
   type: notificationConstants.CONNECT_NOTIFICATION_STREAM,
});

const disconnectNotificationStream = () => ({
   type: notificationConstants.DISCONNECT_NOTIFICATION_STREAM,
});

const notificationReceived = (notification: NotificationDto) => ({
   type: notificationConstants.NOTIFICATION_RECEIVED,
   data: notification,
});

export const notificationActions = {
   getNotifications,
   getNotificationSummary,
   markNotificationRead,
   markAllNotificationsRead,
   connectNotificationStream,
   disconnectNotificationStream,
   notificationReceived,
};
