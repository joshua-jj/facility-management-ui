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

export interface RootState {
  IsLoggingIn: (state: LoadingState, action: AuthAction) => LoadingState;
}

const rootReducer = combineReducers<RootState>({
  IsLoggingIn,
});

export default rootReducer;
