import React, { FC, useEffect } from 'react';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import SettingsShell from '@/components/SettingsShell';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { RootState } from '@/redux/reducers';
import LetteredAvatar from '@/components/LetteredAvatar';
import { departmentActions } from '@/actions';
import { useTheme } from '@/hooks/useTheme';

const formatDate = (iso: string | undefined | null) => {
   if (!iso) return '—';
   try {
      return new Date(iso).toLocaleDateString('en-US', {
         month: 'short',
         day: '2-digit',
         year: 'numeric',
      });
   } catch {
      return '—';
   }
};

const Profile: FC = () => {
   const dispatch = useDispatch();
   const { userDetails } = useSelector((s: RootState) => s.user);
   const allDepartmentsList = useSelector(
      (s: RootState) => s.department.allDepartmentsList,
   );
   const { theme, toggleTheme } = useTheme();

   const fullName = `${userDetails?.firstName ?? ''} ${userDetails?.lastName ?? ''}`.trim();
   const roleName =
      typeof userDetails?.role === 'object'
         ? (userDetails?.role as Record<string, string>)?.name
         : (userDetails?.role ?? '—');
   const departmentName =
      (allDepartmentsList ?? []).find(
         (d: { id: number; name: string }) => d.id === userDetails?.departmentId,
      )?.name ?? '—';
   const memberSince = formatDate(
      (userDetails as { createdAt?: string })?.createdAt,
   );

   useEffect(() => {
      if (!allDepartmentsList || allDepartmentsList.length === 0) {
         dispatch(
            departmentActions.getAllDepartments() as unknown as UnknownAction,
         );
      }
   }, [dispatch, allDepartmentsList]);

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

                  {/* Work context */}
                  <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
                        <h2 className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                           Work Context
                        </h2>
                        <p className="text-[0.65rem] text-gray-400 dark:text-white/35 mt-0.5">
                           Read-only details about your role in the organization
                        </p>
                     </div>
                     <dl className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                        <div>
                           <dt className="text-[0.6rem] uppercase tracking-wider text-gray-400 dark:text-white/40">
                              Role
                           </dt>
                           <dd className="text-sm font-semibold text-[#0F2552] dark:text-white/90 mt-1">
                              {roleName}
                           </dd>
                        </div>
                        <div>
                           <dt className="text-[0.6rem] uppercase tracking-wider text-gray-400 dark:text-white/40">
                              Department
                           </dt>
                           <dd className="text-sm font-semibold text-[#0F2552] dark:text-white/90 mt-1">
                              {departmentName}
                           </dd>
                        </div>
                        <div>
                           <dt className="text-[0.6rem] uppercase tracking-wider text-gray-400 dark:text-white/40">
                              Member since
                           </dt>
                           <dd className="text-sm font-semibold text-[#0F2552] dark:text-white/90 mt-1">
                              {memberSince}
                           </dd>
                        </div>
                     </dl>
                  </div>

                  {/* Preferences */}
                  <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
                        <h2 className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                           Preferences
                        </h2>
                        <p className="text-[0.65rem] text-gray-400 dark:text-white/35 mt-0.5">
                           Customize how the app looks on this device
                        </p>
                     </div>
                     <div className="p-6">
                        <div className="flex items-center justify-between">
                           <div>
                              <div className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                                 Theme
                              </div>
                              <div className="text-[0.65rem] text-gray-400 dark:text-white/40 mt-0.5">
                                 Currently using{' '}
                                 <span className="capitalize">{theme}</span> mode
                              </div>
                           </div>
                           <div className="inline-flex rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
                              <button
                                 type="button"
                                 onClick={() => theme !== 'light' && toggleTheme()}
                                 className={
                                    theme === 'light'
                                       ? 'px-4 py-2 text-xs font-semibold bg-[#B28309] text-white cursor-pointer'
                                       : 'px-4 py-2 text-xs font-semibold text-[#0F2552]/70 dark:text-white/70 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5'
                                 }
                              >
                                 Light
                              </button>
                              <button
                                 type="button"
                                 onClick={() => theme !== 'dark' && toggleTheme()}
                                 className={
                                    theme === 'dark'
                                       ? 'px-4 py-2 text-xs font-semibold bg-[#B28309] text-white cursor-pointer'
                                       : 'px-4 py-2 text-xs font-semibold text-[#0F2552]/70 dark:text-white/70 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5'
                                 }
                              >
                                 Dark
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </SettingsShell>
         </Layout>
      </PrivateRoute>
   );
};

export default Profile;
