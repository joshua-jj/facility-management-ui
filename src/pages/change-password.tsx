import React, { FC, useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import TextInput from '@/components/Inputs/TextInput';
import Formsy from 'formsy-react';
import { ChangePasswordForm } from '@/types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { authActions } from '@/actions';
import { UnknownAction } from 'redux';
import { AppEmitter } from '@/controllers/EventEmitter';
import { authConstants } from '@/constants';
import { useRouter } from 'next/router';
import EyeIcon from '../../public/assets/icons/Eye.svg';
import HideIcon from '../../public/assets/icons/Hide.svg';

const ChangePassword: FC = () => {
  const router = useRouter();
  const query = router?.query;

  const dispatch = useDispatch();
  const { IsChangingPassword } = useSelector((s: RootState) => s.auth);

  const [canSubmit, setCanSubmit] = useState<boolean>(false);
  const [oldPasswordShow, setOldPasswordShow] = useState<boolean>(false);
  const [passwordShow, setPasswordShow] = useState<boolean>(false);
  const [confirmPasswordShow, setConfirmPasswordShow] =
    useState<boolean>(false);

  const toggleOldPasswordVisibility = () => {
    setOldPasswordShow(oldPasswordShow ? false : true);
  };

  const togglePasswordVisibility = () => {
    setPasswordShow(passwordShow ? false : true);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordShow(confirmPasswordShow ? false : true);
  };

  const handleSubmit = (data: ChangePasswordForm) => {
    // data.email = query?.email as string;
    data.token = query?.accessToken as string;
    delete data.confirmNewPassword;

    dispatch(authActions.changePassword(data) as unknown as UnknownAction);
  };

  useEffect(() => {
    const listener = AppEmitter.addListener(
      authConstants.CHANGE_PASSWORD_SUCCESS,
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
          className="w-md p-8 bg-white shadow-[8px_3px_22px_0px_rgba(150, 150, 150, 0.15)] rounded"
        >
          <h1 className="text-[#0F2552] font-bold text-[1.5rem]">
            Change Password
          </h1>
          <TextInput
            inputClass="text-[#0F2552]"
            type={oldPasswordShow ? 'text' : 'password'}
            name="oldPassword"
            label="Old Password"
            endIcon={
              <div
                className="absolute top-1 right-1 cursor-pointer"
                onClick={toggleOldPasswordVisibility}
              >
                {oldPasswordShow ? <EyeIcon /> : <HideIcon />}
              </div>
            }
          />
          <TextInput
            inputClass="text-[#0F2552]"
            type={passwordShow ? 'text' : 'password'}
            name="newPassword"
            label="New Password"
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
          />
          <TextInput
            inputClass="text-[#0F2552]"
            type={confirmPasswordShow ? 'text' : 'password'}
            name="confirmNewPassword"
            label="Confirm New Password"
            endIcon={
              <div
                className="absolute top-1 right-1 cursor-pointer"
                onClick={toggleConfirmPasswordVisibility}
              >
                {confirmPasswordShow ? <EyeIcon /> : <HideIcon />}
              </div>
            }
            validations="equalsField:newPassword"
            validationError="Passwords do not match"
          />
          <button
            disabled={!canSubmit}
            className="bg-[#B28309] rounded text-center w-full py-3 mt-8 font-normal text-[0.9rem] text-white hover:bg-[#B2830998] transition cursor-pointer flex justify-center items-center"
            type="submit"
          >
            {IsChangingPassword ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              'Change Password'
            )}
          </button>
        </Formsy>
      </div>
    </Layout>
  );
};

export default ChangePassword;
