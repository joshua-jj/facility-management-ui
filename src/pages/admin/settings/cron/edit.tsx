import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import Layout from '@/components/Layout';
import type { NextPageWithLayout } from '@/types/next-page-with-layout';
import PrivateRoute from '@/components/PrivateRoute';
import { RootState } from '@/redux/reducers';
import { cronActions } from '@/actions/cron.actions';
import { Permission } from '@/constants/permissions.enum';
import { SystemCronConfig } from '@/types/cron.types';

const EditCron: NextPageWithLayout = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { key } = router.query;

  const crons = useSelector((s: RootState) => s.cron.list) as SystemCronConfig[];
  const isSaving = useSelector((s: RootState) => s.cron.isSaving) as boolean;
  const nextRuns = useSelector((s: RootState) => s.cron.nextExecutions) as string[];
  const validationError = useSelector((s: RootState) => s.cron.validationError) as string | null;

  const job = crons.find((c) => c.key === key);

  const [expression, setExpression] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (crons.length === 0) {
      dispatch(cronActions.getCrons() as unknown as UnknownAction);
    }
  }, [dispatch, crons.length]);

  useEffect(() => {
    if (job) {
      setExpression(job.cronExpression);
      setIsActive(job.isActive);
    }
  }, [job]);

  useEffect(() => {
    if (expression.trim()) {
      const delayDebounce = setTimeout(() => {
        dispatch(cronActions.validateCron(expression) as unknown as UnknownAction);
      }, 500);
      return () => clearTimeout(delayDebounce);
    }
  }, [expression, dispatch]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || validationError) return;
    dispatch(
      cronActions.updateCron(key as string, {
        cronExpression: expression,
        isActive,
      }) as unknown as UnknownAction,
    );
    setTimeout(() => router.push('/admin/settings/cron'), 800);
  };

  if (!job) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Loading configuration...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 px-4 md:px-6">
      <div className="mb-4">
        <Link
          href="/admin/settings/cron"
          className="text-xs font-semibold uppercase tracking-wider text-[#0F2552]/65 dark:text-white/65 hover:text-[#0F2552] dark:hover:text-white transition-colors"
        >
          ← Back to Cron Scheduler
        </Link>
      </div>

      <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#0F2552] dark:text-white/90">
            Edit Schedule: {job.name}
          </h2>
          <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
            Configure the trigger time and active state for this background process.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#0F2552]/70 dark:text-white/70">
              Cron Expression
            </label>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-transparent border-gray-200 dark:border-white/10 dark:text-white outline-none focus:border-[#B28309] font-mono"
              placeholder="e.g. 0 3 * * *"
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#B28309] focus:ring-[#B28309]"
            />
            <label
              htmlFor="isActive"
              className="text-xs font-semibold text-[#0F2552]/70 dark:text-white/70"
            >
              Enable Cron Task Execution
            </label>
          </div>

          {validationError && (
            <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg">
              {validationError}
            </div>
          )}

          {!validationError && nextRuns.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] uppercase tracking-wider font-semibold text-green-600">
                ✓ Valid Expression. Next 5 executions (UTC):
              </h4>
              <ul className="text-xs font-mono bg-gray-50 dark:bg-white/5 p-3 rounded-lg space-y-1 text-gray-600 dark:text-white/70">
                {nextRuns.map((time, idx) => (
                  <li key={idx}>
                    {idx + 1}. {time}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              disabled={isSaving || !!validationError}
              className="px-4 py-2 rounded-lg bg-[#B28309] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/admin/settings/cron"
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-semibold text-[#0F2552]/70 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

EditCron.getLayout = (page) => (
  <PrivateRoute permissions={[Permission.ROLES_MANAGE]}>
    <Layout title="Edit Cron Schedule">{page}</Layout>
  </PrivateRoute>
);

export default EditCron;
