export interface ForgotPasswordForm {
  email: string;
}

export interface ResetPasswordForm {
  token: string | string[] | undefined;
  password: string;
  password_confirmation: string;
}

export interface IsSendingResetPasswordLinkState {
  isSending: boolean;
}

export interface IsResettingPasswordState {
  isResetting: boolean;
}

export interface SuccessMessageState {
  message: string | undefined;
}

export interface ForgotPasswordConstants {
  REQUEST_SEND_RESET_PASSWORD_LINK: string;
  SEND_RESET_PASSWORD_LINK_SUCCESS: string;
  SEND_RESET_PASSWORD_LINK_ERROR: string;

  REQUEST_RESET_PASSWORD: string;
  RESET_PASSWORD_SUCCESS: string;
  RESET_PASSWORD_ERROR: string;

  SEND_RESET_PASSWORD_LINK: string;
  RESET_PASSWORD: string;

  RESET_PASSWORD_LINK_URI: string;
  RESET_PASSWORD_URI: string;
}
