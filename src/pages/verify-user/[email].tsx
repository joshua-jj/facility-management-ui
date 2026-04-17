import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import React from 'react';
import axios from 'axios';
import { authConstants } from '@/constants';
import { UnknownAction } from 'redux';
import { authActions } from '@/actions';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import Tick from '../../../public/assets/icons/check.svg';
import ErrorIcon from '../../../public/assets/icons/Error.svg';
import AuthLayout from '@/components/AuthLayout';
import { useTheme } from '@/hooks/useTheme';

interface VerifyUserProps {
   success: boolean;
   message: string;
   accessToken: string;
}

export const getServerSideProps: GetServerSideProps<VerifyUserProps> = async (ctx) => {
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

const VerifyUserPage: NextPage<VerifyUserProps> = ({ success, message, accessToken }) => {
   const dispatch = useDispatch();
   const { IsResendingEmail } = useSelector((s: RootState) => s.auth);
   const { theme } = useTheme();

   const router = useRouter();
   const { email } = router.query;

   const isDark = theme === 'dark';

   const handleResend = () => {
      if (email) {
         const data = { email: email as string };
         dispatch(authActions.resendEmail(data) as unknown as UnknownAction);
      }
   };

   const handleLogin = () => {
      router.push('/login');
   };
   const heading = success ? 'Email verification successful' : 'Email verification failed';

   return (
      <AuthLayout
         title="Email Verification | EGFM - Facility Management System"
         heading={heading}
         subtitle={undefined}
      >
         <div className="animate-fade-up flex flex-col items-center text-center space-y-4 mt-2">
            {/* Status icon */}
            <div className={`p-4 rounded-full ${success ? (isDark ? 'bg-green-900/30' : 'bg-green-50') : (isDark ? 'bg-red-900/30' : 'bg-red-50')}`}>
               {success ? <Tick /> : <ErrorIcon />}
            </div>

            {/* Message */}
            <p
               className={`text-sm transition-colors ${
                  success
                     ? isDark
                        ? 'text-white/70'
                        : 'text-[#0F2552]/70'
                     : isDark
                       ? 'text-red-400'
                       : 'text-red-600'
               }`}
            >
               {message}
            </p>

            {/* Action button */}
            <div className="w-full mt-4">
               {success && accessToken ? (
                  <button
                     onClick={() =>
                        router.push({
                           pathname: '/change-password',
                           query: { email, accessToken },
                        })
                     }
                     className="w-full py-3.5 rounded-[10px] font-bold text-[0.9375rem] text-white cursor-pointer transition-all duration-200"
                     style={{
                        backgroundImage: isDark
                           ? 'linear-gradient(135deg, #1a3a7a 0%, #2a4f9a 50%, #D4A84B 100%)'
                           : 'linear-gradient(135deg, #0F2552 0%, #1a3a7a 50%, #B28309 100%)',
                        backgroundSize: '200% 200%',
                        backgroundPosition: '0% 50%',
                     }}
                     onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundPosition = '100% 50%';
                        e.currentTarget.style.boxShadow = isDark
                           ? '0 4px 16px rgba(212, 168, 75, 0.25)'
                           : '0 4px 16px rgba(15, 37, 82, 0.25)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                     }}
                     onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundPosition = '0% 50%';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                     }}
                  >
                     Proceed to change password
                  </button>
               ) : (
                  <button
                     onClick={message === 'User is already verified' ? handleLogin : handleResend}
                     className="w-full py-3.5 rounded-[10px] font-bold text-[0.9375rem] text-white cursor-pointer transition-all duration-200"
                     style={{
                        backgroundImage: isDark
                           ? 'linear-gradient(135deg, #1a3a7a 0%, #2a4f9a 50%, #D4A84B 100%)'
                           : 'linear-gradient(135deg, #0F2552 0%, #1a3a7a 50%, #B28309 100%)',
                        backgroundSize: '200% 200%',
                        backgroundPosition: '0% 50%',
                     }}
                     onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundPosition = '100% 50%';
                        e.currentTarget.style.boxShadow = isDark
                           ? '0 4px 16px rgba(212, 168, 75, 0.25)'
                           : '0 4px 16px rgba(15, 37, 82, 0.25)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                     }}
                     onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundPosition = '0% 50%';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                     }}
                  >
                     {IsResendingEmail ? (
                        <div className="flex items-center justify-center gap-2">
                           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                     ) : message === 'User is already verified' ? (
                        'Proceed to login'
                     ) : (
                        'Resend verification link'
                     )}
                  </button>
               )}
            </div>
         </div>
      </AuthLayout>
   );
};

export default VerifyUserPage;
