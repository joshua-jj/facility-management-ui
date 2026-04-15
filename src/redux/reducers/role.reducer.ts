import { combineReducers } from 'redux';
import { roleConstants } from '@/constants/role.constant';
import { Role } from '@/types/role';
import { Permission } from '@/types/permission';

interface Action {
   type: string;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   [key: string]: any;
}

type LoadingState = boolean;
type RolesListState = Role[];

interface PaginationMeta {
   currentPage: number;
   itemCount: number;
   itemsPerPage: number;
   totalItems: number;
   totalPages: number;
}

interface RolesPaginationState {
   meta: PaginationMeta;
}

const defaultMeta: PaginationMeta = {
   currentPage: 1,
   itemCount: 0,
   itemsPerPage: 10,
   totalItems: 0,
   totalPages: 1,
};

const IsRequestingRoles = (state: LoadingState = false, action: Action): LoadingState => {
   switch (action.type) {
      case roleConstants.REQUEST_GET_ROLES:
         return true;
      case roleConstants.GET_ROLES_SUCCESS:
      case roleConstants.GET_ROLES_FAILURE:
         return false;
      default:
         return state;
   }
};

const IsCreatingRole = (state: LoadingState = false, action: Action): LoadingState => {
   switch (action.type) {
      case roleConstants.REQUEST_CREATE_ROLE:
         return true;
      case roleConstants.CREATE_ROLE_SUCCESS:
      case roleConstants.CREATE_ROLE_FAILURE:
         return false;
      default:
         return state;
   }
};

const IsUpdatingRole = (state: LoadingState = false, action: Action): LoadingState => {
   switch (action.type) {
      case roleConstants.REQUEST_UPDATE_ROLE:
         return true;
      case roleConstants.UPDATE_ROLE_SUCCESS:
      case roleConstants.UPDATE_ROLE_FAILURE:
         return false;
      default:
         return state;
   }
};

const IsDeletingRole = (state: LoadingState = false, action: Action): LoadingState => {
   switch (action.type) {
      case roleConstants.REQUEST_DELETE_ROLE:
         return true;
      case roleConstants.DELETE_ROLE_SUCCESS:
      case roleConstants.DELETE_ROLE_FAILURE:
         return false;
      default:
         return state;
   }
};

const IsFetchingAvailablePermissions = (state: LoadingState = false, action: Action): LoadingState => {
   switch (action.type) {
      case roleConstants.REQUEST_GET_AVAILABLE_PERMISSIONS:
         return true;
      case roleConstants.GET_AVAILABLE_PERMISSIONS_SUCCESS:
      case roleConstants.GET_AVAILABLE_PERMISSIONS_FAILURE:
         return false;
      default:
         return state;
   }
};

const IsFetchingAssignedPermissions = (state: LoadingState = false, action: Action): LoadingState => {
   switch (action.type) {
      case roleConstants.REQUEST_GET_ASSIGNED_PERMISSIONS:
         return true;
      case roleConstants.GET_ASSIGNED_PERMISSIONS_SUCCESS:
      case roleConstants.GET_ASSIGNED_PERMISSIONS_FAILURE:
         return false;
      default:
         return state;
   }
};

const IsAddingPermissions = (state: LoadingState = false, action: Action): LoadingState => {
   switch (action.type) {
      case roleConstants.REQUEST_ADD_PERMISSIONS_TO_ROLE:
         return true;
      case roleConstants.ADD_PERMISSIONS_TO_ROLE_SUCCESS:
      case roleConstants.ADD_PERMISSIONS_TO_ROLE_FAILURE:
         return false;
      default:
         return state;
   }
};

const IsRemovingPermissions = (state: LoadingState = false, action: Action): LoadingState => {
   switch (action.type) {
      case roleConstants.REQUEST_REMOVE_PERMISSIONS_FROM_ROLE:
         return true;
      case roleConstants.REMOVE_PERMISSIONS_FROM_ROLE_SUCCESS:
      case roleConstants.REMOVE_PERMISSIONS_FROM_ROLE_FAILURE:
         return false;
      default:
         return state;
   }
};

const allRolesList = (state: RolesListState = [], action: Action): RolesListState => {
   switch (action.type) {
      case roleConstants.GET_ROLES_SUCCESS: {
         const incoming: Role[] = action.roles ?? [];
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

const selectedRole = (state: Role | null = null, action: Action): Role | null => {
   switch (action.type) {
      case roleConstants.GET_ROLE_SUCCESS:
         return action.role ?? null;
      default:
         return state;
   }
};

const availablePermissions = (state: Permission[] = [], action: Action): Permission[] => {
   switch (action.type) {
      case roleConstants.GET_AVAILABLE_PERMISSIONS_SUCCESS:
         return action.permissions ?? [];
      default:
         return state;
   }
};

const assignedPermissions = (state: Permission[] = [], action: Action): Permission[] => {
   switch (action.type) {
      case roleConstants.GET_ASSIGNED_PERMISSIONS_SUCCESS:
         return action.permissions ?? [];
      default:
         return state;
   }
};

const pagination = (
   state: RolesPaginationState = { meta: defaultMeta },
   action: Action,
): RolesPaginationState => {
   switch (action.type) {
      case roleConstants.GET_ROLES_SUCCESS: {
         if (!action.meta) return state;
         return { meta: action.meta };
      }
      default:
         return state;
   }
};

const error = (state: string | null = null, action: Action): string | null => {
   switch (action.type) {
      case roleConstants.GET_ROLES_FAILURE:
      case roleConstants.GET_ROLE_FAILURE:
      case roleConstants.CREATE_ROLE_FAILURE:
      case roleConstants.UPDATE_ROLE_FAILURE:
      case roleConstants.DELETE_ROLE_FAILURE:
         return action.error ?? null;
      case roleConstants.GET_ROLES_SUCCESS:
      case roleConstants.GET_ROLE_SUCCESS:
      case roleConstants.CREATE_ROLE_SUCCESS:
      case roleConstants.UPDATE_ROLE_SUCCESS:
      case roleConstants.DELETE_ROLE_SUCCESS:
         return null;
      default:
         return state;
   }
};

const rootReducer = combineReducers({
   IsRequestingRoles,
   IsCreatingRole,
   IsUpdatingRole,
   IsDeletingRole,
   IsFetchingAvailablePermissions,
   IsFetchingAssignedPermissions,
   IsAddingPermissions,
   IsRemovingPermissions,
   allRolesList,
   selectedRole,
   availablePermissions,
   assignedPermissions,
   pagination,
   error,
});

export default rootReducer;
