import React, { FC, useEffect, useState } from 'react';
import TextInput from '@/components/Inputs/TextInput';
import Formsy from 'formsy-react';
import { ResetPasswordForm } from '@/types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { appActions, forgotPasswordActions } from '@/actions';
import { UnknownAction } from 'redux';
import { AppEmitter } from '@/controllers/EventEmitter';
import { forgotPasswordConstants } from '@/constants';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import EyeIcon from '../../public/assets/icons/Eye.svg';
import HideIcon from '../../public/assets/icons/Hide.svg';

const ResetPassword: FC = () => {
  const router = useRouter();
  const { token } = router?.query;

  const dispatch = useDispatch();
  const { IsResettingPassword } = useSelector(
    (s: RootState) => s.forgotPassword
  );

  const [canSubmit, setCanSubmit] = useState<boolean>(false);
  const [passwordShow, setPasswordShow] = useState<boolean>(false);
  const [confirmPasswordShow, setConfirmPasswordShow] =
    useState<boolean>(false);

  const togglePasswordVisibility = () => {
    setPasswordShow(passwordShow ? false : true);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordShow(confirmPasswordShow ? false : true);
  };

  const handleSubmit = (data: ResetPasswordForm) => {
    data.token = token;
    if (!data.token) {
      dispatch(appActions.setSnackBar({ type: 'error', message: 'Token is required', variant: 'error' }) as unknown as UnknownAction);
      return;
    }

    const payload = {
      token: data.token,
      newPassword: data.password,
    };

    dispatch(
      forgotPasswordActions.resetPassword(payload) as unknown as UnknownAction
    );
  };

  useEffect(() => {
    const listener = AppEmitter.addListener(
      forgotPasswordConstants.RESET_PASSWORD_SUCCESS,
      (evt: Event) => {
        const customEvent = evt as CustomEvent;
        const data = customEvent.detail;

        if (data?.message) {
          router.push('/login');
          return;
        }
      }
    );

    return () => listener.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-start md:justify-center items-center gap-8 md:gap-20 w-full h-full mt-12">
        <Formsy
          onValidSubmit={handleSubmit}
          onValid={() => setCanSubmit(true)}
          onInvalid={() => setCanSubmit(false)}
          className="w-md p-8 bg-white dark:bg-[#1a1a2e] border-[0.5px] border-[rgba(15,37,82,0.15)] dark:border-white/10 shadow-[8px_3px_22px_0px_rgba(150,150,150,0.15)] dark:shadow-none rounded transition-colors"
        >
          <h1 className="text-[#0F2552] dark:text-white font-bold text-[1.5rem]">
            Reset password
          </h1>
          <TextInput
            inputClass="text-[#0F2552] dark:text-white"
            type={passwordShow ? 'text' : 'password'}
            name="password"
            label="New password"
            endIcon={
              <div
                className="absolute top-1 right-1 cursor-pointer"
                onClick={togglePasswordVisibility}
              >
                {passwordShow ? <EyeIcon /> : <HideIcon />}
              </div>
            }
            validations="minLength:8"
            validationError="Password must be at least 8 characters"
            required
          />
          <TextInput
            inputClass="text-[#0F2552] dark:text-white"
            type={confirmPasswordShow ? 'text' : 'password'}
            name="confirm-password"
            label="Confirm new password"
            endIcon={
              <div
                className="absolute top-1 right-1 cursor-pointer"
                onClick={toggleConfirmPasswordVisibility}
              >
                {confirmPasswordShow ? <EyeIcon /> : <HideIcon />}
              </div>
            }
            validations="equalsField:password"
            validationError="Passwords do not match"
            required
          />
          <button
            disabled={!canSubmit}
            className="bg-[#B28309] rounded text-center w-full py-3 mt-8 font-normal text-[0.9rem] text-white hover:bg-[#B2830998] transition cursor-pointer flex justify-center items-center"
            type="submit"
          >
            {IsResettingPassword ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              'Reset password'
            )}
          </button>
        </Formsy>
      </div>
    </Layout>
  );
};

export default ResetPassword;
