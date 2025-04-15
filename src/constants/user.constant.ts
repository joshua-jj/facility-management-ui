import { UserConstants } from '@/types';
import { appConstants } from './app.constant';

const user: string = 'user';

export const userConstants: UserConstants = {
  REQUEST_GET_USERS: 'REQUEST_GET_USERS',
  GET_USERS_SUCCESS: 'GET_USERS_SUCCESS',
  GET_USERS_ERROR: 'GET_USERS_ERROR',

  REQUEST_SEARCH_USER: 'REQUEST_SEARCH_USER',
  SEARCH_USER_SUCCESS: 'SEARCH_USER_SUCCESS',
  SEARCH_USER_ERROR: 'SEARCH_USER_ERROR',

  GET_USERS: 'GET_USERS',
  SEARCH_USER: 'SEARCH_USER',

  USER_URI: `${appConstants.BASE_URI}${user}`,
};
