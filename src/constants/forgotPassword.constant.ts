import { ForgotPasswordConstants } from '@/types';
import { appConstants } from './app.constant';

// const resetPasswordLink: string = 'resetPasswordLink';
const user: string = 'users';

export const forgotPasswordConstants: ForgotPasswordConstants = {
  REQUEST_SEND_RESET_PASSWORD_LINK: 'REQUEST_SEND_RESET_PASSWORD_LINK',
  SEND_RESET_PASSWORD_LINK_SUCCESS: 'SEND_RESET_PASSWORD_LINK_SUCCESS',
  SEND_RESET_PASSWORD_LINK_ERROR: 'SEND_RESET_PASSWORD_LINK_ERROR',

  REQUEST_RESET_PASSWORD: 'REQUEST_RESET_PASSWORD',
  RESET_PASSWORD_SUCCESS: 'RESET_PASSWORD_SUCCESS',
  RESET_PASSWORD_ERROR: 'RESET_PASSWORD_ERROR',

  SEND_RESET_PASSWORD_LINK: 'SEND_RESET_PASSWORD_LINK',
  RESET_PASSWORD: 'RESET_PASSWORD',

  RESET_PASSWORD_LINK_URI: `${appConstants.BASE_URI}${user}`,
  RESET_PASSWORD_URI: `${appConstants.BASE_URI}${user}`,
};
