import Layout from '@/components/Layout';
import React, { useEffect, useState } from 'react';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { roleActions } from '@/actions/role.action';
import { UnknownAction } from 'redux';
import TransferPane from '@/components/TransferPane';
import PrivateRoute from '@/components/PrivateRoute';
import { ADMIN_ROLES } from '@/constants/roles.constant';
import { roleConstants } from '@/constants/role.constant';
import { AppEmitter } from '@/controllers/EventEmitter';
import { useRouter } from 'next/router';

const RoleDetail = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const { id } = router.query;
   const roleId = id ? Number(id) : null;

   const [canSubmit, setCanSubmit] = useState(false);

   const {
      selectedRole,
      availablePermissions,
      assignedPermissions,
      IsUpdatingRole,
      IsFetchingAvailablePermissions,
      IsFetchingAssignedPermissions,
      IsAddingPermissions,
      IsRemovingPermissions,
   } = useSelector((s: RootState) => s.role);

   useEffect(() => {
      if (!roleId) return;
      dispatch(roleActions.getRole(roleId) as unknown as UnknownAction);
      dispatch(roleActions.getAvailablePermissions(roleId) as unknown as UnknownAction);
      dispatch(roleActions.getAssignedPermissions(roleId) as unknown as UnknownAction);
   }, [dispatch, roleId]);

   useEffect(() => {
      const listener = AppEmitter.addListener(roleConstants.UPDATE_ROLE_SUCCESS, () => {
         if (roleId) {
            dispatch(roleActions.getRole(roleId) as unknown as UnknownAction);
         }
      });
      return () => listener.remove();
   }, [dispatch, roleId]);

   const handleSubmit = (data: { name: string; description?: string }) => {
      if (!roleId) return;
      dispatch(
         roleActions.updateRole({ id: roleId, ...data }) as unknown as UnknownAction,
      );
   };

   const handleAdd = (permissionIds: number[]) => {
      if (!roleId) return;
      dispatch(roleActions.addPermissionsToRole({ roleId, permissionIds }) as unknown as UnknownAction);
   };

   const handleRemove = (permissionIds: number[]) => {
      if (!roleId) return;
      dispatch(roleActions.removePermissionsFromRole({ roleId, permissionIds }) as unknown as UnknownAction);
   };

   const permissionsLoading = IsFetchingAvailablePermissions || IsFetchingAssignedPermissions;

   return (
      <PrivateRoute allowedRoles={ADMIN_ROLES}>
         <Layout title="Edit Role">
            <PageHeader
               title={selectedRole?.name ?? 'Edit Role'}
               subtitle="Update role details and manage permission assignments"
               action={
                  <div className="flex items-center gap-2">
                     <ActionButton variant="outline" onClick={() => router.push(`/admin/roles/${roleId}/users`)}>
                        View Users
                     </ActionButton>
                     <ActionButton variant="outline" onClick={() => router.push('/admin/roles')}>
                        Back to Roles
                     </ActionButton>
                  </div>
               }
            />

            <div className="space-y-6">
               {/* Role details form */}
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
                        value={selectedRole?.name ?? ''}
                        required
                     />

                     <TextInput
                        type="text"
                        name="description"
                        label="Description"
                        placeholder="Describe what this role is for (optional)"
                        value={selectedRole?.description ?? ''}
                     />

                     <div
                        className="flex justify-end pt-4 mt-2 gap-2"
                        style={{ borderTop: '1px solid var(--border-default)' }}
                     >
                        <button
                           disabled={!canSubmit || IsUpdatingRole}
                           type="submit"
                           className="px-5 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                           style={{ background: 'var(--color-secondary)' }}
                        >
                           {IsUpdatingRole ? (
                              <span className="flex items-center gap-2">
                                 <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                 Saving...
                              </span>
                           ) : (
                              'Save Changes'
                           )}
                        </button>
                     </div>
                  </Formsy>
               </div>

               {/* Permissions section */}
               <div
                  className="rounded-xl p-6"
                  style={{ background: 'var(--surface-paper)', border: '1px solid var(--border-default)' }}
               >
                  <div className="flex items-center justify-between mb-4">
                     <div>
                        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                           Manage Permissions
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                           Move permissions between Available and Assigned columns
                        </p>
                     </div>
                     {(IsAddingPermissions || IsRemovingPermissions) && (
                        <div
                           className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                           style={{ borderColor: 'var(--color-secondary)', borderTopColor: 'transparent' }}
                        />
                     )}
                  </div>

                  <TransferPane
                     available={availablePermissions}
                     assigned={assignedPermissions}
                     onAdd={handleAdd}
                     onRemove={handleRemove}
                     loading={permissionsLoading}
                     availableTitle="Available Permissions"
                     assignedTitle="Assigned Permissions"
                  />
               </div>
            </div>
         </Layout>
      </PrivateRoute>
   );
};

export default RoleDetail;
