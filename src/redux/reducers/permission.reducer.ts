import { combineReducers } from 'redux';
import { permissionConstants } from '@/constants/permission.constant';
import { Permission } from '@/types/permission';

interface Action {
   type: string;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   [key: string]: any;
}

type LoadingState = boolean;
type PermissionsListState = Permission[];

interface PaginationMeta {
   currentPage: number;
   itemCount: number;
   itemsPerPage: number;
   totalItems: number;
   totalPages: number;
}

interface PermissionsPaginationState {
   meta: PaginationMeta;
}

const defaultMeta: PaginationMeta = {
   currentPage: 1,
   itemCount: 0,
   itemsPerPage: 10,
   totalItems: 0,
   totalPages: 1,
};

const IsRequestingPermissions = (state: LoadingState = false, action: Action): LoadingState => {
   switch (action.type) {
      case permissionConstants.REQUEST_GET_PERMISSIONS:
         return true;
      case permissionConstants.GET_PERMISSIONS_SUCCESS:
      case permissionConstants.GET_PERMISSIONS_FAILURE:
         return false;
      default:
         return state;
   }
};

const IsCreatingPermission = (state: LoadingState = false, action: Action): LoadingState => {
   switch (action.type) {
      case permissionConstants.REQUEST_CREATE_PERMISSION:
         return true;
      case permissionConstants.CREATE_PERMISSION_SUCCESS:
      case permissionConstants.CREATE_PERMISSION_FAILURE:
         return false;
      default:
         return state;
   }
};

const IsUpdatingPermission = (state: LoadingState = false, action: Action): LoadingState => {
   switch (action.type) {
      case permissionConstants.REQUEST_UPDATE_PERMISSION:
         return true;
      case permissionConstants.UPDATE_PERMISSION_SUCCESS:
      case permissionConstants.UPDATE_PERMISSION_FAILURE:
         return false;
      default:
         return state;
   }
};

const IsDeletingPermission = (state: LoadingState = false, action: Action): LoadingState => {
   switch (action.type) {
      case permissionConstants.REQUEST_DELETE_PERMISSION:
         return true;
      case permissionConstants.DELETE_PERMISSION_SUCCESS:
      case permissionConstants.DELETE_PERMISSION_FAILURE:
         return false;
      default:
         return state;
   }
};

const allPermissionsList = (state: PermissionsListState = [], action: Action): PermissionsListState => {
   switch (action.type) {
      case permissionConstants.GET_PERMISSIONS_SUCCESS: {
         const incoming: Permission[] = action.permissions ?? [];
         if (action.append) {
            const existingIds = new Set(state.map((item) => item.id));
            const newItems = incoming.filter((item) => !existingIds.has(item.id));
            return [...state, ...newItems];
         }
         return incoming;
      }
      default:
         return state;
   }
};

const pagination = (
   state: PermissionsPaginationState = { meta: defaultMeta },
   action: Action,
): PermissionsPaginationState => {
   switch (action.type) {
      case permissionConstants.GET_PERMISSIONS_SUCCESS: {
         if (!action.meta) return state;
         return { meta: action.meta };
      }
      default:
         return state;
   }
};

const rootReducer = combineReducers({
   IsRequestingPermissions,
   IsCreatingPermission,
   IsUpdatingPermission,
   IsDeletingPermission,
   allPermissionsList,
   pagination,
});

export default rootReducer;
