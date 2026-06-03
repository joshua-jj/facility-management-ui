import { notificationsAdminConstants } from '@/constants/notifications-admin.constant';
import {
   NotificationDelivery,
   NotificationDeliveriesPage,
} from '@/types/notificationsAdmin.types';

/**
 * Slice for the SA-only notification delivery admin page. Separate from
 * the per-user `notification` slice (bell-icon) because the data model
 * and lifecycle are different — this one is server-paginated, gated on
 * `notifications:admin`, and persists no client cache between visits.
 *
 * `selected` is the single-row state used by the detail page
 * (/admin/notifications/[id]). Loaded via the GET_NOTIFICATION_ADMIN
 * saga; cleared on each detail-page mount so we don't render stale
 * data for one notification while we fetch another.
 */
export interface NotificationsAdminState {
   page: NotificationDeliveriesPage | null;
   isLoading: boolean;
   error: string | null;
   isMutating: boolean;
   selected: NotificationDelivery | null;
   isLoadingSelected: boolean;
   selectedError: string | null;
}

const initialState: NotificationsAdminState = {
   page: null,
   isLoading: false,
   error: null,
   isMutating: false,
   selected: null,
   isLoadingSelected: false,
   selectedError: null,
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

      case notificationsAdminConstants.GET_NOTIFICATION_ADMIN:
         return {
            ...state,
            isLoadingSelected: true,
            selectedError: null,
            // Clear previous selection so the UI doesn't briefly render
            // the wrong row while the new one is in flight.
            selected: null,
         };
      case notificationsAdminConstants.GET_NOTIFICATION_ADMIN_SUCCESS:
         return {
            ...state,
            isLoadingSelected: false,
            selected: action.payload as NotificationDelivery,
         };
      case notificationsAdminConstants.GET_NOTIFICATION_ADMIN_FAILURE:
         return {
            ...state,
            isLoadingSelected: false,
            selectedError:
               action.error ??
               (typeof action.payload === 'string'
                  ? action.payload
                  : 'Failed to load notification'),
         };

      case notificationsAdminConstants.RETRY_NOTIFICATION:
      case notificationsAdminConstants.ABANDON_NOTIFICATION:
      case notificationsAdminConstants.DELETE_NOTIFICATION:
         return { ...state, isMutating: true, error: null };
      case notificationsAdminConstants.RETRY_NOTIFICATION_SUCCESS:
      case notificationsAdminConstants.ABANDON_NOTIFICATION_SUCCESS: {
         // The saga returns the mutated row DTO. If we're on the detail
         // page viewing this row, merge the updated state instantly so
         // the status chip flips before the auto-refetch completes.
         const mutated = action.payload as NotificationDelivery | null;
         const selectedUpdated =
            mutated && state.selected && mutated.id === state.selected.id
               ? mutated
               : state.selected;
         return { ...state, isMutating: false, selected: selectedUpdated };
      }
      case notificationsAdminConstants.DELETE_NOTIFICATION_SUCCESS:
         return { ...state, isMutating: false };

      case notificationsAdminConstants.RETRY_NOTIFICATION_FAILURE:
      case notificationsAdminConstants.ABANDON_NOTIFICATION_FAILURE:
      case notificationsAdminConstants.DELETE_NOTIFICATION_FAILURE:
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
