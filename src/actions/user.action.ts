import { userConstants } from '@/constants';
import {
  CreateUserForm,
  UpdateUserForm,
  UpdateUserRoleForm,
  UserStatusForm,
} from '@/types';

export interface GetUsersAction {
  type: typeof userConstants.GET_USERS;
  data?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    roleId?: number;
    departmentId?: number;
    gender?: string;
  };
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

export interface UpdateUserAction {
  type: typeof userConstants.UPDATE_USER;
  data: UpdateUserForm;
}

export interface UpdateUserRoleAction {
  type: typeof userConstants.UPDATE_USER_ROLE;
  data: UpdateUserRoleForm;
}

export interface UserStatusAction {
  type: typeof userConstants.ACTIVATE_USER;
  data: UserStatusForm;
}

const getUsers = (data?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  roleId?: number;
  departmentId?: number;
  gender?: string;
}): GetUsersAction => ({
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

const updateUser = (data: UpdateUserForm): UpdateUserAction => ({
  type: userConstants.UPDATE_USER,
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
  updateUser,
  updateUserRole,
  activateUser,
  deactivateUser,
};
