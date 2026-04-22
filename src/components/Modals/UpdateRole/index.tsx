import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import Formsy from 'formsy-react';
import SelectInput from '@/components/Inputs/SelectInput';
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

   const [canSubmit, setCanSubmit] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedRoleId, setSelectedRoleId] = useState<string>(
      user?.role?.id ? String(user.role.id) : '',
   );

   const openModal = () => setIsModalOpen(true);
   const closeModal = useCallback(() => {
      setIsModalOpen(false);
      if (onClose) onClose();
   }, [onClose]);

   useEffect(() => {
      setSelectedRoleId(user?.role?.id ? String(user.role.id) : '');
   }, [user?.role?.id]);

   const roleOptions = (allRolesList ?? []).map((r) => ({
      value: String(r.id),
      label: r.name,
   }));

   const handleSubmit = () => {
      const data: UpdateUserRoleForm = {
         roleId: Number(selectedRoleId),
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

   return (
      <>
         <button className={className} onClick={openModal}>
            {children}
         </button>

         <ModalWrapper
            open={open || isModalOpen}
            onClose={closeModal}
            title="Change User Role"
            subtitle={user ? `Update role for ${user.firstName} ${user.lastName}` : 'Select a new role'}
            width="sm:w-[28rem]"
         >
            <Formsy
               onValidSubmit={handleSubmit}
               onValid={() => setCanSubmit(true)}
               onInvalid={() => setCanSubmit(false)}
            >
               <SelectInput
                  name="roleId"
                  label="Role"
                  placeholder="Select a role"
                  options={roleOptions}
                  value={selectedRoleId}
                  onValueChange={(val) => setSelectedRoleId(val)}
                  required
                  searchable={false}
               />

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
                     disabled={!canSubmit || !selectedRoleId}
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
                        'Change Role'
                     )}
                  </button>
               </div>
            </Formsy>
         </ModalWrapper>
      </>
   );
};

export default UpdateRole;
