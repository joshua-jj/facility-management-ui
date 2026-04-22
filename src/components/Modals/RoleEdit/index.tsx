import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import { RootState } from '@/redux/reducers';
import { roleActions, permissionActions, appActions } from '@/actions';
import PermissionGrid from '@/components/PermissionGrid';
import { AppEmitter } from '@/controllers/EventEmitter';
import { roleConstants } from '@/constants/role.constant';

type Props = {
   roleId: number | null; // null = create mode
   isOpen: boolean;
   onClose: () => void;
};

const RoleEdit: FC<Props> = ({ roleId, isOpen, onClose }) => {
   const dispatch = useDispatch();
   const { selectedRole, IsCreatingRole, IsUpdatingRole, IsReplacingPermissions, error } =
      useSelector((s: RootState) => s.role);
   const { allPermissionsList: permissions } = useSelector((s: RootState) => s.permission);

   const loading = IsCreatingRole || IsUpdatingRole || IsReplacingPermissions;

   const [canSubmit, setCanSubmit] = useState(false);
   const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
   const [name, setName] = useState('');
   const [description, setDescription] = useState('');

   /**
    * Phase 2 of the create flow: holds the permission IDs to apply once the
    * new role ID is available via AppEmitter CREATE_ROLE_SUCCESS.
    */
   const [pendingPermissions, setPendingPermissions] = useState<number[] | null>(null);

   /** On open: load permissions + role (edit) or reset (create) */
   useEffect(() => {
      if (!isOpen) return;
      if (!permissions || permissions.length === 0) {
         dispatch(permissionActions.getPermissions() as unknown as UnknownAction);
      }
      if (roleId != null) {
         dispatch(roleActions.getRole(roleId) as unknown as UnknownAction);
      } else {
         setName('');
         setDescription('');
         setCheckedIds(new Set());
         setPendingPermissions(null);
      }
   }, [isOpen, roleId, dispatch, permissions]);

   /** Populate form when role loads in edit mode */
   useEffect(() => {
      if (roleId == null || !selectedRole || selectedRole.id !== roleId) return;
      setName(selectedRole.name ?? '');
      setDescription(selectedRole.description ?? '');
      const ids = new Set<number>();
      selectedRole.permissions?.forEach((p: { id: number }) => ids.add(p.id));
      setCheckedIds(ids);
   }, [selectedRole, roleId]);

   /**
    * Phase 2 — create flow only.
    * The createRole saga emits CREATE_ROLE_SUCCESS with the API response
    * (jsonResponse.data = new role object). We listen here and fire
    * replaceRolePermissions once we have the new role's ID.
    *
    * NOTE: selectedRole is NOT updated by CREATE_ROLE_SUCCESS (the reducer
    * only reacts to GET_ROLE_SUCCESS), so we must use AppEmitter rather
    * than watching Redux state for the new ID.
    */
   const handleCreateSuccess = useCallback(
      (evt: Event) => {
         if (!isOpen || roleId != null) return;
         const response = (evt as CustomEvent).detail as {
            data?: { id?: number };
            message?: string;
         } | null;
         const newRoleId = response?.data?.id;

         if (pendingPermissions && pendingPermissions.length > 0 && newRoleId) {
            dispatch(
               roleActions.replaceRolePermissions(
                  newRoleId,
                  pendingPermissions,
               ) as unknown as UnknownAction,
            );
         } else {
            // No permissions to assign — creation is complete.
            dispatch(
               appActions.setSnackBar({
                  type: 'success',
                  message: response?.message ?? 'Role created successfully',
                  variant: 'success',
               }) as unknown as UnknownAction,
            );
            setPendingPermissions(null);
            onClose();
         }
      },
      [isOpen, roleId, pendingPermissions, dispatch, onClose],
   );

   useEffect(() => {
      if (!isOpen || roleId != null) return;
      const sub = AppEmitter.addListener(
         roleConstants.CREATE_ROLE_SUCCESS,
         handleCreateSuccess,
      );
      return () => sub.remove();
   }, [isOpen, roleId, handleCreateSuccess]);

   /** Edit flow: close after replaceRolePermissions succeeds */
   const handleReplaceSuccess = useCallback(() => {
      if (!isOpen || roleId == null) return;
      onClose();
   }, [isOpen, roleId, onClose]);

   useEffect(() => {
      if (!isOpen || roleId == null) return;
      const sub = AppEmitter.addListener(
         roleConstants.REPLACE_ROLE_PERMISSIONS_SUCCESS,
         handleReplaceSuccess,
      );
      return () => sub.remove();
   }, [isOpen, roleId, handleReplaceSuccess]);

   /**
    * Create flow Phase 2 — close after replaceRolePermissions succeeds.
    * Reuses the same REPLACE_ROLE_PERMISSIONS_SUCCESS event but only when
    * we are in create mode with pending permissions.
    */
   const handleReplaceSuccessAfterCreate = useCallback(() => {
      if (!isOpen || roleId != null || !pendingPermissions) return;
      setPendingPermissions(null);
      onClose();
   }, [isOpen, roleId, pendingPermissions, onClose]);

   useEffect(() => {
      if (!isOpen || roleId != null) return;
      const sub = AppEmitter.addListener(
         roleConstants.REPLACE_ROLE_PERMISSIONS_SUCCESS,
         handleReplaceSuccessAfterCreate,
      );
      return () => sub.remove();
   }, [isOpen, roleId, handleReplaceSuccessAfterCreate]);

   /** Surface API errors via snackbar */
   useEffect(() => {
      if (!isOpen || !error) return;
      dispatch(
         appActions.setSnackBar({
            type: 'error',
            message: error,
            variant: 'error',
         }) as unknown as UnknownAction,
      );
   }, [error, dispatch, isOpen]);

   const permissionIds = useMemo(() => Array.from(checkedIds), [checkedIds]);

   const handleSubmit = () => {
      if (roleId == null) {
         // Phase 1: create the role; Phase 2 fires in AppEmitter listener above.
         setPendingPermissions(permissionIds);
         dispatch(
            roleActions.createRole({ name, description }) as unknown as UnknownAction,
         );
      } else {
         dispatch(
            roleActions.updateRole({ id: roleId, name, description }) as unknown as UnknownAction,
         );
         dispatch(
            roleActions.replaceRolePermissions(roleId, permissionIds) as unknown as UnknownAction,
         );
      }
   };

   if (!isOpen) return null;
   if (typeof document === 'undefined') return null; // SSR guard

   return createPortal(
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4">
         <div className="bg-white dark:bg-[#0e0e1a] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-white/10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
               <h2 className="text-base font-bold text-[#0F2552] dark:text-white/90">
                  {roleId == null ? 'Add Role and Permission' : 'Customize Role'}
               </h2>
               <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                  aria-label="Close"
               >
                  ✕
               </button>
            </div>

            <Formsy
               onValidSubmit={handleSubmit}
               onValid={() => setCanSubmit(true)}
               onInvalid={() => setCanSubmit(false)}
            >
               <div className="p-6 space-y-6">
                  <TextInput
                     name="name"
                     label="Role Name"
                     type="text"
                     required
                     value={name}
                     onValueChange={(val: string) => setName(val)}
                  />
                  <TextInput
                     name="description"
                     label="Description"
                     type="text"
                     value={description}
                     onValueChange={(val: string) => setDescription(val)}
                  />
                  <div>
                     <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                           Permission Preview
                        </h4>
                        <span className="text-[0.65rem] text-gray-400 dark:text-white/35 uppercase tracking-wider">
                           ({permissions?.length ?? 0} modules loaded)
                        </span>
                     </div>
                     <PermissionGrid
                        permissions={permissions ?? []}
                        value={checkedIds}
                        onChange={setCheckedIds}
                     />
                  </div>
               </div>

               <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-2">
                  <button
                     type="button"
                     onClick={onClose}
                     className="px-4 py-2 text-xs font-semibold text-[#0F2552]/70 dark:text-white/70 cursor-pointer"
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     disabled={!canSubmit || loading}
                     className="bg-[#B28309] text-white px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#9a7208] disabled:opacity-50 cursor-pointer"
                  >
                     {loading
                        ? 'Saving…'
                        : roleId == null
                        ? 'Create Role'
                        : 'Update Role'}
                  </button>
               </div>
            </Formsy>
         </div>
      </div>,
      document.body,
   );
};

export default RoleEdit;
