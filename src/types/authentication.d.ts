export interface LoginForm {
  email: string;
  password: string;
}
export interface ResendLinkForm {
  email: string;
}

export interface ChangePasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword?: string;
  email?: string;
  token?: string;
}

export interface AuthConstants {
  LOGIN: string;
  LOGGING_IN: string;
  LOGIN_SUCCESS: string;
  LOGIN_FAILURE: string;

  LOGOUT: string;
  LOGGING_OUT: string;
  LOGOUT_SUCCESS: string;
  LOGOUT_FAILURE: string;

  VERIFY_EMAIL: string;
  REQUEST_VERIFY_EMAIL: string;
  VERIFY_EMAIL_SUCCESS: string;
  VERIFY_EMAIL_ERROR: string;

  RESEND_EMAIL_LINK: string;
  REQUEST_RESEND_EMAIL_LINK: string;
  RESEND_EMAIL_LINK_SUCCESS: string;
  RESEND_EMAIL_LINK_ERROR: string;

  CHANGE_PASSWORD: string;
  REQUEST_CHANGE_PASSWORD: string;
  CHANGE_PASSWORD_SUCCESS: string;
  CHANGE_PASSWORD_FAILURE: string;

  TOKEN_HAS_EXPIRED: string;
  USER_KEY: string;
  USER_ROLE_ID: number;

  LOGIN_URI: string;
  AUTH_URI: string;
}

export interface AuthAction {
  type: string;
  message?: string;
  error?: string;
  loading?: boolean;
  success?: boolean;
  loadingState?: LoadingState;
  paginationState?: PaginationState;
}
