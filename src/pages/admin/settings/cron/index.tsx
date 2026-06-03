import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import Layout from '@/components/Layout';
import type { NextPageWithLayout } from '@/types/next-page-with-layout';
import PrivateRoute from '@/components/PrivateRoute';
import SettingsShell from '@/components/SettingsShell';
import TableSkeletonRow from '@/components/TableSkeletonRow';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import { RootState } from '@/redux/reducers';
import { cronActions } from '@/actions/cron.actions';
import { Permission } from '@/constants/permissions.enum';
import { SystemCronConfig } from '@/types/cron.types';

const TRIGGER_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
);
const EDIT_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
);

const CronList: NextPageWithLayout = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const crons = useSelector((s: RootState) => s.cron.list) as SystemCronConfig[];
  const loading = useSelector((s: RootState) => s.cron.isLoadingList) as boolean;

  useEffect(() => {
    dispatch(cronActions.getCrons() as unknown as UnknownAction);
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(cronActions.getCrons() as unknown as UnknownAction);
  };

  const getActions = (job: SystemCronConfig): ActionMenuItem[] => [
    {
      label: 'Trigger Now',
      icon: TRIGGER_ICON,
      onClick: () => dispatch(cronActions.triggerCron(job.key) as unknown as UnknownAction),
    },
    {
      label: 'Edit',
      icon: EDIT_ICON,
      onClick: () => router.push(`/admin/settings/cron/edit?key=${job.key}`),
    },
  ];

  return (
    <SettingsShell active="cron">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0F2552] dark:text-white/90">
              Cron Scheduler
            </h2>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
              Review and adjust execution schedules for automated background tasks.
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
          <div className="overflow-auto" style={{ minHeight: '280px', maxHeight: '65vh' }}>
            <table className="w-full">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr className="text-[0.65rem] uppercase tracking-wider text-gray-400 dark:text-white/40 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#0F1A33]">
                  <th className="px-6 py-3 text-left font-semibold w-[30%] whitespace-nowrap bg-inherit">Task</th>
                  <th className="px-6 py-3 text-left font-semibold w-[25%] whitespace-nowrap bg-inherit">Expression</th>
                  <th className="px-6 py-3 text-center font-semibold w-[15%] whitespace-nowrap bg-inherit">Status</th>
                  <th className="px-6 py-3 text-left font-semibold w-[15%] whitespace-nowrap bg-inherit">Last Updated</th>
                  <th className="px-6 py-3 text-right font-semibold w-[15%] whitespace-nowrap bg-inherit">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableSkeletonRow
                      key={`sk-${i}`}
                      cols={5}
                      widths={['35%', '25%', '15%', '15%', '10%']}
                    />
                  ))}
                {!loading && crons.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      No system cron jobs registered.
                    </td>
                  </tr>
                )}
                {!loading &&
                  crons.map((job) => (
                    <tr
                      key={job.key}
                      className="border-b border-gray-100 dark:border-white/5 last:border-0"
                    >
                      <td className="px-6 py-4 text-left align-middle">
                        <div>
                          <div className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                            {job.name}
                          </div>
                          {job.description && (
                            <div className="text-[0.65rem] text-gray-400 dark:text-white/40 mt-0.5 max-w-sm break-words">
                              {job.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left align-middle">
                        <code className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-white/10 font-mono text-[#0F2552] dark:text-white/80">
                          {job.cronExpression}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-center align-middle">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            job.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {job.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left align-middle whitespace-nowrap">
                        <div className="text-xs text-gray-500 dark:text-white/60">
                          {new Date(job.updatedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-[0.65rem] text-gray-400 dark:text-white/40 mt-0.5">
                          by {job.updatedBy || 'SYSTEM'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right align-middle whitespace-nowrap">
                        <div className="flex justify-end">
                          <ActionMenu items={getActions(job)} />
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
  );
};

CronList.getLayout = (page) => (
  <PrivateRoute permissions={[Permission.ROLES_MANAGE]}>
    <Layout title="Cron Scheduler">{page}</Layout>
  </PrivateRoute>
);

export default CronList;
