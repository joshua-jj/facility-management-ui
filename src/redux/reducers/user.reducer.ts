import { combineReducers } from 'redux';
import { authConstants } from '@/constants';
import { Action, UserDetail } from '@/types';

type UserDetailsState = UserDetail;

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

export interface RootState {
  userDetails: (state: UserDetailsState, action: Action) => UserDetailsState;
}

const rootReducer = combineReducers<RootState>({
  userDetails,
});

export default rootReducer;
