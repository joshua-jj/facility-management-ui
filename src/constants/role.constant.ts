import { RoleConstants } from '@/types';
import { appConstants } from './app.constant';

const role: string = 'role';

export const roleConstants: RoleConstants = {
  REQUEST_GET_ROLES: 'REQUEST_GET_ROLES',
  GET_ROLES_SUCCESS: 'GET_ROLES_SUCCESS',
  GET_ROLES_ERROR: 'GET_ROLES_ERROR',

  GET_ROLES: 'GET_ROLES',

  ROLE_URI: `${appConstants.BASE_URI}${role}`,
};
