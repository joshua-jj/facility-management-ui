import { userConstants } from '@/constants';
import { CreateUserForm } from '@/types';

export interface GetUsersAction {
  type: typeof userConstants.GET_USERS;
  data?: { page: number };
}

export interface SearchUserAction {
  type: typeof userConstants.SEARCH_USER;
  data: { text: string };
}
export interface GetUsersByRoleAction {
  type: typeof userConstants.GET_USERS_BY_ROLE;
  data: { roleId: number };
}

export interface CreateUserAction {
  type: typeof userConstants.CREATE_USER;
  data: CreateUserForm;
}

const getUsers = (data?: { page: number }): GetUsersAction => ({
  type: userConstants.GET_USERS,
  data,
});

const searchUser = (data: { text: string }): SearchUserAction => ({
  type: userConstants.SEARCH_USER,
  data,
});

const getUsersByRole = (data: { roleId: number }): GetUsersByRoleAction => ({
  type: userConstants.GET_USERS_BY_ROLE,
  data,
});

const createUser = (data: CreateUserForm): CreateUserAction => ({
  type: userConstants.CREATE_USER,
  data,
});

export const userActions = {
  getUsers,
  searchUser,
  getUsersByRole,
  createUser,
};
