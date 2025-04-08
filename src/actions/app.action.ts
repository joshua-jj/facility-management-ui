import { appConstants } from '../constants';
import { Action } from '@reduxjs/toolkit';
import { SetSnackBarPayload } from '@/types';

interface SetSnackBarAction {
  type: typeof appConstants.SET_SNACKBAR;
  data: SetSnackBarPayload;
}

const clearMessages = (): Action => ({
  type: appConstants.CLEAR_MESSAGES,
});

const setSnackBar = (data: SetSnackBarPayload): SetSnackBarAction => ({
  type: appConstants.SET_SNACKBAR,
  data,
});

export const appActions = {
  clearMessages,
  setSnackBar,
};
