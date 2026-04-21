import React, { FC, useState } from 'react';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import SettingsShell from '@/components/SettingsShell';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { authActions } from '@/actions';
import { UnknownAction } from 'redux';
import EyeIcon from '../../../../public/assets/icons/Eye.svg';
import HideIcon from '../../../../public/assets/icons/Hide.svg';
import { ChangePasswordForm } from '@/types';

const Security: FC = () => {
   const dispatch = useDispatch();
   const { IsChangingPassword } = useSelector((s: RootState) => s.auth);

   const [canSubmitPassword, setCanSubmitPassword] = useState(false);
   const [showPassword, setShowPassword] = useState(false);
   const [showNewPassword, setShowNewPassword] = useState(false);
   const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

   const handlePasswordChange = (data: ChangePasswordForm) => {
      dispatch(authActions.changePassword(data) as unknown as UnknownAction);
   };

   return (
      <PrivateRoute>
         <Layout title="Security Settings">
            <SettingsShell active="security">
               <div className="space-y-6">
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
                                 onClick={() =>
                                    setShowConfirmNewPassword((p) => !p)
                                 }
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
            </SettingsShell>
         </Layout>
      </PrivateRoute>
   );
};

export default Security;
