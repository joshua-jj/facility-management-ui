import { ChangePasswordForm, LoginForm, ResendLinkForm } from '@/types';
import { authConstants } from '@/constants';

export interface LoginAction {
  type: typeof authConstants.LOGIN;
  data: LoginForm;
}

export interface ResendEmailAction {
  type: typeof authConstants.RESEND_EMAIL_LINK;
  data: ResendLinkForm;
}
export interface ChangePasswordAction {
  type: typeof authConstants.CHANGE_PASSWORD;
  data: ChangePasswordForm;
}

export interface LogoutAction {
  type: typeof authConstants.LOGOUT;
}

const login = (data: LoginForm): LoginAction => ({
  type: authConstants.LOGIN,
  data,
});

const resendEmail = (data: ResendLinkForm): ResendEmailAction => ({
  type: authConstants.RESEND_EMAIL_LINK,
  data,
});

const changePassword = (data: ChangePasswordForm): ChangePasswordAction => ({
  type: authConstants.CHANGE_PASSWORD,
  data,
});

const logout = (): LogoutAction => ({
  type: authConstants.LOGOUT,
});

export const authActions = {
  login,
  resendEmail,
  changePassword,
  logout,
};
