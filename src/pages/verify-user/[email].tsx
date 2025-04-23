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
    console.log('response:', resp.data);

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
  console.log('token', accessToken);

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
        <p className={success ? 'text-green-600' : 'text-red-600'}>{message}</p>

        {success && accessToken ? (
          <button
            onClick={() =>
              router.push({
                pathname: '/change-password',
                query: { email, accessToken },
              })
            }
            className="mt-6 px-4 py-2 cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Proceed to Change password
          </button>
        ) : (
          <button
            onClick={handleResend}
            className="mt-6 px-4 py-2 cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {IsResendingEmail ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              'resend verification link'
            )}
          </button>
        )}
      </div>
    </Layout>
  );
};

export default VerifyUserPage;
