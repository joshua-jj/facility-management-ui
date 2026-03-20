import { combineReducers } from 'redux';
import { appConstants } from '@/constants';
import { SnackAction, messageState } from '@/types';
import { capitalizeFirstLetter } from '@/utilities/helpers';

const message = (
  state: messageState = {
    message: '',
    variant: '',
  },
  action: SnackAction
): messageState => {
  switch (action.type) {
    case appConstants.CLEAR_SNACKBAR:
      return { message: '', variant: '' };
    case appConstants.SET_SNACKBAR: {
      console.log('mesage', action.data);

      const result = {
        message: capitalizeFirstLetter(
          (action.data as { message: string; variant?: string }).message
        ),
        variant:
          (action.data as { message: string; variant?: string }).variant ||
          'default',
      };
      return result;
    }
    default:
      return state;
  }
};

export interface RootState {
  message: (
    state: messageState | undefined,
    action: SnackAction
  ) => messageState;
}

const rootReducer = combineReducers<RootState>({
  message,
});

export default rootReducer;
