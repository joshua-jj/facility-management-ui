import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import React from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { authConstants } from '@/constants';
import { UnknownAction } from 'redux';
import { authActions } from '@/actions';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import Tick from '../../../public/assets/icons/check.svg';
import ErrorIcon from '../../../public/assets/icons/Error.svg';

interface VerifyUserProps {
  success: boolean;
  message: string;
  accessToken: string;
}

export const getServerSideProps: GetServerSideProps<VerifyUserProps> = async (
  ctx
) => {
  const { email } = ctx.params as { email: string };
  const { token } = ctx.query as { token?: string };

  if (!token) {
    return {
      props: { success: false, message: 'Missing token', accessToken: '' },
    };
  }

  try {
    const resp = await axios.patch(
      `${authConstants.AUTH_URI}/verification`,
      { email, token },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
    // console.log('response:', resp.data);

    return {
      props: {
        success: true,
        message: resp.data?.message || 'Your account has been verified!',
        accessToken: resp.data?.data.accessToken ?? '',
      },
    };
  } catch (err: unknown) {
    const errorMessage =
      axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : err instanceof Error
          ? err.message
          : 'Something went wrong verifying your account';

    return {
      props: {
        success: false,
        message: errorMessage,
        accessToken: '',
      },
    };
  }
};

const VerifyUserPage: NextPage<VerifyUserProps> = ({
  success,
  message,
  accessToken,
}) => {
  const dispatch = useDispatch();
  const { IsResendingEmail } = useSelector((s: RootState) => s.auth);

  const router = useRouter();
  const { email } = router.query;

  const handleResend = () => {
    if (email) {
      const data = {
        email: email as string,
      };

      dispatch(authActions.resendEmail(data) as unknown as UnknownAction);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };
  // console.log('token', accessToken);

  return (
    <Layout>
      <div className="min-h-screen flex items-start justify-center pt-20 bg-gray-100">
        <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-md border-[0.5px] border-[#0F255226]">
          <div className="flex flex-col items-center text-center space-y-2">
            {success ? <Tick /> : <ErrorIcon />}
            <h1 className="text-2xl font-semibold text-textColor">
              Email verification {success ? 'successful' : 'failed'}
            </h1>
            <p className={success ? 'text-textColor' : 'text-red-600'}>
              {message}
            </p>
            {success && accessToken ? (
              <button
                onClick={() =>
                  router.push({
                    pathname: '/change-password',
                    query: { email, accessToken },
                  })
                }
                className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-6 rounded-lg transition cursor-pointer"
              >
                Proceed to change password
              </button>
            ) : (
              <button
                onClick={
                  message === 'User is already verified'
                    ? handleLogin
                    : handleResend
                }
                className="mt-4 bg-[#B28309] hover:bg-yellow-700 text-white font-medium py-2 px-6 rounded-lg transition cursor-pointer"
              >
                {IsResendingEmail ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : message === 'User is already verified' ? (
                  'Proceed to login'
                ) : (
                  'resend verification link'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VerifyUserPage;
