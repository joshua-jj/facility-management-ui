import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import PhoneInput from '@/components/Inputs/PhoneInput';
import SelectInput from '@/components/Inputs/SelectInput';
import ModalWrapper from '../ModalWrapper';
import { CreateUserForm, Users } from '@/types';
import { userActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { AppEmitter } from '@/controllers/EventEmitter';
import { userConstants } from '@/constants';

interface AddItemModalProps {
   onClose?: () => void;
   children?: ReactNode;
   className: string;
   user?: Users | null;
   open?: boolean;
}

const AddUser: React.FC<AddItemModalProps> = ({ className, children, user, onClose, open }) => {
   const dispatch = useDispatch();
   const { IsCreatingUser } = useSelector((s: RootState) => s.user);
   const { allRolesList } = useSelector((s: RootState) => s.role);
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);

   const [canSubmit, setCanSubmit] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedRoleId, setSelectedRoleId] = useState('');
   const [selectedDeptId, setSelectedDeptId] = useState('');
   const formRef = useRef<InstanceType<typeof Formsy> | null>(null);

   const resetForm = useCallback(() => {
      setSelectedRoleId('');
      setSelectedDeptId('');
      formRef.current?.reset();
   }, []);

   const openModal = () => setIsModalOpen(true);
   const closeModal = useCallback(() => {
      setIsModalOpen(false);
      resetForm();
      if (onClose) onClose();
   }, [onClose, resetForm]);

   const roleOptions = (allRolesList ?? []).map((r) => ({ value: String(r.id), label: r.name }));
   const deptOptions = (allDepartmentsList ?? []).map((d) => ({ value: String(d.id), label: d.name }));

   // Show department select only when HOD role (id=3) is selected
   const showDepartment = !user && selectedRoleId === '3';

   const handleSubmit = (data: CreateUserForm) => {
      data.role = Number(selectedRoleId);
      data.departmentId = Number(selectedDeptId) || undefined;
      dispatch(userActions.createUser(data) as unknown as UnknownAction);
   };

   useEffect(() => {
      const listener = AppEmitter.addListener(userConstants.CREATE_USER_SUCCESS, () => {
         closeModal();
      });
      return () => listener.remove();
   }, [closeModal]);

   return (
      <>
         <span className={className} onClick={openModal} role="button" tabIndex={0}>
            {children}
         </span>

         <ModalWrapper
            open={open || isModalOpen}
            onClose={closeModal}
            title={user ? 'Update User' : 'Create User'}
            subtitle="Add a new user to the system"
            width="sm:w-[36rem]"
         >
            <Formsy
               ref={formRef}
               onValidSubmit={handleSubmit}
               onValid={() => setCanSubmit(true)}
               onInvalid={() => setCanSubmit(false)}
               className="[&_.my-3]:my-1.5"
            >
               {/* Row 1 — First Name & Last Name */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  <TextInput
                     type="text"
                     name="firstName"
                     label="First Name"
                     value={user?.firstName}
                     placeholder="Enter first name"
                     required
                  />
                  <TextInput
                     type="text"
                     name="lastName"
                     label="Last Name"
                     value={user?.lastName}
                     placeholder="Enter last name"
                     required
                  />
               </div>

               {/* Row 2 — Email & Phone */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  <TextInput
                     type="email"
                     name="email"
                     label="Email"
                     value={user?.email}
                     placeholder="Enter email address"
                     validations="isEmail"
                     validationError="Please enter a valid email"
                     required
                  />
                  <PhoneInput
                     name="phoneNumber"
                     label="Phone Number"
                     value={user?.phoneNumber}
                     required
                     defaultCountry="NG"
                     outputFormat="local"
                  />
               </div>

               {/* Row 3 — Role & Department */}
               {!user && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                     <SelectInput
                        name="role"
                        label="Role"
                        placeholder="Select role"
                        options={roleOptions}
                        value={selectedRoleId}
                        onValueChange={(val) => setSelectedRoleId(val)}
                        required
                        searchable={false}
                     />
                     {showDepartment && (
                        <SelectInput
                           name="departmentId"
                           label="Department"
                           placeholder="Select department"
                           options={deptOptions}
                           value={selectedDeptId}
                           onValueChange={(val) => setSelectedDeptId(val)}
                           required
                        />
                     )}
                  </div>
               )}

               {/* Footer */}
               <div className="flex justify-end pt-3 mt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
                  <button
                     type="button"
                     onClick={closeModal}
                     className="px-4 py-2.5 rounded-lg text-xs font-semibold mr-2 cursor-pointer transition-colors"
                     style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
                  >
                     Cancel
                  </button>
                  <button
                     disabled={!canSubmit || (!user && !selectedRoleId)}
                     type="submit"
                     className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                     style={{ background: 'var(--color-secondary)' }}
                  >
                     {IsCreatingUser ? (
                        <span className="flex items-center gap-2">
                           <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Saving...
                        </span>
                     ) : user ? (
                        'Update User'
                     ) : (
                        'Create User'
                     )}
                  </button>
               </div>
            </Formsy>
         </ModalWrapper>
      </>
   );
};

export default AddUser;
