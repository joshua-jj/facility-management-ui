import React, { FC, useEffect, useState } from 'react';
import TextInput from '@/components/Inputs/TextInput';
import Formsy from 'formsy-react';
import { ForgotPasswordForm } from '@/types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { forgotPasswordActions } from '@/actions';
import { UnknownAction } from 'redux';
import { AppEmitter } from '@/controllers/EventEmitter';
import { authConstants } from '@/constants';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';

const ForgotPassword: FC = () => {
  const router = useRouter();
  const query = router?.query;
  const decodedFrom = decodeURIComponent(
    Array.isArray(query?.from) ? query.from[0] : (query?.from ?? '')
  );
  const dispatch = useDispatch();
  const { IsSendingResetPasswordLink } = useSelector(
    (s: RootState) => s.forgotPassword
  );

  const [canSubmit, setCanSubmit] = useState<boolean>(false);

  const handleSubmit = (data: ForgotPasswordForm) => {
    dispatch(
      forgotPasswordActions.forgotPassword(data) as unknown as UnknownAction
    );
  };

  useEffect(() => {
    const listener = AppEmitter.addListener(
      authConstants.LOGIN_SUCCESS,
      (evt: Event) => {
        const customEvent = evt as CustomEvent;
        const data = customEvent.detail?.data;

        if (data && decodedFrom?.length) {
          router.push({
            pathname: decodedFrom,
          });
          return;
        }

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
          className="w-md p-8 bg-white dark:bg-[#1a1a2e] border-[0.5px] border-[rgba(15,37,82,0.15)] dark:border-white/10 shadow-[8px_3px_22px_0px_rgba(150,150,150,0.15)] dark:shadow-none rounded transition-colors"
        >
          <h1 className="text-[#0F2552] dark:text-white font-bold text-[1.5rem]">
            Forgot password?
          </h1>
          <p className="text-[#0F2552] dark:text-white/70 text-sm">
            Enter your email address we&apos;ll send you a link to reset your
            password
          </p>
          <TextInput
            inputClass="text-[#0F2552] dark:text-white"
            type="text"
            name="email"
            label="Email address"
            placeholder="Enter email address"
            validations="isEmail"
            validationError="This is not a valid email"
            required
          />
          <button
            disabled={!canSubmit}
            className="bg-[#B28309] rounded text-center w-full py-3 mt-8 font-normal text-[0.9rem] text-white hover:bg-[#B2830998] transition cursor-pointer flex justify-center items-center"
            type="submit"
          >
            {IsSendingResetPasswordLink ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              'Send'
            )}
          </button>
        </Formsy>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
