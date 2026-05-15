import React, { FC, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import Layout from '@/components/Layout';
import { Breadcrumbs } from '@/components/PageHeader';
import PrivateRoute from '@/components/PrivateRoute';
import WorkflowEditor from '@/components/WorkflowEditor';
import { RootState } from '@/redux/reducers';
import { workflowActions } from '@/actions/workflow.actions';
import { WorkflowDetail, WorkflowTransition } from '@/types/workflow';
import { Permission } from '@/constants/permissions.enum';

/**
 * Detail / editor view for one workflow. Fetches the head definition
 * for `:subject` on mount and renders the canvas inside the standard
 * Settings shell.
 *
 * Save flow: editor calls back with `{ states, transitions }`; we
 * dispatch `replaceTransitions`. The saga re-fetches the detail on
 * success, which trickles back into Redux and re-renders the canvas
 * with the new version + transition list.
 */
const WorkflowDetailPage: FC = () => {
   const router = useRouter();
   const dispatch = useDispatch();
   const subject = (router.query.subject as string | undefined) ?? '';

   const detail = useSelector(
      (s: RootState) => s.workflow.current,
   ) as WorkflowDetail | null;
   const isLoading = useSelector(
      (s: RootState) => s.workflow.isLoadingCurrent,
   ) as boolean;
   const isSaving = useSelector(
      (s: RootState) => s.workflow.isSaving,
   ) as boolean;
   const error = useSelector((s: RootState) => s.workflow.error) as
      | string
      | null;

   useEffect(() => {
      if (!subject || !router.isReady) return;
      dispatch(
         workflowActions.getWorkflow({ subject }) as unknown as UnknownAction,
      );
   }, [dispatch, subject, router.isReady]);

   const handleSave = (next: {
      states: string[];
      transitions: WorkflowTransition[];
   }) => {
      if (!subject) return;
      dispatch(
         workflowActions.replaceTransitions({
            subject,
            body: {
               transitions: next.transitions,
               states: next.states,
            },
         }) as unknown as UnknownAction,
      );
   };

   const renderBody = () => {
      if (isLoading || !detail) {
         return (
            <div className="bg-white rounded-xl border border-gray-100 px-6 py-12 text-center text-sm text-gray-500">
               {error ?? 'Loading workflow…'}
            </div>
         );
      }
      return (
         <WorkflowEditor
            definition={detail.definition}
            transitions={detail.transitions}
            isSaving={isSaving}
            onSave={handleSave}
         />
      );
   };

   return (
      <PrivateRoute permissions={[Permission.ROLES_MANAGE]}>
         <Layout title={`Workflow: ${subject}`}>
            <div className="space-y-4 px-4 md:px-6 -mb-16">
               <Breadcrumbs />
               <div className="flex items-center justify-between">
                  <div>
                     <Link
                        href="/admin/settings/workflows"
                        className="text-xs font-semibold text-[#B28309] hover:underline cursor-pointer"
                     >
                        ← Back to workflows
                     </Link>
                     <h2 className="text-lg font-bold text-[#0F2552] dark:text-white/90 mt-1">
                        {detail?.definition.subject ?? subject}{' '}
                        {detail && (
                           <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded bg-[#B28309]/15 text-[#B28309] ml-2 align-middle">
                              v{detail.definition.version}
                           </span>
                        )}
                     </h2>
                     {detail?.definition.description && (
                        <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
                           {detail.definition.description}
                        </p>
                     )}
                  </div>
               </div>

               {renderBody()}
            </div>
         </Layout>
      </PrivateRoute>
   );
};

export default WorkflowDetailPage;
