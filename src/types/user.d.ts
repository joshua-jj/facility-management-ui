export interface UserConstants {
  REQUEST_GET_USERS: string;
  GET_USERS_SUCCESS: string;
  GET_USERS_ERROR: string;

  REQUEST_SEARCH_USER: string;
  SEARCH_USER_SUCCESS: string;
  SEARCH_USER_ERROR: string;

  REQUEST_CREATE_USER: string;
  CREATE_USER_SUCCESS: string;
  CREATE_USER_ERROR: string;

  GET_USERS: string;
  SEARCH_USER: string;
  CREATE_USER: string;

  USER_URI: string;
}
export interface User {
  user: { [key: string]: unknown };
  refreshToken: string;
  token: string;
  status: number;
}

export interface Users {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  gender: string;
  role: {
    id: number;
    status: string;
    createdAt: string;
    updatedAt: null;
    createdBy: string;
    updatedBy: null;
    name: string;
    description: string;
  };
  status: number | string;
}

export interface UserDetail {
  email: string;
  firstName: string;
  id: number;
  lastName: string;
  phoneNumber: string;
  role: string;
  roleId: number;
}

export interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
  user: User | null;
  userForm: UserDetail;
  loadingState: LoadingState;
}

export interface UserAction {
  type: string;
  users?: Users[];
  user?: User[s];
  message?: string;
  error?: string;
  loading?: boolean;
  success?: boolean;
  userForm?: UserDetail;
  loadingState?: LoadingState;
}

export interface CreateUserForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: number;
  departmentId?: number;
}
