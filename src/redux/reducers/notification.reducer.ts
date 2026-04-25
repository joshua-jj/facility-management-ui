import { combineReducers } from 'redux';
import { notificationConstants } from '@/constants/notification.constant';
import type { NotificationDto, NotificationListResponse } from '@/types/notification';

interface ActionShape {
   type: string;
   data?: any;
   error?: string;
}

const items = (state: NotificationDto[] = [], action: ActionShape): NotificationDto[] => {
   switch (action.type) {
      case notificationConstants.GET_NOTIFICATIONS_SUCCESS: {
         const payload = action.data as NotificationListResponse;
         // First page replaces; cursor-based append lands with Plan 5.
         return payload.items ?? [];
      }
      case notificationConstants.NOTIFICATION_RECEIVED: {
         const incoming = action.data as NotificationDto;
         // Dedupe by id (multiple tabs can deliver the same push).
         if (state.some((n) => n.id === incoming.id)) return state;
         return [incoming, ...state];
      }
      case notificationConstants.MARK_NOTIFICATION_READ_SUCCESS: {
         const id = (action.data as { id: number }).id;
         return state.map((n) =>
            n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n,
         );
      }
      case notificationConstants.MARK_ALL_NOTIFICATIONS_READ_SUCCESS: {
         const now = new Date().toISOString();
         return state.map((n) => (n.readAt ? n : { ...n, readAt: now }));
      }
      default:
         return state;
   }
};

const unreadCount = (state = 0, action: ActionShape): number => {
   switch (action.type) {
      case notificationConstants.GET_NOTIFICATIONS_SUCCESS:
      case notificationConstants.GET_NOTIFICATION_SUMMARY_SUCCESS:
         return (action.data as { unreadCount: number }).unreadCount ?? 0;
      case notificationConstants.NOTIFICATION_RECEIVED: {
         const incoming = action.data as NotificationDto;
         return incoming.readAt ? state : state + 1;
      }
      case notificationConstants.MARK_NOTIFICATION_READ_SUCCESS:
         return Math.max(0, state - 1);
      case notificationConstants.MARK_ALL_NOTIFICATIONS_READ_SUCCESS:
         return 0;
      default:
         return state;
   }
};

const nextCursor = (state: string | null = null, action: ActionShape): string | null => {
   if (action.type === notificationConstants.GET_NOTIFICATIONS_SUCCESS) {
      return (action.data as NotificationListResponse).nextCursor ?? null;
   }
   return state;
};

const isLoading = (state = false, action: ActionShape): boolean => {
   switch (action.type) {
      case notificationConstants.REQUEST_GET_NOTIFICATIONS:
         return true;
      case notificationConstants.GET_NOTIFICATIONS_SUCCESS:
      case notificationConstants.GET_NOTIFICATIONS_ERROR:
         return false;
      default:
         return state;
   }
};

const isStreamConnected = (state = false, action: ActionShape): boolean => {
   switch (action.type) {
      case notificationConstants.NOTIFICATION_STREAM_OPENED:
         return true;
      case notificationConstants.NOTIFICATION_STREAM_CLOSED:
         return false;
      default:
         return state;
   }
};

const error = (state: string | null = null, action: ActionShape): string | null => {
   switch (action.type) {
      case notificationConstants.GET_NOTIFICATIONS_ERROR:
      case notificationConstants.MARK_NOTIFICATION_READ_ERROR:
      case notificationConstants.MARK_ALL_NOTIFICATIONS_READ_ERROR:
         return action.error ?? 'Notification request failed';
      case notificationConstants.GET_NOTIFICATIONS_SUCCESS:
      case notificationConstants.MARK_NOTIFICATION_READ_SUCCESS:
      case notificationConstants.MARK_ALL_NOTIFICATIONS_READ_SUCCESS:
         return null;
      default:
         return state;
   }
};

export default combineReducers({
   items,
   unreadCount,
   nextCursor,
   isLoading,
   isStreamConnected,
   error,
});
