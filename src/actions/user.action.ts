import { userConstants } from '@/constants';
import { CreateUserForm, UpdateUserRoleForm, UserStatusForm } from '@/types';

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

export interface UpdateUserRoleAction {
  type: typeof userConstants.UPDATE_USER_ROLE;
  data: UpdateUserRoleForm;
}

export interface UserStatusAction {
  type: typeof userConstants.ACTIVATE_USER;
  data: UserStatusForm;
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

const updateUserRole = (data: UpdateUserRoleForm): UpdateUserRoleAction => ({
  type: userConstants.UPDATE_USER_ROLE,
  data,
});

const activateUser = (data: UserStatusForm): UserStatusAction => ({
  type: userConstants.ACTIVATE_USER,
  data,
});

const deactivateUser = (data: UserStatusForm): UserStatusAction => ({
  type: userConstants.DEACTIVATE_USER,
  data,
});

export const userActions = {
  getUsers,
  searchUser,
  getUsersByRole,
  createUser,
  updateUserRole,
  activateUser,
  deactivateUser,
};
