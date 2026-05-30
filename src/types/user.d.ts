export interface UserConstants {
  REQUEST_GET_USERS: string;
  GET_USERS_SUCCESS: string;
  GET_USERS_ERROR: string;

  REQUEST_SEARCH_USER: string;
  SEARCH_USER_SUCCESS: string;
  SEARCH_USER_ERROR: string;

  REQUEST_GET_USERS_BY_ROLE: string;
  GET_USERS_BY_ROLE_SUCCESS: string;
  GET_USERS_BY_ROLE_ERROR: string;

  REQUEST_CREATE_USER: string;
  CREATE_USER_SUCCESS: string;
  CREATE_USER_ERROR: string;

  REQUEST_UPDATE_USER: string;
  UPDATE_USER_SUCCESS: string;
  UPDATE_USER_ERROR: string;

  REQUEST_UPDATE_USER_ROLE: string;
  UPDATE_USER_ROLE_SUCCESS: string;
  UPDATE_USER_ROLE_ERROR: string;

  REQUEST_ACTIVATE_USER: string;
  ACTIVATE_USER_SUCCESS: string;
  ACTIVATE_USER_ERROR: string;

  REQUEST_DEACTIVATE_USER: string;
  DEACTIVATE_USER_SUCCESS: string;
  DEACTIVATE_USER_ERROR: string;

  REQUEST_DELETE_USER: string;
  DELETE_USER_SUCCESS: string;
  DELETE_USER_ERROR: string;

  GET_USERS: string;
  SEARCH_USER: string;
  GET_USERS_BY_ROLE: string;

  CREATE_USER: string;
  UPDATE_USER: string;
  UPDATE_USER_ROLE: string;
  ACTIVATE_USER: string;
  DEACTIVATE_USER: string;
  DELETE_USER: string;

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
  isVerified: boolean;
  roles: Array<{
    id: number;
    status: string;
    createdAt: string;
    updatedAt: null;
    createdBy: string;
    updatedBy: null;
    name: string;
    description: string;
  }>;
  /**
   * Department the user belongs to. Every user must have one per the
   * Roles & Permissions spec, but legacy rows that pre-date the
   * EnforceUserDepartmentNotNull migration may have arrived as null —
   * mark optional and treat null/undefined as "missing" in the UI.
   */
  department?: {
    id: number;
    name: string;
  } | null;
  /** Convenience FK alongside `department` — present when the API serves it. */
  departmentId?: number;
  status: number | string;
}

export interface UserDetail {
  email: string;
  firstName: string;
  id: number;
  lastName: string;
  phoneNumber: string;
  /** Array of role names (the canonical shape post-many-to-many).
   *  Display only — DO NOT gate on this. Use `permissions` instead. */
  roles?: string[];
  /** Array of role ids the user holds.
   *  Display only — DO NOT gate on this. Use `permissions` instead. */
  roleIds?: number[];
  /**
   * Flat wire-format permission strings (`subject:action`) the user
   * holds via the union of their roles. Computed server-side and
   * shipped on every login + `/authentication/me` response. This is the
   * canonical capability surface — UI gates read this, not roleId.
   *
   * `subject:manage` implies every action on that subject (handled by
   * `permissionService.has` on the way out).
   */
  permissions?: string[];
  /** @deprecated transitional — first role id only. Remove after the
   *  API drops the deprecated `roleId` field from the signin response. */
  roleId?: number;
  /** @deprecated transitional — first role name only. */
  role?: string;
  departmentId?: number;
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
  user?: Users[];
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
  /** Primary role id. Optional — server falls back to the USER default
   *  (CoreConstants.DEFAULT_ROLE) when omitted. The MEMBER role is
   *  auto-merged server-side regardless. Use the UpdateRole modal to
   *  assign additional roles after creation. */
  role?: number;
  /** Department the user belongs to. Required — every user must belong
   *  to exactly one department per the Roles & Permissions spec. */
  departmentId: number;
}

/**
 * Profile-update payload sent to PATCH /user/update/:userId. All fields are
 * optional — the server treats this as a partial update — but we always send
 * `departmentId` from the AddUser modal so admins can move a user between
 * departments via the same form they use to fix a typo'd name.
 */
export interface UpdateUserForm {
  userId: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  departmentId?: number;
}

export interface UpdateUserRoleForm {
  userId: number;
  roleIds: number[];
}

export interface UserStatusForm {
  ids: number[];
}

export interface DeleteUserForm {
  id: number;
}
