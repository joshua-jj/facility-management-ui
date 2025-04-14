import { combineReducers } from 'redux';
import { authConstants } from '@/constants';
import { AuthAction, LoadingState } from '@/types';

const IsLoggingIn = (
  state: LoadingState = false,
  action: AuthAction
): LoadingState => {
  switch (action.type) {
    case authConstants.LOGGING_IN:
      return true;
    case authConstants.LOGIN_SUCCESS:
    case authConstants.LOGIN_FAILURE:
      return false;
    default:
      return state;
  }
};
const IsAuthenticated = (
  state: LoadingState = false,
  action: AuthAction
): LoadingState => {
  switch (action.type) {
    case authConstants.LOGIN_SUCCESS:
      return true;
    case authConstants.LOGOUT_SUCCESS:
    case authConstants.TOKEN_HAS_EXPIRED:
      return false;
    default:
      return state;
  }
};

export interface RootState {
  IsLoggingIn: (state: LoadingState, action: AuthAction) => LoadingState;
  IsAuthenticated: (state: LoadingState, action: AuthAction) => LoadingState;
}

const rootReducer = combineReducers<RootState>({
  IsLoggingIn,
  IsAuthenticated,
});

export default rootReducer;
