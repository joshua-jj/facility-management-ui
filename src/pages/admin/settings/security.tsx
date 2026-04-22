import React, { FC, useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import SettingsShell from '@/components/SettingsShell';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { authActions, securityActions } from '@/actions';
import { UnknownAction } from 'redux';
import EyeIcon from '../../../../public/assets/icons/Eye.svg';
import HideIcon from '../../../../public/assets/icons/Hide.svg';
import { ChangePasswordForm } from '@/types';

const formatDateTime = (iso: string | null | undefined) => {
   if (!iso) return '—';
   try {
      const d = new Date(iso);
      return `${d.toLocaleDateString('en-US', {
         month: 'short',
         day: '2-digit',
         year: 'numeric',
      })} · ${d.toLocaleTimeString('en-US', {
         hour: '2-digit',
         minute: '2-digit',
      })}`;
   } catch {
      return iso ?? '—';
   }
};

/** Browser/OS guess from a user-agent string — pragmatic, not exhaustive */
const briefDevice = (ua: string | null): string => {
   if (!ua) return 'Unknown device';
   if (/iPhone|iPad/.test(ua)) return 'iOS · Safari';
   if (/Android/.test(ua)) return 'Android';
   if (/Edg\//.test(ua)) return 'Edge';
   if (/Chrome\//.test(ua)) return 'Chrome';
   if (/Firefox\//.test(ua)) return 'Firefox';
   if (/Safari\//.test(ua)) return 'Safari';
   return 'Desktop browser';
};

/** Device class icon picker — laptop vs phone vs tablet */
const DeviceIcon: FC<{ ua: string | null }> = ({ ua }) => {
   const isMobile = ua && /iPhone|Android.*Mobile/.test(ua);
   const isTablet = ua && /iPad|Android(?!.*Mobile)/.test(ua);
   if (isMobile) {
      return (
         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="2" width="10" height="20" rx="2" />
            <line x1="11" y1="18" x2="13" y2="18" />
         </svg>
      );
   }
   if (isTablet) {
      return (
         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="10" y1="18" x2="14" y2="18" />
         </svg>
      );
   }
   return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
         <rect x="2" y="3" width="20" height="14" rx="2" />
         <line x1="8" y1="21" x2="16" y2="21" />
         <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
   );
};

const ShieldIcon: FC = () => (
   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
   </svg>
);

const Security: FC = () => {
   const dispatch = useDispatch();
   const { IsChangingPassword } = useSelector((s: RootState) => s.auth);
   const sessions = useSelector((s: RootState) => s.security.sessions);
   const loginHistory = useSelector((s: RootState) => s.security.loginHistory);
   const IsFetchingSessions = useSelector(
      (s: RootState) => s.security.IsFetchingSessions,
   );
   const IsRevokingSession = useSelector(
      (s: RootState) => s.security.IsRevokingSession,
   );
   const IsFetchingLoginHistory = useSelector(
      (s: RootState) => s.security.IsFetchingLoginHistory,
   );

   const [canSubmitPassword, setCanSubmitPassword] = useState(false);
   const [showPassword, setShowPassword] = useState(false);
   const [showNewPassword, setShowNewPassword] = useState(false);
   const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

   useEffect(() => {
      dispatch(securityActions.getSessions() as unknown as UnknownAction);
      dispatch(securityActions.getLoginHistory(30) as unknown as UnknownAction);
   }, [dispatch]);

   const handlePasswordChange = (data: ChangePasswordForm) => {
      dispatch(authActions.changePassword(data) as unknown as UnknownAction);
   };

   const handleRevoke = (sessionId: number) => {
      dispatch(
         securityActions.revokeSession(sessionId) as unknown as UnknownAction,
      );
   };

   const handleRevokeAll = () => {
      dispatch(securityActions.revokeAllSessions() as unknown as UnknownAction);
   };

   /** Summary stats for the hero card */
   const lastLogin = useMemo(() => {
      const firstSuccess = loginHistory.find((e) => e.success);
      return firstSuccess ? formatDateTime(firstSuccess.createdAt) : '—';
   }, [loginHistory]);

   return (
      <PrivateRoute>
         <Layout title="Security Settings">
            <SettingsShell active="security">
               <div className="space-y-6">
                  {/* Hero card — security overview */}
                  <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
                     <div className="p-6 flex items-start gap-5">
                        <div className="w-[72px] h-[72px] rounded-full bg-[#B28309]/15 text-[#B28309] flex items-center justify-center shrink-0">
                           <ShieldIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h2 className="text-xl font-bold text-[#0F2552] dark:text-white/90">
                              Security Overview
                           </h2>
                           <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">
                              Manage your password, active sessions, and login history
                           </p>
                           <div className="flex flex-wrap gap-2 mt-3">
                              <span className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase font-semibold tracking-wider px-2.5 py-1 rounded-full bg-green-500/15 text-green-500 dark:text-green-300">
                                 <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                                 <span className="opacity-60">Active sessions ·</span>
                                 <span>{sessions.length}</span>
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase font-semibold tracking-wider px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-500 dark:text-blue-300">
                                 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
                                 <span className="opacity-60">Last login ·</span>
                                 <span>{lastLogin}</span>
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase font-semibold tracking-wider px-2.5 py-1 rounded-full bg-gray-500/15 text-gray-500 dark:text-white/60">
                                 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                 <span className="opacity-60">Two-factor ·</span>
                                 <span>Coming soon</span>
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Change password */}
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
                           Use at least 8 characters. Mix letters, numbers, and symbols for a stronger password.
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                 Updating…
                              </span>
                           ) : (
                              'Update password'
                           )}
                        </button>
                     </div>
                  </Formsy>

                  {/* Active sessions */}
                  <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between gap-3">
                        <div>
                           <h2 className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                              Active Sessions
                           </h2>
                           <p className="text-[0.65rem] text-gray-400 dark:text-white/35 mt-0.5">
                              Devices and browsers currently signed in to your account
                           </p>
                        </div>
                        {sessions.length > 1 && (
                           <button
                              type="button"
                              onClick={handleRevokeAll}
                              disabled={IsRevokingSession}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500 text-red-500 hover:bg-red-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                           >
                              Sign out all
                           </button>
                        )}
                     </div>
                     <div className="p-6">
                        {IsFetchingSessions && sessions.length === 0 ? (
                           <p className="text-sm text-gray-500 dark:text-white/40">
                              Loading…
                           </p>
                        ) : sessions.length === 0 ? (
                           <p className="text-sm text-gray-500 dark:text-white/40">
                              No active sessions.
                           </p>
                        ) : (
                           <ul className="space-y-3">
                              {sessions.map((s) => (
                                 <li
                                    key={s.id}
                                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20 transition-colors"
                                 >
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/60 flex items-center justify-center shrink-0">
                                       <DeviceIcon ua={s.userAgent} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                       <div className="text-sm font-semibold text-[#0F2552] dark:text-white/90 truncate">
                                          {briefDevice(s.userAgent)}
                                       </div>
                                       <div className="text-[0.65rem] text-gray-400 dark:text-white/40 mt-0.5 truncate">
                                          <span className="opacity-60">IP ·</span>{' '}
                                          {s.ipAddress ?? '—'}{' '}
                                          <span className="opacity-40 mx-1">·</span>
                                          <span className="opacity-60">Last active ·</span>{' '}
                                          {formatDateTime(s.lastActiveAt)}
                                       </div>
                                    </div>
                                    <button
                                       type="button"
                                       onClick={() => handleRevoke(s.id)}
                                       disabled={IsRevokingSession}
                                       className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500 text-red-500 hover:bg-red-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                    >
                                       Sign out
                                    </button>
                                 </li>
                              ))}
                           </ul>
                        )}
                     </div>
                  </div>

                  {/* Login history */}
                  <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
                        <h2 className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                           Login History
                        </h2>
                        <p className="text-[0.65rem] text-gray-400 dark:text-white/35 mt-0.5">
                           Recent sign-in attempts on your account (last 30)
                        </p>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                           <thead>
                              <tr className="text-[0.6rem] uppercase tracking-wider text-gray-400 dark:text-white/40 border-b border-gray-100 dark:border-white/5">
                                 <th className="px-6 py-3 text-left font-semibold">
                                    When
                                 </th>
                                 <th className="px-6 py-3 text-left font-semibold">
                                    Device
                                 </th>
                                 <th className="px-6 py-3 text-left font-semibold">
                                    IP
                                 </th>
                                 <th className="px-6 py-3 text-left font-semibold">
                                    Result
                                 </th>
                              </tr>
                           </thead>
                           <tbody>
                              {IsFetchingLoginHistory && loginHistory.length === 0 ? (
                                 <tr>
                                    <td
                                       colSpan={4}
                                       className="px-6 py-8 text-center text-gray-500 dark:text-white/40"
                                    >
                                       Loading…
                                    </td>
                                 </tr>
                              ) : loginHistory.length === 0 ? (
                                 <tr>
                                    <td
                                       colSpan={4}
                                       className="px-6 py-8 text-center text-gray-500 dark:text-white/40"
                                    >
                                       No login history yet.
                                    </td>
                                 </tr>
                              ) : (
                                 loginHistory.map((e) => (
                                    <tr
                                       key={e.id}
                                       className="border-b border-gray-100 dark:border-white/5 last:border-0"
                                    >
                                       <td className="px-6 py-3 text-[#0F2552] dark:text-white/80">
                                          {formatDateTime(e.createdAt)}
                                       </td>
                                       <td className="px-6 py-3 text-gray-500 dark:text-white/60">
                                          <span className="inline-flex items-center gap-2">
                                             <DeviceIcon ua={e.userAgent} />
                                             {briefDevice(e.userAgent)}
                                          </span>
                                       </td>
                                       <td className="px-6 py-3 text-gray-500 dark:text-white/60">
                                          {e.ipAddress ?? '—'}
                                       </td>
                                       <td className="px-6 py-3">
                                          <span
                                             className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[0.65rem] font-semibold uppercase tracking-wide ${
                                                e.success
                                                   ? 'bg-green-500/15 text-green-500 dark:text-green-300 border-green-500/30'
                                                   : 'bg-red-500/15 text-red-500 dark:text-red-300 border-red-500/30'
                                             }`}
                                          >
                                             <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                                             {e.success
                                                ? 'Success'
                                                : e.failureReason ?? 'Failed'}
                                          </span>
                                       </td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            </SettingsShell>
         </Layout>
      </PrivateRoute>
   );
};

export default Security;
