import React, { FC, useEffect, useState } from 'react';
import { ForgotPasswordForm } from '@/types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { forgotPasswordActions } from '@/actions';
import { UnknownAction } from 'redux';
import { AppEmitter } from '@/controllers/EventEmitter';
import { authConstants } from '@/constants';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import { useTheme } from '@/hooks/useTheme';

const ForgotPassword: FC = () => {
   const router = useRouter();
   const query = router?.query;
   const decodedFrom = decodeURIComponent(
      Array.isArray(query?.from) ? query.from[0] : (query?.from ?? '')
   );
   const dispatch = useDispatch();
   const { IsSendingResetPasswordLink } = useSelector((s: RootState) => s.forgotPassword);
   const { theme, mounted } = useTheme();

   const [email, setEmail] = useState('');
   const [emailError, setEmailError] = useState('');

   const isDark = theme === 'dark';

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (!email) {
         setEmailError('Email is required');
         return;
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
         setEmailError('Please enter a valid email');
         return;
      }

      const data: ForgotPasswordForm = { email };
      dispatch(forgotPasswordActions.forgotPassword(data) as unknown as UnknownAction);
   };

   useEffect(() => {
      const listener = AppEmitter.addListener(authConstants.LOGIN_SUCCESS, (evt: Event) => {
         const customEvent = evt as CustomEvent;
         const data = customEvent.detail?.data;

         if (data && decodedFrom?.length) {
            router.push({ pathname: decodedFrom });
            return;
         }

         if (data) {
            router.push('/admin/dashboard');
            return;
         }
      });

      return () => listener.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   if (!mounted) return null;

   return (
      <AuthLayout
         title="Forgot Password | EGFM - Facility Management System"
         heading="Forgot password?"
         subtitle="Enter your email address and we'll send you a link to reset your password"
         footer={
            <Link
               href="/login"
               className={`text-xs font-semibold hover:underline transition-colors ${isDark ? 'text-[#D4A84B] hover:text-[#e8bc5f]' : 'text-[#0F2552] hover:text-[#B28309]'}`}
            >
               Remember your password? Log in
            </Link>
         }
      >
         <form onSubmit={handleSubmit}>
            {/* Email field */}
            <div className="animate-fade-up-delay-1 mb-8">
               <label
                  className={`block text-xs font-semibold mb-1.5 transition-colors ${isDark ? 'text-white/50' : 'text-[#0F2552]/70'}`}
               >
                  Email address
               </label>
               <div className={`auth-field ${emailError ? 'has-error' : ''}`}>
                  <svg
                     width="20"
                     height="20"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke={isDark ? '#E1E1E6' : '#0F2552'}
                     strokeWidth="1.5"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     className="opacity-40 shrink-0"
                  >
                     <rect x="2" y="4" width="20" height="16" rx="2" />
                     <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                     type="email"
                     name="email"
                     placeholder="Enter your email address..."
                     value={email}
                     onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                     }}
                     autoComplete="email"
                  />
               </div>
               {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            </div>

            {/* Submit button */}
            <div className="animate-fade-up-delay-2">
               <button
                  disabled={IsSendingResetPasswordLink}
                  type="submit"
                  className="w-full py-3.5 rounded-[10px] font-bold text-[0.9375rem] transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                  style={{
                     backgroundImage:
                        !IsSendingResetPasswordLink && email
                           ? isDark
                              ? 'linear-gradient(135deg, #1a3a7a 0%, #2a4f9a 50%, #D4A84B 100%)'
                              : 'linear-gradient(135deg, #0F2552 0%, #1a3a7a 50%, #B28309 100%)'
                           : 'none',
                     backgroundColor:
                        !IsSendingResetPasswordLink && email
                           ? undefined
                           : isDark
                             ? 'rgba(255, 255, 255, 0.08)'
                             : 'rgba(15, 37, 82, 0.12)',
                     backgroundSize: '200% 200%',
                     backgroundPosition: '0% 50%',
                     color:
                        !IsSendingResetPasswordLink && email
                           ? '#fff'
                           : isDark
                             ? 'rgba(255, 255, 255, 0.25)'
                             : 'rgba(15, 37, 82, 0.35)',
                  }}
                  onMouseEnter={(e) => {
                     if (!IsSendingResetPasswordLink && email) {
                        e.currentTarget.style.backgroundPosition = '100% 50%';
                        e.currentTarget.style.boxShadow = isDark
                           ? '0 4px 16px rgba(212, 168, 75, 0.25)'
                           : '0 4px 16px rgba(15, 37, 82, 0.25)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                     }
                  }}
                  onMouseLeave={(e) => {
                     e.currentTarget.style.backgroundPosition = '0% 50%';
                     e.currentTarget.style.boxShadow = 'none';
                     e.currentTarget.style.transform = 'translateY(0)';
                  }}
               >
                  {IsSendingResetPasswordLink ? (
                     <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                     </div>
                  ) : (
                     'Send reset link'
                  )}
               </button>
            </div>
         </form>
      </AuthLayout>
   );
};

export default ForgotPassword;
