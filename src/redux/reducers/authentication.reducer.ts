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

const IsResendingEmail = (
  state: LoadingState = false,
  action: AuthAction
): LoadingState => {
  switch (action.type) {
    case authConstants.REQUEST_RESEND_EMAIL_LINK:
      return true;
    case authConstants.RESEND_EMAIL_LINK_SUCCESS:
    case authConstants.RESEND_EMAIL_LINK_ERROR:
      return false;
    default:
      return state;
  }
};

const IsChangingPassword = (
  state: LoadingState = false,
  action: AuthAction
): LoadingState => {
  switch (action.type) {
    case authConstants.REQUEST_CHANGE_PASSWORD:
      return true;
    case authConstants.CHANGE_PASSWORD_SUCCESS:
    case authConstants.CHANGE_PASSWORD_FAILURE:
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
  IsResendingEmail: (state: LoadingState, action: AuthAction) => LoadingState;
  IsChangingPassword: (state: LoadingState, action: AuthAction) => LoadingState;
  IsAuthenticated: (state: LoadingState, action: AuthAction) => LoadingState;
}

const rootReducer = combineReducers<RootState>({
  IsLoggingIn,
  IsResendingEmail,
  IsChangingPassword,
  IsAuthenticated,
});

export default rootReducer;
