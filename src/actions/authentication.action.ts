import { LoginForm } from '@/types';
import { authConstants } from '@/constants';

export interface LoginAction {
  type: typeof authConstants.LOGIN;
  data: LoginForm;
}

export interface LogoutAction {
  type: typeof authConstants.LOGOUT;
}

const login = (data: LoginForm): LoginAction => ({
  type: authConstants.LOGIN,
  data,
});

const logout = (): LogoutAction => ({
  type: authConstants.LOGOUT,
});

export const authActions = {
  login,
  logout,
};
