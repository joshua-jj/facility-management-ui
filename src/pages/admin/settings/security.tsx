import React, { FC, useEffect, useState } from 'react';
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
   if (!iso) return '-';
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
      return iso ?? '-';
   }
};

/** Browser name guess from a user-agent string; pragmatic, not exhaustive */
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

                  {/* Active sessions card */}
                  <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
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
                              className="text-xs font-semibold text-[#B28309] hover:underline cursor-pointer disabled:opacity-50"
                           >
                              Sign out all
                           </button>
                        )}
                     </div>
                     <div className="p-6">
                        {IsFetchingSessions && sessions.length === 0 ? (
                           <p className="text-sm text-gray-500">Loading…</p>
                        ) : sessions.length === 0 ? (
                           <p className="text-sm text-gray-500">
                              No active sessions.
                           </p>
                        ) : (
                           <ul className="space-y-3">
                              {sessions.map((s) => (
                                 <li
                                    key={s.id}
                                    className="flex items-center justify-between gap-4 p-3 rounded-lg border border-gray-100 dark:border-white/10"
                                 >
                                    <div className="min-w-0">
                                       <div className="text-sm font-semibold text-[#0F2552] dark:text-white/90 truncate">
                                          {briefDevice(s.userAgent)}
                                       </div>
                                       <div className="text-[0.65rem] text-gray-400 dark:text-white/40 mt-0.5">
                                          IP {s.ipAddress ?? '—'} · Last active{' '}
                                          {formatDateTime(s.lastActiveAt)}
                                       </div>
                                    </div>
                                    <button
                                       type="button"
                                       onClick={() => handleRevoke(s.id)}
                                       disabled={IsRevokingSession}
                                       className="text-xs font-semibold text-red-500 hover:underline cursor-pointer disabled:opacity-50"
                                    >
                                       Sign out
                                    </button>
                                 </li>
                              ))}
                           </ul>
                        )}
                     </div>
                  </div>

                  {/* Login history card */}
                  <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
                        <h2 className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                           Login History
                        </h2>
                        <p className="text-[0.65rem] text-gray-400 dark:text-white/35 mt-0.5">
                           Recent sign-in attempts on your account (last 30)
                        </p>
                     </div>
                     <div className="overflow-hidden">
                        <table className="w-full text-sm">
                           <thead>
                              <tr className="text-[0.6rem] uppercase tracking-wider text-gray-400 dark:text-white/40 border-b border-gray-100 dark:border-white/5">
                                 <th className="px-6 py-2 text-left font-semibold">
                                    When
                                 </th>
                                 <th className="px-6 py-2 text-left font-semibold">
                                    Device
                                 </th>
                                 <th className="px-6 py-2 text-left font-semibold">
                                    IP
                                 </th>
                                 <th className="px-6 py-2 text-left font-semibold">
                                    Result
                                 </th>
                              </tr>
                           </thead>
                           <tbody>
                              {IsFetchingLoginHistory && loginHistory.length === 0 ? (
                                 <tr>
                                    <td
                                       colSpan={4}
                                       className="px-6 py-6 text-center text-gray-500"
                                    >
                                       Loading…
                                    </td>
                                 </tr>
                              ) : loginHistory.length === 0 ? (
                                 <tr>
                                    <td
                                       colSpan={4}
                                       className="px-6 py-6 text-center text-gray-500"
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
                                       <td className="px-6 py-2 text-[#0F2552] dark:text-white/80">
                                          {formatDateTime(e.createdAt)}
                                       </td>
                                       <td className="px-6 py-2 text-gray-500 dark:text-white/60">
                                          {briefDevice(e.userAgent)}
                                       </td>
                                       <td className="px-6 py-2 text-gray-500 dark:text-white/60">
                                          {e.ipAddress ?? '—'}
                                       </td>
                                       <td className="px-6 py-2">
                                          <span
                                             className={`inline-flex items-center px-2 py-0.5 rounded border text-[0.65rem] font-semibold uppercase tracking-wide ${
                                                e.success
                                                   ? 'bg-green-500/15 text-green-300 border-green-500/30'
                                                   : 'bg-red-500/15 text-red-300 border-red-500/30'
                                             }`}
                                          >
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
