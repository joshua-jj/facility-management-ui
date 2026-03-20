'use client';

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

const AccountSettings: FC = () => {
  const dispatch = useDispatch();
  const { IsChangingPassword } = useSelector((s: RootState) => s.auth);
  const { userDetails } = useSelector((s: RootState) => s.user);

  //   const [canSubmitProfile, setCanSubmitProfile] = useState(false);
  const [canSubmitPassword, setCanSubmitPassword] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  //   useEffect(() => {
  //     if (!user) {
  //       dispatch(authActions.getProfile() as unknown as UnknownAction);
  //     }
  //   }, [dispatch, user]);

  //   const handleProfileUpdate = (data: any) => {
  //     // dispatch(userActions.updateProfile(data) as unknown as UnknownAction);
  //   };

  const handlePasswordChange = (data: ChangePasswordForm) => {
    dispatch(authActions.changePassword(data) as unknown as UnknownAction);
  };

  return (
    <PrivateRoute>
      <Layout title="Account Settings">
        <div className=" mx-auto space-y-8">
          {/* ================= PERSONAL INFO ================= */}
          <Formsy
            // onValidSubmit={handleProfileUpdate}
            // onValid={() => setCanSubmitProfile(true)}
            // onInvalid={() => setCanSubmitProfile(false)}
            className="bg-white p-6 rounded border border-[rgba(15,37,82,0.15)] shadow-[8px_3px_22px_0px_rgba(150,150,150,0.15)]"
          >
            <h2 className="text-[#0F2552] font-semibold text-lg mb-6">
              Personal Information
            </h2>

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

            <div className="flex justify-end mt-6">
              {/* <button
                disabled
                disabled={!canSubmitProfile}
                type="submit"
                className="bg-[#B28309] text-white px-6 py-2 rounded text-sm hover:bg-[#B2830998] transition"
              >
                Save changes
                {IsUpdatingProfile ? 'Saving...' : 'Save changes'}
              </button> */}
            </div>
          </Formsy>

          {/* ================= CHANGE PASSWORD ================= */}
          <Formsy
            onValidSubmit={handlePasswordChange}
            onValid={() => setCanSubmitPassword(true)}
            onInvalid={() => setCanSubmitPassword(false)}
            className="bg-white p-6 rounded border border-[rgba(15,37,82,0.15)] shadow-[8px_3px_22px_0px_rgba(150,150,150,0.15)]"
          >
            <h2 className="text-[#0F2552] font-semibold text-lg mb-6">
              Change Password
            </h2>

            <div className="space-y-4">
              <TextInput
                name="oldPassword"
                label="Current password"
                type={showPassword ? 'text' : 'password'}
                required
                endIcon={
                  <span
                    className="absolute top-1 right-1 cursor-pointer"
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
                    className="absolute top-1 right-1 cursor-pointer"
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
                    className="absolute top-1 right-1 cursor-pointer"
                    onClick={() => setShowConfirmNewPassword((p) => !p)}
                  >
                    {showConfirmNewPassword ? <EyeIcon /> : <HideIcon />}
                  </span>
                }
              />
            </div>

            <div className="flex justify-end mt-6">
              <button
                disabled={!canSubmitPassword}
                type="submit"
                className="bg-[#B28309] text-white px-6 py-2 rounded text-sm hover:bg-[#B2830998] transition"
              >
                {IsChangingPassword ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </Formsy>
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default AccountSettings;
