import { ForgotPasswordForm, ResetPasswordPayload } from '@/types';
import { forgotPasswordConstants } from '@/constants';

export interface ForgotPasswordAction {
  type: typeof forgotPasswordConstants.SEND_RESET_PASSWORD_LINK;
  data: ForgotPasswordForm;
}

export interface ResetPasswordAction {
  type: typeof forgotPasswordConstants.RESET_PASSWORD;
  data: ResetPasswordPayload;
}

const forgotPassword = (data: ForgotPasswordForm): ForgotPasswordAction => ({
  type: forgotPasswordConstants.SEND_RESET_PASSWORD_LINK,
  data,
});

const resetPassword = (data: ResetPasswordPayload): ResetPasswordAction => ({
  type: forgotPasswordConstants.RESET_PASSWORD,
  data,
});

export const forgotPasswordActions = {
  forgotPassword,
  resetPassword,
};
