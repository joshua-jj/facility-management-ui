import React, { ReactNode, useEffect, useState } from 'react';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import ModalWrapper from '../ModalWrapper';
import { DepartmentForm } from '@/types';
import { departmentActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { departmentConstants } from '@/constants';
import { AppEmitter } from '@/controllers/EventEmitter';

interface AddItemModalProps {
   children: ReactNode;
   className: string;
}

const AddDepartment: React.FC<AddItemModalProps> = ({ className, children }) => {
   const dispatch = useDispatch();
   const { IsCreatingDepartment } = useSelector((state: RootState) => state.department);
   const [canSubmit, setCanSubmit] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);

   const openModal = () => setIsModalOpen(true);
   const closeModal = () => setIsModalOpen(false);

   const handleSubmit = (data: DepartmentForm) => {
      dispatch(departmentActions.createDepartment(data) as unknown as UnknownAction);
   };

   useEffect(() => {
      const listener = AppEmitter.addListener(departmentConstants.CREATE_DEPARTMENT_SUCCESS, (evt: Event) => {
         if (evt as CustomEvent) setIsModalOpen(false);
      });
      return () => listener.remove();
   }, []);

   return (
      <>
         <button className={className} onClick={openModal}>
            {children}
         </button>

         <ModalWrapper
            open={isModalOpen}
            onClose={closeModal}
            title="Create Department"
            subtitle="Add a new department to the organization"
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
                  label="Department Name"
                  placeholder="Enter department name"
                  required
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
                     {IsCreatingDepartment ? (
                        <span className="flex items-center gap-2">
                           <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Creating...
                        </span>
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
