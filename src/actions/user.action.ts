import { userConstants } from '@/constants';
import { CreateUserForm } from '@/types';

interface GetUsersAction {
  type: typeof userConstants.GET_USERS;
}

export interface SearchUserAction {
  type: typeof userConstants.SEARCH_USER;
  data: { text: string };
}
export interface CreateUserAction {
  type: typeof userConstants.CREATE_USER;
  data: CreateUserForm;
}

const getUsers = (): GetUsersAction => ({
  type: userConstants.GET_USERS,
});

const searchUser = (data: { text: string }): SearchUserAction => ({
  type: userConstants.SEARCH_USER,
  data,
});

const createUser = (data: CreateUserForm): CreateUserAction => ({
  type: userConstants.CREATE_USER,
  data,
});

export const userActions = {
  getUsers,
  searchUser,
  createUser,
};
