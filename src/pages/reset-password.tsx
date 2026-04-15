import React, { FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { appActions, forgotPasswordActions } from '@/actions';
import { UnknownAction } from 'redux';
import { AppEmitter } from '@/controllers/EventEmitter';
import { forgotPasswordConstants } from '@/constants';
import { useRouter } from 'next/router';
import EyeIcon from '../../public/assets/icons/Eye.svg';
import HideIcon from '../../public/assets/icons/Hide.svg';
import AuthLayout from '@/components/AuthLayout';
import { useTheme } from '@/hooks/useTheme';

const ResetPassword: FC = () => {
   const router = useRouter();
   const { token } = router?.query;

   const dispatch = useDispatch();
   const { IsResettingPassword } = useSelector((s: RootState) => s.forgotPassword);
   const { theme, mounted } = useTheme();

   const [password, setPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [passwordShow, setPasswordShow] = useState(false);
   const [confirmPasswordShow, setConfirmPasswordShow] = useState(false);
   const [errors, setErrors] = useState<Record<string, string>>({});

   const isDark = theme === 'dark';

   const canSubmit = password.length >= 8 && password === confirmPassword;

   const validate = () => {
      const errs: Record<string, string> = {};
      if (!password) errs.password = 'Password is required';
      else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
      if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
      else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
      return errs;
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      const errs = validate();
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;

      if (!token) {
         dispatch(
            appActions.setSnackBar({
               type: 'error',
               message: 'Token is required',
               variant: 'error',
            }) as unknown as UnknownAction
         );
         return;
      }

      const payload = {
         token,
         newPassword: password,
      };

      dispatch(forgotPasswordActions.resetPassword(payload) as unknown as UnknownAction);
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

   if (!mounted) return null;

   return (
      <AuthLayout
         title="Reset Password | EGFM - Facility Management System"
         heading="Reset password"
         subtitle="Enter a new password for your account"
      >
         <form onSubmit={handleSubmit}>
            {/* New Password */}
            <div className="animate-fade-up-delay-1 mb-4">
               <label
                  className={`block text-xs font-semibold mb-1.5 transition-colors ${isDark ? 'text-white/50' : 'text-[#0F2552]/70'}`}
               >
                  New password
               </label>
               <div className={`auth-field ${errors.password ? 'has-error' : ''}`}>
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
                     <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                     <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                     type={passwordShow ? 'text' : 'password'}
                     name="password"
                     placeholder="Enter your new password..."
                     value={password}
                     onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                     }}
                     autoComplete="new-password"
                  />
                  <button
                     type="button"
                     onClick={() => setPasswordShow((prev) => !prev)}
                     className={`shrink-0 cursor-pointer transition-opacity ${isDark ? 'opacity-40 hover:opacity-70' : 'opacity-50 hover:opacity-80'}`}
                     aria-label={passwordShow ? 'Hide password' : 'Show password'}
                  >
                     {passwordShow ? <EyeIcon /> : <HideIcon />}
                  </button>
               </div>
               {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="animate-fade-up-delay-2 mb-8">
               <label
                  className={`block text-xs font-semibold mb-1.5 transition-colors ${isDark ? 'text-white/50' : 'text-[#0F2552]/70'}`}
               >
                  Confirm new password
               </label>
               <div className={`auth-field ${errors.confirmPassword ? 'has-error' : ''}`}>
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
                     <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                     <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                     type={confirmPasswordShow ? 'text' : 'password'}
                     name="confirm-password"
                     placeholder="Confirm your new password..."
                     value={confirmPassword}
                     onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword)
                           setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                     }}
                     autoComplete="new-password"
                  />
                  <button
                     type="button"
                     onClick={() => setConfirmPasswordShow((prev) => !prev)}
                     className={`shrink-0 cursor-pointer transition-opacity ${isDark ? 'opacity-40 hover:opacity-70' : 'opacity-50 hover:opacity-80'}`}
                     aria-label={confirmPasswordShow ? 'Hide password' : 'Show password'}
                  >
                     {confirmPasswordShow ? <EyeIcon /> : <HideIcon />}
                  </button>
               </div>
               {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
               )}
            </div>

            {/* Submit button */}
            <div className="animate-fade-up-delay-3">
               <button
                  disabled={IsResettingPassword}
                  type="submit"
                  className="w-full py-3.5 rounded-[10px] font-bold text-[0.9375rem] transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                  style={{
                     backgroundImage:
                        !IsResettingPassword && canSubmit
                           ? isDark
                              ? 'linear-gradient(135deg, #1a3a7a 0%, #2a4f9a 50%, #D4A84B 100%)'
                              : 'linear-gradient(135deg, #0F2552 0%, #1a3a7a 50%, #B28309 100%)'
                           : 'none',
                     backgroundColor:
                        !IsResettingPassword && canSubmit
                           ? undefined
                           : isDark
                             ? 'rgba(255, 255, 255, 0.08)'
                             : 'rgba(15, 37, 82, 0.12)',
                     backgroundSize: '200% 200%',
                     backgroundPosition: '0% 50%',
                     color:
                        !IsResettingPassword && canSubmit
                           ? '#fff'
                           : isDark
                             ? 'rgba(255, 255, 255, 0.25)'
                             : 'rgba(15, 37, 82, 0.35)',
                  }}
                  onMouseEnter={(e) => {
                     if (!IsResettingPassword && canSubmit) {
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
                  {IsResettingPassword ? (
                     <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                     </div>
                  ) : (
                     'Reset password'
                  )}
               </button>
            </div>
         </form>
      </AuthLayout>
   );
};

export default ResetPassword;
