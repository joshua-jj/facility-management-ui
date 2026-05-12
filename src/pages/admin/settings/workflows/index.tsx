import React, { FC, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import SettingsShell from '@/components/SettingsShell';
import TableSkeletonRow from '@/components/TableSkeletonRow';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import { RootState } from '@/redux/reducers';
import { workflowActions } from '@/actions/workflow.actions';
import { WorkflowSummary } from '@/types/workflow';
import { Permission } from '@/constants/permissions.enum';

// Match the inline SVG icons used by the other row-action menus across
// the app (see `pages/admin/requests.tsx`).
const EDIT_ICON = (
   <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
   >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
   </svg>
);

/**
 * Settings -> Workflows list view. Displays one row per seeded subject
 * (requests, complaints, maintenance-logs, generator-logs,
 * incidence-logs) with state / transition counts and a click-through
 * to the editor.
 *
 * Gated on `roles:manage` via SettingsShell — non-SA users don't see
 * the panel in the sidebar and typed URLs bounce to /admin/settings/profile.
 */
const formatDate = (iso: string | undefined | null) => {
   if (!iso) return '-';
   try {
      return new Date(iso).toLocaleDateString('en-US', {
         month: 'short',
         day: '2-digit',
         year: 'numeric',
      });
   } catch {
      return iso;
   }
};

/** Map subject -> display name. Falls back to title-casing the raw key. */
const subjectDisplay = (subject: string): string => {
   switch (subject) {
      case 'requests':
         return 'Requests';
      case 'complaints':
         return 'Complaints';
      case 'maintenance-logs':
         return 'Maintenance Logs';
      case 'generator-logs':
         return 'Generator Logs';
      case 'incidence-logs':
         return 'Incidence Logs';
      default:
         return subject
            .split('-')
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join(' ');
   }
};

/** Letter avatar — gold-tinted circle with the first letter of the subject */
const LetterAvatar: FC<{ name: string }> = ({ name }) => {
   const letter = (name?.trim()?.[0] ?? '?').toUpperCase();
   return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#B28309]/15 text-[#B28309] text-xs font-bold">
         {letter}
      </span>
   );
};

const WorkflowsList: FC = () => {
   const router = useRouter();
   const dispatch = useDispatch();
   const workflows = useSelector((s: RootState) => s.workflow.list) as WorkflowSummary[];
   const loading = useSelector((s: RootState) => s.workflow.isLoadingList) as boolean;

   useEffect(() => {
      dispatch(workflowActions.listWorkflows() as unknown as UnknownAction);
   }, [dispatch]);

   const handleRefresh = () => {
      dispatch(workflowActions.listWorkflows() as unknown as UnknownAction);
   };

   return (
      <PrivateRoute permissions={[Permission.ROLES_MANAGE]}>
         <Layout title="Workflows">
            <SettingsShell active="workflows">
               <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                     <div>
                        <h2 className="text-lg font-bold text-[#0F2552] dark:text-white/90">
                           Workflows
                        </h2>
                        <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
                           Edit the state-machine rules for each subject without touching code.
                        </p>
                     </div>
                     <div className="flex gap-2">
                        <button
                           onClick={handleRefresh}
                           className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#B28309] text-[#B28309] text-xs font-semibold hover:bg-[#B28309]/10 cursor-pointer"
                        >
                           ↻ Refresh
                        </button>
                     </div>
                  </div>

                  {/* Table */}
                  <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 overflow-hidden">
                     <div
                        className="overflow-auto"
                        style={{
                           minHeight: `${5 * 56}px`,
                           maxHeight: '65vh',
                        }}
                     >
                        <table className="w-full">
                           <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                              <tr className="text-[0.65rem] uppercase tracking-wider text-gray-400 dark:text-white/40 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#0F1A33]">
                                 <th className="px-6 py-3 text-left font-semibold w-[32%] bg-inherit whitespace-nowrap">
                                    Subject
                                 </th>
                                 <th className="px-6 py-3 text-left font-semibold w-[10%] bg-inherit whitespace-nowrap">
                                    Version
                                 </th>
                                 <th className="px-6 py-3 text-left font-semibold w-[10%] bg-inherit whitespace-nowrap">
                                    States
                                 </th>
                                 <th className="px-6 py-3 text-left font-semibold w-[12%] bg-inherit whitespace-nowrap">
                                    Transitions
                                 </th>
                                 <th className="px-6 py-3 text-left font-semibold w-[22%] bg-inherit whitespace-nowrap">
                                    Last Updated
                                 </th>
                                 <th className="px-6 py-3 text-right font-semibold w-[14%] bg-inherit whitespace-nowrap">
                                    Actions
                                 </th>
                              </tr>
                           </thead>
                           <tbody>
                              {loading &&
                                 Array.from({ length: 5 }).map((_, i) => (
                                    <TableSkeletonRow
                                       key={`sk-${i}`}
                                       cols={6}
                                       widths={['40%', '20%', '20%', '25%', '30%', '30%']}
                                    />
                                 ))}
                              {!loading && workflows.length === 0 && (
                                 <tr>
                                    <td
                                       colSpan={6}
                                       className="px-6 py-8 text-center text-sm text-gray-500"
                                    >
                                       No workflows defined yet. Run the
                                       workflow seeder on the API.
                                    </td>
                                 </tr>
                              )}
                              {!loading &&
                                 workflows.map((wf) => (
                                    <tr
                                       key={wf.subject}
                                       className="border-b border-gray-100 dark:border-white/5 last:border-0"
                                    >
                                       <td className="px-6 py-4 text-left align-middle">
                                          <div className="flex items-center gap-3">
                                             <LetterAvatar name={subjectDisplay(wf.subject)} />
                                             <div>
                                                <div className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                                                   {subjectDisplay(wf.subject)}
                                                </div>
                                                {wf.description && (
                                                   <div className="text-[0.65rem] text-gray-400 dark:text-white/40 mt-0.5">
                                                      {wf.description}
                                                   </div>
                                                )}
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-6 py-4 text-left align-middle">
                                          <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded bg-[#B28309]/15 text-[#B28309]">
                                             v{wf.version}
                                          </span>
                                       </td>
                                       <td className="px-6 py-4 text-left align-middle text-sm text-[#0F2552] dark:text-white/80">
                                          {wf.statesCount}
                                       </td>
                                       <td className="px-6 py-4 text-left align-middle text-sm text-[#0F2552] dark:text-white/80">
                                          {wf.transitionCount}
                                       </td>
                                       <td className="px-6 py-4 text-left align-middle text-sm text-gray-500 dark:text-white/60 whitespace-nowrap">
                                          {formatDate(wf.updatedAt)}
                                       </td>
                                       <td className="px-6 py-4 text-right align-middle whitespace-nowrap">
                                          <div className="inline-flex justify-end">
                                             <ActionMenu
                                                items={
                                                   [
                                                      {
                                                         label: 'Edit',
                                                         icon: EDIT_ICON,
                                                         onClick: () =>
                                                            router.push(
                                                               `/admin/settings/workflows/${wf.subject}`,
                                                            ),
                                                      },
                                                   ] satisfies ActionMenuItem[]
                                                }
                                             />
                                          </div>
                                       </td>
                                    </tr>
                                 ))}
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

export default WorkflowsList;
