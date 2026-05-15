import { notificationsAdminConstants } from '@/constants/notifications-admin.constant';
import { NotificationDeliveriesPage } from '@/types/notificationsAdmin.types';

/**
 * Slice for the SA-only notification delivery admin page. Separate from
 * the per-user `notification` slice (bell-icon) because the data model
 * and lifecycle are different — this one is server-paginated, gated on
 * `notifications:admin`, and persists no client cache between visits.
 */
export interface NotificationsAdminState {
   page: NotificationDeliveriesPage | null;
   isLoading: boolean;
   error: string | null;
   isMutating: boolean;
}

const initialState: NotificationsAdminState = {
   page: null,
   isLoading: false,
   error: null,
   isMutating: false,
};

interface ReducerAction {
   type: string;
   payload?: unknown;
   error?: string;
}

export default function notificationsAdminReducer(
   state: NotificationsAdminState = initialState,
   action: ReducerAction,
): NotificationsAdminState {
   switch (action.type) {
      case notificationsAdminConstants.GET_NOTIFICATIONS_ADMIN:
         return { ...state, isLoading: true, error: null };
      case notificationsAdminConstants.GET_NOTIFICATIONS_ADMIN_SUCCESS:
         return {
            ...state,
            isLoading: false,
            page: action.payload as NotificationDeliveriesPage,
         };
      case notificationsAdminConstants.GET_NOTIFICATIONS_ADMIN_FAILURE:
         return {
            ...state,
            isLoading: false,
            error:
               action.error ??
               (typeof action.payload === 'string'
                  ? action.payload
                  : 'Failed to load notifications'),
         };

      case notificationsAdminConstants.RETRY_NOTIFICATION:
      case notificationsAdminConstants.ABANDON_NOTIFICATION:
         return { ...state, isMutating: true, error: null };
      case notificationsAdminConstants.RETRY_NOTIFICATION_SUCCESS:
      case notificationsAdminConstants.ABANDON_NOTIFICATION_SUCCESS:
         return { ...state, isMutating: false };
      case notificationsAdminConstants.RETRY_NOTIFICATION_FAILURE:
      case notificationsAdminConstants.ABANDON_NOTIFICATION_FAILURE:
         return {
            ...state,
            isMutating: false,
            error:
               action.error ??
               (typeof action.payload === 'string'
                  ? action.payload
                  : 'Action failed'),
         };

      default:
         return state;
   }
}
