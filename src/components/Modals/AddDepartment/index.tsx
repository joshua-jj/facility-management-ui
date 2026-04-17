import React, { ReactNode, useEffect, useRef, useState } from 'react';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import ModalWrapper from '../ModalWrapper';
import { Department, DepartmentForm } from '@/types';
import { departmentActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { departmentConstants } from '@/constants';
import { AppEmitter } from '@/controllers/EventEmitter';

interface AddDepartmentProps {
   children?: ReactNode;
   className?: string;
   // Edit mode — when provided, modal opens immediately and submits an update
   initialData?: Department;
   open?: boolean;
   onClose?: () => void;
}

const AddDepartment: React.FC<AddDepartmentProps> = ({ className, children, initialData, open, onClose }) => {
   const dispatch = useDispatch();
   const { IsCreatingDepartment, IsUpdatingDepartment } = useSelector((state: RootState) => state.department);
   const [canSubmit, setCanSubmit] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);

   const isEditMode = Boolean(initialData);
   const formsyRef = useRef<Formsy>(null);

   // Controlled open/close when used in edit mode from parent
   useEffect(() => {
      if (open !== undefined) {
         setIsModalOpen(open);
      }
   }, [open]);

   const openModal = () => setIsModalOpen(true);

   const closeModal = () => {
      setIsModalOpen(false);
      onClose?.();
   };

   const handleSubmit = (data: DepartmentForm) => {
      if (isEditMode && initialData) {
         dispatch(departmentActions.updateDepartment({ ...data, id: initialData.id }) as unknown as UnknownAction);
      } else {
         dispatch(departmentActions.createDepartment(data) as unknown as UnknownAction);
      }
   };

   useEffect(() => {
      const successEvent = isEditMode
         ? departmentConstants.UPDATE_DEPARTMENT_SUCCESS
         : departmentConstants.CREATE_DEPARTMENT_SUCCESS;

      const listener = AppEmitter.addListener(successEvent, (evt: Event) => {
         if (evt as CustomEvent) closeModal();
      });
      return () => listener.remove();
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isEditMode]);

   const isLoading = isEditMode ? IsUpdatingDepartment : IsCreatingDepartment;

   return (
      <>
         {children && (
            <span className={className} onClick={openModal} role="button" tabIndex={0}>
               {children}
            </span>
         )}

         <ModalWrapper
            open={isModalOpen}
            onClose={closeModal}
            title={isEditMode ? 'Edit Department' : 'Create Department'}
            subtitle={isEditMode ? 'Update department information' : 'Add a new department to the organization'}
            width="sm:w-[28rem]"
         >
            <Formsy
               ref={formsyRef}
               onValidSubmit={handleSubmit}
               onValid={() => setCanSubmit(true)}
               onInvalid={() => setCanSubmit(false)}
            >
               <TextInput
                  type="text"
                  name="name"
                  label="Department Name"
                  placeholder="Enter department name"
                  value={initialData?.name ?? ''}
                  required
               />
               <TextInput
                  type="text"
                  name="hodName"
                  label="HOD Name"
                  placeholder="Enter HOD name"
                  value={initialData?.hodName ?? ''}
               />
               <TextInput
                  type="email"
                  name="hodEmail"
                  label="HOD Email"
                  placeholder="Enter HOD email"
                  value={initialData?.hodEmail ?? ''}
                  validations="isEmail"
                  validationError="Please enter a valid email"
               />
               <TextInput
                  type="text"
                  name="hodPhone"
                  label="HOD Phone"
                  placeholder="Enter HOD phone number"
                  value={initialData?.hodPhone ?? ''}
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
                     disabled={!canSubmit}
                     type="submit"
                     className="px-5 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                     style={{ background: 'var(--color-secondary)' }}
                  >
                     {isLoading ? (
                        <span className="flex items-center gap-2">
                           <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           {isEditMode ? 'Updating...' : 'Creating...'}
                        </span>
                     ) : isEditMode ? (
                        'Update Department'
                     ) : (
                        'Create Department'
                     )}
                  </button>
               </div>
            </Formsy>
         </ModalWrapper>
      </>
   );
};

export default AddDepartment;
