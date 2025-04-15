import { userConstants } from '@/constants';

interface GetUsersAction {
  type: typeof userConstants.GET_USERS;
}

export interface SearchUserAction {
  type: typeof userConstants.SEARCH_USER;
  data: { text: string };
}

const getUsers = (): GetUsersAction => ({
  type: userConstants.GET_USERS,
});

const searchUser = (data: { text: string }): SearchUserAction => ({
  type: userConstants.SEARCH_USER,
  data,
});

export const userActions = {
  getUsers,
  searchUser,
};
