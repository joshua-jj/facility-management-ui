import React, { FC, useEffect, useState } from 'react';
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
import Head from 'next/head';
import Image from 'next/image';
import { useTheme } from '@/hooks/useTheme';
import ThemeToggle from '@/components/ThemeToggle';

const ChangePassword: FC = () => {
   const router = useRouter();
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   const _query = router?.query;

   const dispatch = useDispatch();
   const { IsChangingPassword } = useSelector((s: RootState) => s.auth);
   const { theme } = useTheme();

   const [oldPassword, setOldPassword] = useState('');
   const [newPassword, setNewPassword] = useState('');
   const [confirmNewPassword, setConfirmNewPassword] = useState('');
   const [oldPasswordShow, setOldPasswordShow] = useState(false);
   const [passwordShow, setPasswordShow] = useState(false);
   const [confirmPasswordShow, setConfirmPasswordShow] = useState(false);
   const [errors, setErrors] = useState<Record<string, string>>({});

   const isDark = theme === 'dark';

   const validate = () => {
      const errs: Record<string, string> = {};
      if (!oldPassword) errs.oldPassword = 'Old password is required';
      if (!newPassword) errs.newPassword = 'New password is required';
      else if (newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters';
      if (!confirmNewPassword) errs.confirmNewPassword = 'Please confirm your password';
      else if (newPassword !== confirmNewPassword) errs.confirmNewPassword = 'Passwords do not match';
      return errs;
   };

   const canSubmit = oldPassword && newPassword.length >= 8 && newPassword === confirmNewPassword;

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validate();
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;

      const data: ChangePasswordForm = {
         oldPassword,
         newPassword,
      };

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
         },
      );

      return () => listener.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);
   return (
      <>
         <Head>
            <title>Change Password | EGFM - Facility Management System</title>
            <meta charSet="UTF-8" />
            <meta name="description" content="EGFM - Facility Management System" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
         </Head>

         <div
            className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0e0e1a]' : 'bg-[#fafafa]'}`}
         >
            {/* Background glows */}
            <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
               <div
                  className="absolute rounded-full"
                  style={{
                     top: '-25%',
                     right: '-15%',
                     width: '60vw',
                     height: '60vw',
                     background: `radial-gradient(circle, rgba(15,37,82,${isDark ? '0.12' : '0.04'}) 0%, transparent 65%)`,
                     filter: 'blur(40px)',
                  }}
               />
               <div
                  className="absolute rounded-full"
                  style={{
                     bottom: '-30%',
                     left: '-20%',
                     width: '70vw',
                     height: '70vw',
                     background: `radial-gradient(circle, rgba(178,131,9,${isDark ? '0.08' : '0.04'}) 0%, transparent 60%)`,
                     filter: 'blur(40px)',
                  }}
               />
            </div>

            {/* Theme toggle */}
            <ThemeToggle className="fixed top-6 right-6 z-20" />

            {/* Logo */}
            <div className="animate-fade-in-scale mb-8 flex flex-col items-center z-10">
               <Image
                  src="/assets/images/egfm-logo.png"
                  alt="EGFM Logo"
                  width={72}
                  height={72}
                  unoptimized
                  className={isDark ? 'brightness-125 saturate-[0.9]' : ''}
               />
               <span
                  className={`mt-2 text-sm font-semibold tracking-[0.12em] uppercase transition-colors ${isDark ? 'text-white/80' : 'text-[#0F2552]'}`}
               >
                  Logistics
               </span>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handleSubmit} className="w-full max-w-[420px] mx-auto px-4 z-10">
               <div className="animate-fade-up">
                  <h1
                     className={`font-extrabold text-2xl tracking-tight transition-colors ${isDark ? 'text-white' : 'text-[#0F2552]'}`}
                  >
                     Change Password
                  </h1>
                  <p
                     className={`text-sm mt-1 mb-8 transition-colors ${isDark ? 'text-white/40' : 'text-[#0F2552]/60'}`}
                  >
                     Set a new password for your account
                  </p>
               </div>

               {/* Old Password */}
               <div className="animate-fade-up-delay-1 mb-4">
                  <label
                     className={`block text-xs font-semibold mb-1.5 transition-colors ${isDark ? 'text-white/50' : 'text-[#0F2552]/70'}`}
                  >
                     Old Password
                  </label>
                  <div className={`auth-field ${errors.oldPassword ? 'has-error' : ''}`}>
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
                        type={oldPasswordShow ? 'text' : 'password'}
                        name="oldPassword"
                        placeholder="Enter your old password..."
                        value={oldPassword}
                        onChange={(e) => {
                           setOldPassword(e.target.value);
                           if (errors.oldPassword) setErrors((prev) => ({ ...prev, oldPassword: '' }));
                        }}
                        autoComplete="current-password"
                     />
                     <button
                        type="button"
                        onClick={() => setOldPasswordShow((prev) => !prev)}
                        className={`shrink-0 cursor-pointer transition-opacity opacity-60 hover:opacity-100 ${isDark ? 'text-white' : 'text-[#0F2552]'}`}
                        aria-label={oldPasswordShow ? 'Hide password' : 'Show password'}
                     >
                        {oldPasswordShow ? <EyeIcon /> : <HideIcon />}
                     </button>
                  </div>
                  {errors.oldPassword && <p className="text-red-500 text-xs mt-1">{errors.oldPassword}</p>}
               </div>

               {/* New Password */}
               <div className="animate-fade-up-delay-2 mb-4">
                  <label
                     className={`block text-xs font-semibold mb-1.5 transition-colors ${isDark ? 'text-white/50' : 'text-[#0F2552]/70'}`}
                  >
                     New Password
                  </label>
                  <div className={`auth-field ${errors.newPassword ? 'has-error' : ''}`}>
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
                        name="newPassword"
                        placeholder="Enter your new password..."
                        value={newPassword}
                        onChange={(e) => {
                           setNewPassword(e.target.value);
                           if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                        }}
                        autoComplete="new-password"
                     />
                     <button
                        type="button"
                        onClick={() => setPasswordShow((prev) => !prev)}
                        className={`shrink-0 cursor-pointer transition-opacity opacity-60 hover:opacity-100 ${isDark ? 'text-white' : 'text-[#0F2552]'}`}
                        aria-label={passwordShow ? 'Hide password' : 'Show password'}
                     >
                        {passwordShow ? <EyeIcon /> : <HideIcon />}
                     </button>
                  </div>
                  {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
               </div>

               {/* Confirm New Password */}
               <div className="animate-fade-up-delay-3 mb-8">
                  <label
                     className={`block text-xs font-semibold mb-1.5 transition-colors ${isDark ? 'text-white/50' : 'text-[#0F2552]/70'}`}
                  >
                     Confirm New Password
                  </label>
                  <div className={`auth-field ${errors.confirmNewPassword ? 'has-error' : ''}`}>
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
                        name="confirmNewPassword"
                        placeholder="Confirm your new password..."
                        value={confirmNewPassword}
                        onChange={(e) => {
                           setConfirmNewPassword(e.target.value);
                           if (errors.confirmNewPassword)
                              setErrors((prev) => ({ ...prev, confirmNewPassword: '' }));
                        }}
                        autoComplete="new-password"
                     />
                     <button
                        type="button"
                        onClick={() => setConfirmPasswordShow((prev) => !prev)}
                        className={`shrink-0 cursor-pointer transition-opacity opacity-60 hover:opacity-100 ${isDark ? 'text-white' : 'text-[#0F2552]'}`}
                        aria-label={confirmPasswordShow ? 'Hide password' : 'Show password'}
                     >
                        {confirmPasswordShow ? <EyeIcon /> : <HideIcon />}
                     </button>
                  </div>
                  {errors.confirmNewPassword && (
                     <p className="text-red-500 text-xs mt-1">{errors.confirmNewPassword}</p>
                  )}
               </div>

               {/* Submit button */}
               <div className="animate-fade-up-delay-4">
                  <button
                     disabled={IsChangingPassword}
                     type="submit"
                     className="w-full py-3.5 rounded-[10px] font-bold text-[0.9375rem] transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                     style={{
                        backgroundImage:
                           !IsChangingPassword && canSubmit
                              ? isDark
                                 ? 'linear-gradient(135deg, #1a3a7a 0%, #2a4f9a 50%, #D4A84B 100%)'
                                 : 'linear-gradient(135deg, #0F2552 0%, #1a3a7a 50%, #B28309 100%)'
                              : 'none',
                        backgroundColor:
                           !IsChangingPassword && canSubmit
                              ? undefined
                              : isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(15, 37, 82, 0.12)',
                        backgroundSize: '200% 200%',
                        backgroundPosition: '0% 50%',
                        color:
                           !IsChangingPassword && canSubmit
                              ? '#fff'
                              : isDark
                                ? 'rgba(255, 255, 255, 0.25)'
                                : 'rgba(15, 37, 82, 0.35)',
                     }}
                     onMouseEnter={(e) => {
                        if (!IsChangingPassword && canSubmit) {
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
                     {IsChangingPassword ? (
                        <div className="flex items-center justify-center gap-2">
                           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                     ) : (
                        'Change Password'
                     )}
                  </button>
               </div>
            </form>

            {/* Footer */}
            <p
               className={`animate-fade-up-delay-5 mt-10 text-xs z-10 transition-colors ${isDark ? 'text-white/20' : 'text-[#0F2552]/30'}`}
            >
               &copy; {new Date().getFullYear()} EGFM Logistics. All rights reserved.
            </p>
         </div>
      </>
   );
};

export default ChangePassword;
