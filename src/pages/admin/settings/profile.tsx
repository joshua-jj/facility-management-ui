import React, { FC, useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
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
import { userConstants } from '@/constants';

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

/** Small inline icon — sun for light, moon for dark */
const SunIcon: FC = () => (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
   </svg>
);

const MoonIcon: FC = () => (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
   </svg>
);

const Profile: FC = () => {
   const dispatch = useDispatch();
   const { userDetails } = useSelector((s: RootState) => s.user);
   const allDepartmentsList = useSelector(
      (s: RootState) => s.department.allDepartmentsList,
   );
   const { theme, toggleTheme } = useTheme();

   const fullName = `${userDetails?.firstName ?? ''} ${userDetails?.lastName ?? ''}`.trim();
   const roleName =
      (typeof userDetails?.role === 'object'
         ? (userDetails?.role as Record<string, string>)?.name
         : userDetails?.role) || 'Not assigned';
   const departmentName =
      (allDepartmentsList ?? []).find(
         (d: { id: number; name: string }) => d.id === userDetails?.departmentId,
      )?.name ?? 'Not assigned';
   const [memberSinceIso, setMemberSinceIso] = useState<string | null>(
      (userDetails as { createdAt?: string })?.createdAt ?? null,
   );
   const memberSince = formatDate(memberSinceIso);

   useEffect(() => {
      if (!allDepartmentsList || allDepartmentsList.length === 0) {
         dispatch(
            departmentActions.getAllDepartments() as unknown as UnknownAction,
         );
      }
   }, [dispatch, allDepartmentsList]);

   /** Fetch the full user record to get createdAt — login payload doesn't include it */
   useEffect(() => {
      const uid = userDetails?.id;
      if (!uid || memberSinceIso) return;
      const token = Cookies.get('authToken');
      if (!token) return;
      axios
         .get(`${userConstants.USER_URI}/detail/${uid}`, {
            headers: { Authorization: `Bearer ${token}` },
         })
         .then((resp) => {
            const createdAt = resp?.data?.data?.createdAt;
            if (createdAt) setMemberSinceIso(createdAt);
         })
         .catch(() => undefined);
   }, [userDetails?.id, memberSinceIso]);

   return (
      <PrivateRoute>
         <Layout title="Profile Settings">
            <SettingsShell active="profile">
               <div className="space-y-6">
                  {/* Hero card — identity + work context inline */}
                  <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
                     <div className="p-6 flex items-start gap-5">
                        <LetteredAvatar name={fullName || 'User'} size={72} />
                        <div className="flex-1 min-w-0">
                           <h2 className="text-xl font-bold text-[#0F2552] dark:text-white/90 truncate">
                              {fullName || 'User'}
                           </h2>
                           <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5 truncate">
                              {userDetails?.email || '—'}
                           </p>
                           <div className="flex flex-wrap gap-2 mt-3">
                              <span className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase font-semibold tracking-wider px-2.5 py-1 rounded-full bg-[#B88C00]/15 text-[#B88C00]">
                                 <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" /></svg>
                                 <span className="opacity-60">Role ·</span>
                                 <span>{roleName}</span>
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase font-semibold tracking-wider px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-500 dark:text-blue-300">
                                 <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21V10l9-7 9 7v11h-6v-7h-6v7H3z" /></svg>
                                 <span className="opacity-60">Dept ·</span>
                                 <span>{departmentName}</span>
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase font-semibold tracking-wider px-2.5 py-1 rounded-full bg-gray-500/15 text-gray-500 dark:text-white/60">
                                 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                 <span className="opacity-60">Member since ·</span>
                                 <span>{memberSince}</span>
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Personal Information — editable fields (save wired in a future slice) */}
                  <Formsy className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
                        <h2 className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                           Personal Information
                        </h2>
                        <p className="text-[0.65rem] text-gray-400 dark:text-white/35 mt-0.5">
                           These details appear on your profile and in emails sent on your behalf
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

                  {/* Preferences — theme toggle */}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <button
                              type="button"
                              onClick={() => theme !== 'light' && toggleTheme()}
                              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                 theme === 'light'
                                    ? 'border-[#B28309] bg-[#B28309]/5'
                                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                              }`}
                           >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                 theme === 'light' ? 'bg-[#B28309] text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/60'
                              }`}>
                                 <SunIcon />
                              </div>
                              <div className="text-left flex-1">
                                 <div className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                                    Light
                                 </div>
                                 <div className="text-[0.65rem] text-gray-400 dark:text-white/40 mt-0.5">
                                    Bright and clear
                                 </div>
                              </div>
                              {theme === 'light' && (
                                 <span className="text-[#B28309] text-lg">✓</span>
                              )}
                           </button>

                           <button
                              type="button"
                              onClick={() => theme !== 'dark' && toggleTheme()}
                              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                 theme === 'dark'
                                    ? 'border-[#B28309] bg-[#B28309]/5'
                                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                              }`}
                           >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                 theme === 'dark' ? 'bg-[#B28309] text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/60'
                              }`}>
                                 <MoonIcon />
                              </div>
                              <div className="text-left flex-1">
                                 <div className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                                    Dark
                                 </div>
                                 <div className="text-[0.65rem] text-gray-400 dark:text-white/40 mt-0.5">
                                    Easy on the eyes
                                 </div>
                              </div>
                              {theme === 'dark' && (
                                 <span className="text-[#B28309] text-lg">✓</span>
                              )}
                           </button>
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
