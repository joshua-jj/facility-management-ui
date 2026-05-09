import { combineReducers } from 'redux';
import { authConstants, userConstants } from '@/constants';
import {
  Action,
  LoadingState,
  Users,
  UserAction,
  UserDetail,
  PaginationState,
} from '@/types';
import { updateObject } from '@/utilities/reducerUtility';

type UserDetailsState = UserDetail;
type UsersListState = Users[];

interface AllUsersAction extends Action {
  users: {
    items: Users[];
    links: { [key: string]: string | number | null };
    meta: {
      currentPage: number;
      itemCount: number;
      itemsPerPage: number;
      totalItems: number;
      totalPages: number;
    };
  };
  user: Users[];
}

const userDetails = (
  state: UserDetailsState = {
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    roles: [],
    roleIds: [],
    role: '',
    roleId: 0,
    permissions: [],
    departmentId: 0,
    id: 0,
  },
  action: Action
): UserDetailsState => {
  switch (action.type) {
    case authConstants.LOGIN_SUCCESS: {
      const incoming =
        typeof action.user === 'object' && action.user !== null
          ? (action.user as Partial<UserDetailsState>)
          : {};
      // Normalise role shape: prefer roleIds[] from the new API, but
      // fall back to wrapping the deprecated single roleId so older
      // session payloads still populate the canonical array.
      const roleIds =
        incoming.roleIds ??
        (typeof incoming.roleId === 'number' && incoming.roleId > 0
          ? [incoming.roleId]
          : []);
      // Permissions land as a flat `subject:action` array from the
      // server. Default to [] for safety so hooks reading this never
      // see undefined and accidentally render "everything visible".
      const permissions = Array.isArray(incoming.permissions)
        ? incoming.permissions
        : [];
      return { ...state, ...incoming, roleIds, permissions };
    }
    default:
      return state;
  }
};

const IsRequestingUsers = (
  state: LoadingState = false,
  action: UserAction
): LoadingState => {
  switch (action.type) {
    case userConstants.REQUEST_GET_USERS:
      return true;
    case userConstants.GET_USERS_SUCCESS:
    case userConstants.GET_USERS_ERROR:
      return false;
    default:
      return state;
  }
};

const IsSearchingUser = (
  state: LoadingState = false,
  action: UserAction
): LoadingState => {
  switch (action.type) {
    case userConstants.REQUEST_SEARCH_USER:
      return true;
    case userConstants.SEARCH_USER_SUCCESS:
    case userConstants.SEARCH_USER_ERROR:
      return false;
    default:
      return state;
  }
};

const IsCreatingUser = (
  state: LoadingState = false,
  action: UserAction
): LoadingState => {
  switch (action.type) {
    case userConstants.REQUEST_CREATE_USER:
      return true;
    case userConstants.CREATE_USER_SUCCESS:
    case userConstants.CREATE_USER_ERROR:
      return false;
    default:
      return state;
  }
};

const IsUpdatingUser = (
  state: LoadingState = false,
  action: UserAction
): LoadingState => {
  switch (action.type) {
    case userConstants.REQUEST_UPDATE_USER:
      return true;
    case userConstants.UPDATE_USER_SUCCESS:
    case userConstants.UPDATE_USER_ERROR:
      return false;
    default:
      return state;
  }
};

const IsUpdatingUserRole = (
  state: LoadingState = false,
  action: UserAction
): LoadingState => {
  switch (action.type) {
    case userConstants.REQUEST_UPDATE_USER_ROLE:
      return true;
    case userConstants.UPDATE_USER_ROLE_SUCCESS:
    case userConstants.UPDATE_USER_ROLE_ERROR:
      return false;
    default:
      return state;
  }
};

/**
 * Last error message from a role-update attempt. Cleared when the next
 * REQUEST_UPDATE_USER_ROLE fires or on a successful save. The UpdateRole
 * modal reads this to surface 409 conflicts (e.g. single-HOD-per-dept)
 * inline, in addition to the global snackbar.
 */
const updateUserRoleError = (
  state: string | null = null,
  action: UserAction & { error?: string }
): string | null => {
  switch (action.type) {
    case userConstants.REQUEST_UPDATE_USER_ROLE:
    case userConstants.UPDATE_USER_ROLE_SUCCESS:
      return null;
    case userConstants.UPDATE_USER_ROLE_ERROR:
      return action.error ?? 'Failed to update user roles';
    default:
      return state;
  }
};

const allUsersList = (
  state: UsersListState = [],
  action: AllUsersAction
): UsersListState => {
  switch (action.type) {
    case userConstants.GET_USERS_SUCCESS:
      return action.users?.items ?? state;
    case userConstants.SEARCH_USER_SUCCESS:
      return action.user ?? state;
    default:
      return state;
  }
};

const roleUsersList = (
  state: UsersListState = [],
  action: AllUsersAction
): UsersListState => {
  switch (action.type) {
    case userConstants.GET_USERS_BY_ROLE_SUCCESS:
      return action.user ?? state;
    default:
      return state;
  }
};

const pagination = (
  state: PaginationState = {
    links: {
      first: null,
      last: null,
      next: null,
      previous: null,
    },
    meta: {
      currentPage: 0,
      itemCount: 0,
      itemsPerPage: 0,
      totalItems: 0,
      totalPages: 0,
    },
  },
  action: AllUsersAction
): PaginationState => {
  switch (action.type) {
    case userConstants.GET_USERS_SUCCESS: {
      const { links, meta } = action.users;
      const result = {
        links,
        meta,
      };

      return updateObject(state, result);
    }
    default:
      return state;
  }
};

export interface RootState {
  userDetails: (state: UserDetailsState, action: Action) => UserDetailsState;
  IsRequestingUsers: (
    state: LoadingState | undefined,
    action: UserAction
  ) => LoadingState;
  IsSearchingUser: (
    state: LoadingState | undefined,
    action: UserAction
  ) => LoadingState;
  IsCreatingUser: (
    state: LoadingState | undefined,
    action: UserAction
  ) => LoadingState;
  IsUpdatingUser: (
    state: LoadingState | undefined,
    action: UserAction
  ) => LoadingState;
  IsUpdatingUserRole: (
    state: LoadingState | undefined,
    action: UserAction
  ) => LoadingState;
  updateUserRoleError: (
    state: string | null | undefined,
    action: UserAction & { error?: string }
  ) => string | null;
  allUsersList: (
    state: UsersListState | undefined,
    action: AllUsersAction
  ) => UsersListState;
  roleUsersList: (
    state: UsersListState | undefined,
    action: AllUsersAction
  ) => UsersListState;
  pagination: (
    state: PaginationState | undefined,
    action: AllUsersAction
  ) => PaginationState;
}

const rootReducer = combineReducers<RootState>({
  userDetails,
  IsRequestingUsers,
  IsSearchingUser,
  IsCreatingUser,
  IsUpdatingUser,
  IsUpdatingUserRole,
  updateUserRoleError,
  allUsersList,
  roleUsersList,
  pagination,
});

export default rootReducer;
