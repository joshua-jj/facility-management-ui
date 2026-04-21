import React, { FC } from 'react';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import SettingsShell from '@/components/SettingsShell';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import LetteredAvatar from '@/components/LetteredAvatar';

const Profile: FC = () => {
   const { userDetails } = useSelector((s: RootState) => s.user);
   const fullName = `${userDetails?.firstName ?? ''} ${userDetails?.lastName ?? ''}`.trim();

   return (
      <PrivateRoute>
         <Layout title="Profile Settings">
            <SettingsShell active="profile">
               <div className="space-y-6">
                  {/* Profile header */}
                  <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 shadow-sm p-6 flex items-center gap-5">
                     <LetteredAvatar name={fullName} size={56} />
                     <div>
                        <h2 className="text-base font-bold text-[#0F2552] dark:text-white/90">
                           {fullName || 'User'}
                        </h2>
                        <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                           {userDetails?.email}
                        </p>
                        <span className="inline-block mt-1.5 text-[0.6rem] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-[#B88C00]/10 text-[#B88C00]">
                           {typeof userDetails?.role === 'object'
                              ? (userDetails?.role as Record<string, string>)?.name
                              : (userDetails?.role ?? 'User')}
                        </span>
                     </div>
                  </div>

                  {/* Personal Information */}
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
               </div>
            </SettingsShell>
         </Layout>
      </PrivateRoute>
   );
};

export default Profile;
