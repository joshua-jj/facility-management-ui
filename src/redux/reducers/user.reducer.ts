import { combineReducers } from 'redux';
import { authConstants, userConstants } from '@/constants';
import { Action, LoadingState, Users, UserAction, UserDetail } from '@/types';

type UserDetailsState = UserDetail;
type UsersListState = Users[];

const userDetails = (
  state: UserDetailsState = {
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: '',
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
  action: UserAction
): UsersListState => {
  switch (action.type) {
    case userConstants.GET_USERS_SUCCESS:
      return action.users ?? state;
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
    action: UserAction
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
