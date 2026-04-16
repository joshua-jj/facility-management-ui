import React, { useEffect, useState } from 'react';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import ModalWrapper from '../ModalWrapper';
import { Permission, PermissionForm } from '@/types/permission';
import { permissionActions } from '@/actions/permission.action';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { permissionConstants } from '@/constants/permission.constant';
import { AppEmitter } from '@/controllers/EventEmitter';

interface AddPermissionProps {
   open: boolean;
   onClose: () => void;
   initialData?: Permission | null;
   onSaved?: () => void;
}

const AddPermission: React.FC<AddPermissionProps> = ({ open, onClose, initialData, onSaved }) => {
   const dispatch = useDispatch();
   const { IsCreatingPermission, IsUpdatingPermission } = useSelector((state: RootState) => state.permission);
   const [canSubmit, setCanSubmit] = useState(false);
   const isEdit = !!initialData;
   const isBusy = isEdit ? IsUpdatingPermission : IsCreatingPermission;

   const handleSubmit = (data: PermissionForm) => {
      if (isEdit && initialData) {
         dispatch(
            permissionActions.updatePermission({ id: initialData.id, ...data }) as unknown as UnknownAction,
         );
      } else {
         dispatch(permissionActions.createPermission(data) as unknown as UnknownAction);
      }
   };

   useEffect(() => {
      const successEvent = isEdit
         ? permissionConstants.UPDATE_PERMISSION_SUCCESS
         : permissionConstants.CREATE_PERMISSION_SUCCESS;

      const listener = AppEmitter.addListener(successEvent, () => {
         onClose();
         if (onSaved) onSaved();
      });
      return () => listener.remove();
   }, [isEdit, onClose, onSaved]);

   return (
      <ModalWrapper
         open={open}
         onClose={onClose}
         title={isEdit ? 'Edit Permission' : 'Create Permission'}
         subtitle={isEdit ? 'Update the permission details' : 'Add a new permission'}
         width="sm:w-[28rem]"
      >
         <Formsy
            onValidSubmit={handleSubmit}
            onValid={() => setCanSubmit(true)}
            onInvalid={() => setCanSubmit(false)}
         >
            <TextInput
               type="text"
               name="name"
               label="Permission Name"
               placeholder="Enter permission name"
               value={initialData?.name ?? ''}
               required
            />

            <TextInput
               type="text"
               name="description"
               label="Description"
               placeholder="Enter description (optional)"
               value={initialData?.description ?? ''}
            />

            <div className="flex justify-end pt-3 mt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
               <button
                  type="button"
                  onClick={onClose}
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
                  {isBusy ? (
                     <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {isEdit ? 'Saving...' : 'Creating...'}
                     </span>
                  ) : isEdit ? (
                     'Save Changes'
                  ) : (
                     'Create Permission'
                  )}
               </button>
            </div>
         </Formsy>
      </ModalWrapper>
   );
};

export default AddPermission;
