import React, { FC, useEffect, useState } from 'react';
import TextInput from '@/components/Inputs/TextInput';
import Formsy from 'formsy-react';
import { ResetPasswordForm } from '@/types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { forgotPasswordActions } from '@/actions';
import { UnknownAction } from 'redux';
import { AppEmitter } from '@/controllers/EventEmitter';
import { authConstants } from '@/constants';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import EyeIcon from '../../public/assets/icons/Eye.svg';
import HideIcon from '../../public/assets/icons/Hide.svg';

const ResetPassword: FC = () => {
  const router = useRouter();
  const { token } = router?.query;

  const dispatch = useDispatch();
  const { IsLoggingIn } = useSelector((s: RootState) => s.auth);

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
      alert('Token is required');
      return;
    }

    dispatch(
      forgotPasswordActions.resetPassword(data) as unknown as UnknownAction
    );
  };

  useEffect(() => {
    const listener = AppEmitter.addListener(
      authConstants.LOGIN_SUCCESS,
      (evt: Event) => {
        const customEvent = evt as CustomEvent;
        const data = customEvent.detail?.data;

        if (data) {
          router.push('/admin/dashboard');
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
          className="w-md p-8 bg-white border-[0.5px] border-[rgba(15,37,82,0.15)] shadow-[8px_3px_22px_0px_rgba(150,150,150,0.15)] rounded"
        >
          <h1 className="text-[#0F2552] font-bold text-[1.5rem]">
            Reset password
          </h1>
          <TextInput
            inputClass="text-[#0F2552]"
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
            inputClass="text-[#0F2552]"
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
            {IsLoggingIn ? (
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
