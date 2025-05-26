import React, { FC, useEffect, useState } from 'react';
// import Layout from '@/components/Layout';
import TextInput from '@/components/Inputs/TextInput';
import Formsy from 'formsy-react';
import { LoginForm } from '@/types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { authActions } from '@/actions';
import { UnknownAction } from 'redux';
import { AppEmitter } from '@/controllers/EventEmitter';
import { authConstants } from '@/constants';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import EyeIcon from '../../public/assets/icons/Eye.svg';
import HideIcon from '../../public/assets/icons/Hide.svg';

const Login: FC = () => {
  const router = useRouter();
  const query = router?.query;
  const decodedFrom = decodeURIComponent(
    Array.isArray(query?.from) ? query.from[0] : (query?.from ?? '')
  );
  const dispatch = useDispatch();
  const { IsLoggingIn } = useSelector((s: RootState) => s.auth);

  const [canSubmit, setCanSubmit] = useState<boolean>(false);
  const [passwordShow, setPasswordShow] = useState<boolean>(false);

  const togglePasswordVisibility = () => {
    setPasswordShow(passwordShow ? false : true);
  };

  const handleSubmit = (data: LoginForm) => {
    dispatch(authActions.login(data) as unknown as UnknownAction);
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
          className="w-md p-8 bg-white border-[0.5px] border-[rgba(15,37,82,0.15)] shadow-[8px_3px_22px_0px_rgba(150,150,150,0.15)] rounded"
        >
          <h1 className="text-[#0F2552] font-bold text-[1.5rem]">Login</h1>
          <TextInput
            inputClass="text-[#0F2552]"
            type="text"
            name="email"
            label="Email address"
            validations="isEmail"
            validationError="This is not a valid email"
            required
          />
          <TextInput
            inputClass="text-[#0F2552]"
            type={passwordShow ? 'text' : 'password'}
            name="password"
            label="Password"
            required
            endIcon={
              <div
                className="absolute top-1 right-1 cursor-pointer"
                onClick={togglePasswordVisibility}
              >
                {passwordShow ? <EyeIcon /> : <HideIcon />}
                {/* <EyeIcon className="w-5 h-5 text-[#B28309] cursor-pointer" /> */}
              </div>
            }
          />
          <Link
            href="/forgot-password"
            className="text-[#0F2552] text-sm font-semibold hover:underline"
          >
            Forgot password?
          </Link>
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
              'Login'
            )}
          </button>
        </Formsy>
      </div>
    </Layout>
  );
};

export default Login;
