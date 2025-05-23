import { combineReducers } from 'redux';
import { appConstants, forgotPasswordConstants } from '@/constants';
import { AuthAction, LoadingState } from '@/types';

const IsSendingResetPasswordLink = (
  state: LoadingState = false,
  action: AuthAction
): LoadingState => {
  switch (action.type) {
    case forgotPasswordConstants.REQUEST_SEND_RESET_PASSWORD_LINK:
      return true;
    case forgotPasswordConstants.SEND_RESET_PASSWORD_LINK_SUCCESS:
    case forgotPasswordConstants.SEND_RESET_PASSWORD_LINK_ERROR:
      return false;
    default:
      return state;
  }
};

const IsResettingPassword = (
  state: LoadingState = false,
  action: AuthAction
): LoadingState => {
  switch (action.type) {
    case forgotPasswordConstants.REQUEST_RESET_PASSWORD:
      return true;
    case forgotPasswordConstants.RESET_PASSWORD_SUCCESS:
    case forgotPasswordConstants.RESET_PASSWORD_ERROR:
      return false;
    default:
      return state;
  }
};

const successMessage = (
  state: LoadingState = false,
  action: AuthAction
): LoadingState => {
  switch (action.type) {
    case forgotPasswordConstants.SEND_RESET_PASSWORD_LINK_SUCCESS:
      return true;
    case appConstants.CLEAR_MESSAGES:
      return false;
    default:
      return state;
  }
};

const errorMessage = (
  state: LoadingState = false,
  action: AuthAction
): LoadingState => {
  switch (action.type) {
    case forgotPasswordConstants.SEND_RESET_PASSWORD_LINK_ERROR:
      return true;
    case appConstants.CLEAR_MESSAGES:
      return false;
    default:
      return state;
  }
};

export interface RootState {
  IsSendingResetPasswordLink: (
    state: LoadingState,
    action: AuthAction
  ) => LoadingState;
  IsResettingPassword: (
    state: LoadingState,
    action: AuthAction
  ) => LoadingState;
  successMessage: (state: LoadingState, action: AuthAction) => LoadingState;
  errorMessage: (state: LoadingState, action: AuthAction) => LoadingState;
}

const rootReducer = combineReducers<RootState>({
  IsSendingResetPasswordLink,
  IsResettingPassword,
  successMessage,
  errorMessage,
});

export default rootReducer;
