import React, { FC, useState } from 'react';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { authActions } from '@/actions';
import { UnknownAction } from 'redux';
import EyeIcon from '../../../public/assets/icons/Eye.svg';
import HideIcon from '../../../public/assets/icons/Hide.svg';
import { ChangePasswordForm } from '@/types';
import PageHeader from '@/components/PageHeader';
import LetteredAvatar from '@/components/LetteredAvatar';

const AccountSettings: FC = () => {
   const dispatch = useDispatch();
   const { IsChangingPassword } = useSelector((s: RootState) => s.auth);
   const { userDetails } = useSelector((s: RootState) => s.user);

   const [canSubmitPassword, setCanSubmitPassword] = useState(false);
   const [showPassword, setShowPassword] = useState(false);
   const [showNewPassword, setShowNewPassword] = useState(false);
   const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

   const handlePasswordChange = (data: ChangePasswordForm) => {
      dispatch(authActions.changePassword(data) as unknown as UnknownAction);
   };

   const fullName = `${userDetails?.firstName ?? ''} ${userDetails?.lastName ?? ''}`.trim();

   return (
      <PrivateRoute>
         <Layout title="Account Settings">
            <PageHeader title="Account Settings" subtitle="Manage your profile and security" />

            <div className="max-w-3xl mx-auto space-y-6">
               {/* ── Profile header ── */}
               <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 shadow-sm p-6 flex items-center gap-5">
                  <LetteredAvatar name={fullName} size={56} />
                  <div>
                     <h2 className="text-base font-bold text-[#0F2552] dark:text-white/90">{fullName || 'User'}</h2>
                     <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{userDetails?.email}</p>
                     <span className="inline-block mt-1.5 text-[0.6rem] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-[#B88C00]/10 text-[#B88C00]">
                        {typeof userDetails?.role === 'object' ? (userDetails?.role as Record<string, string>)?.name : (userDetails?.role ?? 'User')}
                     </span>
                  </div>
               </div>

               {/* ── Personal Information ── */}
               <Formsy className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
                     <h2 className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                        Personal Information
                     </h2>
                     <p className="text-[0.65rem] text-gray-400 dark:text-white/35 mt-0.5">
                        Your basic profile details
                     </p>
                  </div>

                  <div className="p-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput
                           name="firstName"
                           label="First name"
                           type="text"
                           required
                           value={userDetails?.firstName}
                        />
                        <TextInput
                           name="lastName"
                           label="Last name"
                           type="text"
                           required
                           value={userDetails?.lastName}
                        />
                        <TextInput
                           name="email"
                           label="Email address"
                           type="email"
                           disabled
                           value={userDetails?.email}
                        />
                        <TextInput
                           name="phoneNumber"
                           label="Phone number"
                           type="text"
                           value={userDetails?.phoneNumber}
                        />
                     </div>
                  </div>
               </Formsy>

               {/* ── Change Password ── */}
               <Formsy
                  onValidSubmit={handlePasswordChange}
                  onValid={() => setCanSubmitPassword(true)}
                  onInvalid={() => setCanSubmitPassword(false)}
                  className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden"
               >
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
                     <h2 className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                        Change Password
                     </h2>
                     <p className="text-[0.65rem] text-gray-400 dark:text-white/35 mt-0.5">
                        Update your password to keep your account secure
                     </p>
                  </div>

                  <div className="p-6 space-y-4">
                     <TextInput
                        name="oldPassword"
                        label="Current password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        endIcon={
                           <span
                              className="absolute top-1 right-1 cursor-pointer opacity-50 hover:opacity-80 transition-opacity"
                              onClick={() => setShowPassword((p) => !p)}
                           >
                              {showPassword ? <EyeIcon /> : <HideIcon />}
                           </span>
                        }
                     />
                     <TextInput
                        name="newPassword"
                        label="New password"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        validations="minLength:8"
                        validationError="Password must be at least 8 characters"
                        endIcon={
                           <span
                              className="absolute top-1 right-1 cursor-pointer opacity-50 hover:opacity-80 transition-opacity"
                              onClick={() => setShowNewPassword((p) => !p)}
                           >
                              {showNewPassword ? <EyeIcon /> : <HideIcon />}
                           </span>
                        }
                     />
                     <TextInput
                        name="confirmNewPassword"
                        label="Confirm new password"
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        required
                        validations="equalsField:newPassword"
                        validationError="Passwords do not match"
                        endIcon={
                           <span
                              className="absolute top-1 right-1 cursor-pointer opacity-50 hover:opacity-80 transition-opacity"
                              onClick={() => setShowConfirmNewPassword((p) => !p)}
                           >
                              {showConfirmNewPassword ? <EyeIcon /> : <HideIcon />}
                           </span>
                        }
                     />
                  </div>

                  <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex justify-end">
                     <button
                        disabled={!canSubmitPassword}
                        type="submit"
                        className="bg-[#B28309] text-white px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#9a7208] shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {IsChangingPassword ? (
                           <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Updating...
                           </span>
                        ) : (
                           'Update Password'
                        )}
                     </button>
                  </div>
               </Formsy>
            </div>
         </Layout>
      </PrivateRoute>
   );
};

export default AccountSettings;
