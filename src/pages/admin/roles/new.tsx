import Layout from '@/components/Layout';
import React, { useEffect, useState } from 'react';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { roleActions } from '@/actions/role.action';
import { UnknownAction } from 'redux';
import { RoleForm } from '@/types/role';
import PrivateRoute from '@/components/PrivateRoute';
import { ADMIN_ROLES } from '@/constants/roles.constant';
import { roleConstants } from '@/constants/role.constant';
import { AppEmitter } from '@/controllers/EventEmitter';
import { useRouter } from 'next/router';

const NewRole = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const [canSubmit, setCanSubmit] = useState(false);

   const { IsCreatingRole } = useSelector((s: RootState) => s.role);

   const handleSubmit = (data: RoleForm) => {
      dispatch(roleActions.createRole(data) as unknown as UnknownAction);
   };

   useEffect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listener = AppEmitter.addListener(roleConstants.CREATE_ROLE_SUCCESS, (response: any) => {
         // Redirect to edit page to assign permissions immediately.
         // The API returns 201 with { statusCode, message } but no data.id for this backend,
         // so fall back to the roles list and let the user navigate to edit from there.
         const id = response?.data?.id;
         if (id) {
            router.push(`/admin/roles/${id}`);
         } else {
            router.push('/admin/roles');
         }
      });
      return () => listener.remove();
   }, [router]);

   return (
      <PrivateRoute allowedRoles={ADMIN_ROLES}>
         <Layout title="Create Role">
            <PageHeader
               title="Create Role"
               subtitle="Add a new role to the system"
               action={
                  <ActionButton variant="outline" onClick={() => router.push('/admin/roles')}>
                     Back to Roles
                  </ActionButton>
               }
            />

            <div className="max-w-xl">
               <div
                  className="rounded-xl p-6"
                  style={{ background: 'var(--surface-paper)', border: '1px solid var(--border-default)' }}
               >
                  <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                     Role Details
                  </h2>

                  <Formsy
                     onValidSubmit={handleSubmit}
                     onValid={() => setCanSubmit(true)}
                     onInvalid={() => setCanSubmit(false)}
                  >
                     <TextInput
                        type="text"
                        name="name"
                        label="Role Name"
                        placeholder="e.g. Department Manager"
                        required
                     />

                     <TextInput
                        type="text"
                        name="description"
                        label="Description"
                        placeholder="Describe what this role is for (optional)"
                     />

                     <div
                        className="flex justify-end pt-4 mt-2 gap-2"
                        style={{ borderTop: '1px solid var(--border-default)' }}
                     >
                        <button
                           type="button"
                           onClick={() => router.push('/admin/roles')}
                           className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                           style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
                        >
                           Cancel
                        </button>
                        <button
                           disabled={!canSubmit || IsCreatingRole}
                           type="submit"
                           className="px-5 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                           style={{ background: 'var(--color-secondary)' }}
                        >
                           {IsCreatingRole ? (
                              <span className="flex items-center gap-2">
                                 <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                 Creating...
                              </span>
                           ) : (
                              'Create Role'
                           )}
                        </button>
                     </div>
                  </Formsy>
               </div>
            </div>
         </Layout>
      </PrivateRoute>
   );
};

export default NewRole;
