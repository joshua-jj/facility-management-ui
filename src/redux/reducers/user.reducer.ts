import { combineReducers } from 'redux';
import { authConstants, userConstants } from '@/constants';
import { Action, LoadingState, Users, UserAction, UserDetail } from '@/types';

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
    role: '',
    roleId: 0,
    departmentId: 0,
    id: 0,
    // Add other required fields with default values
  },
  action: Action
): UserDetailsState => {
  switch (action.type) {
    case authConstants.LOGIN_SUCCESS:
      return {
        ...state,
        ...(typeof action.user === 'object' && action.user !== null
          ? action.user
          : {}),
      };
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
  allUsersList: (
    state: UsersListState | undefined,
    action: AllUsersAction
  ) => UsersListState;
}

const rootReducer = combineReducers<RootState>({
  userDetails,
  IsRequestingUsers,
  IsSearchingUser,
  IsCreatingUser,
  allUsersList,
});

export default rootReducer;
