import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import Formsy from 'formsy-react';
import ModalWrapper from '../ModalWrapper';
import { UpdateUserRoleForm, Users } from '@/types';
import { userActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { AppEmitter } from '@/controllers/EventEmitter';
import { userConstants } from '@/constants';

interface UpdateRoleModalProps {
   onClose?: () => void;
   children?: ReactNode;
   className: string;
   user?: Users | null;
   open?: boolean;
}

const UpdateRole: React.FC<UpdateRoleModalProps> = ({ className, children, user, onClose, open }) => {
   const dispatch = useDispatch();
   const { IsUpdatingUserRole } = useSelector((s: RootState) => s.user);
   const { allRolesList } = useSelector((s: RootState) => s.role);

   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
      user?.roles?.map((r) => String(r.id)) ?? [],
   );

   const openModal = () => setIsModalOpen(true);
   const closeModal = useCallback(() => {
      setIsModalOpen(false);
      if (onClose) onClose();
   }, [onClose]);

   // Re-seed from the latest user prop whenever the modal opens or the
   // user changes — admins commonly bounce between rows.
   useEffect(() => {
      setSelectedRoleIds(user?.roles?.map((r) => String(r.id)) ?? []);
   }, [user]);

   const toggleRole = (id: string, checked: boolean) => {
      setSelectedRoleIds((prev) =>
         checked ? [...prev, id] : prev.filter((existing) => existing !== id),
      );
   };

   const handleSubmit = () => {
      // Coerce + filter — guard against any stale "undefined"/empty
      // entries that could leak in if the API ever returns a role
      // shape without ids. The server validates positive ints; sending
      // NaN/0 would 400 the whole request.
      const cleanRoleIds = selectedRoleIds
         .map((v) => Number(v))
         .filter((n) => Number.isInteger(n) && n > 0);
      const data: UpdateUserRoleForm = {
         roleIds: cleanRoleIds,
         userId: user?.id as number,
      };
      dispatch(userActions.updateUserRole(data) as unknown as UnknownAction);
   };

   useEffect(() => {
      const listener = AppEmitter.addListener(userConstants.UPDATE_USER_ROLE_SUCCESS, (evt: Event) => {
         if (evt as CustomEvent) closeModal();
      });
      return () => listener.remove();
   }, [closeModal]);

   const canSubmit = selectedRoleIds.length > 0;

   return (
      <>
         <button className={className} onClick={openModal}>
            {children}
         </button>

         <ModalWrapper
            open={open || isModalOpen}
            onClose={closeModal}
            title="Manage User Roles"
            subtitle={
               user
                  ? `Update roles for ${user.firstName} ${user.lastName}. The MEMBER role is auto-merged server-side.`
                  : 'Select one or more roles'
            }
            width="sm:w-[28rem]"
         >
            <Formsy onValidSubmit={handleSubmit}>
               <div
                  className="rounded-lg p-3 mb-3 max-h-72 overflow-y-auto"
                  style={{ background: 'var(--surface-low)', border: '1px solid var(--border-default)' }}
                  role="group"
                  aria-label="Roles"
               >
                  {(allRolesList ?? []).map((r) => {
                     const idStr = String(r.id);
                     const checked = selectedRoleIds.includes(idStr);
                     return (
                        <label
                           key={r.id}
                           className="flex items-center gap-2 py-1.5 cursor-pointer text-sm"
                           style={{ color: 'var(--text-primary)' }}
                        >
                           <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => toggleRole(idStr, e.target.checked)}
                              className="cursor-pointer"
                           />
                           <span>{r.name}</span>
                        </label>
                     );
                  })}
                  {(!allRolesList || allRolesList.length === 0) && (
                     <p className="text-xs" style={{ color: 'var(--text-hint)' }}>
                        No roles available.
                     </p>
                  )}
               </div>

               <div className="flex justify-end pt-3 mt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
                  <button
                     type="button"
                     onClick={closeModal}
                     className="px-4 py-2 rounded-lg text-xs font-semibold mr-2 cursor-pointer transition-colors"
                     style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
                  >
                     Cancel
                  </button>
                  <button
                     disabled={!canSubmit}
                     type="submit"
                     className="px-5 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                     style={{ background: 'var(--color-secondary)' }}
                  >
                     {IsUpdatingUserRole ? (
                        <span className="flex items-center gap-2">
                           <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Updating...
                        </span>
                     ) : (
                        'Save Roles'
                     )}
                  </button>
               </div>
            </Formsy>
         </ModalWrapper>
      </>
   );
};

export default UpdateRole;
