import { LoginForm } from '@/types';
import { authConstants } from '@/constants';

export interface LoginAction {
  type: typeof authConstants.LOGIN;
  data: LoginForm;
}

const login = (data: LoginForm): LoginAction => ({
  type: authConstants.LOGIN,
  data,
});

export const authActions = {
  login,
};
