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
      return { ...state, ...incoming, roleIds };
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
  IsUpdatingUserRole: (
    state: LoadingState | undefined,
    action: UserAction
  ) => LoadingState;
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
  IsUpdatingUserRole,
  allUsersList,
  roleUsersList,
  pagination,
});

export default rootReducer;
