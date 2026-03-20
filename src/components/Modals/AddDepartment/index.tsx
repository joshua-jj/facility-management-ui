import React, { ReactNode, useEffect, useState } from 'react';
import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import SuccessModal from '../Report/SuccessModal';
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

const AddDepartment: React.FC<AddItemModalProps> = ({
  className,
  children,
}) => {
  const dispatch = useDispatch();
  const { IsCreatingDepartment } = useSelector(
    (state: RootState) => state.department
  );
  const [canSubmit, setCanSubmit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const enableButton = () => setCanSubmit(true);
  const disableButton = () => setCanSubmit(false);

  const handleSubmit = (data: DepartmentForm) => {
    console.log('data', data);
    dispatch(
      departmentActions.createDepartment(data) as unknown as UnknownAction
    );
  };

  useEffect(() => {
    const listener = AppEmitter.addListener(
      departmentConstants.CREATE_DEPARTMENT_SUCCESS,
      (evt: Event) => {
        const newDepartment = evt as CustomEvent;

        if (newDepartment) {
          setIsModalOpen(false);
        }
      }
    );

    return () => listener.remove();
  }, []);

  return (
    <>
      <button className={className} onClick={openModal}>
        {children}
      </button>

      <FullscreenModal open={isModalOpen} onClickAway={closeModal}>
        <div className="relative bg-white rounded-lg shadow-lg mx-auto p-6 w-[90vw] sm:w-[25rem] ">
          <button
            onClick={closeModal}
            className="absolute cursor-pointer top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <CrossIcon />
          </button>
          <h2 className="text-2xl font-semibold text-textColor mb-4">
            Create Department
          </h2>
          <Formsy
            onValidSubmit={handleSubmit}
            onValid={enableButton}
            onInvalid={disableButton}
            className="space-y-4"
          >
            <TextInput
              type="text"
              name="name"
              label="Name"
              placeholder="Enter name"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            {/* <TextInput
              type="text"
              name="hodName"
              label="HOD name"
              placeholder="Enter HOD name"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="hodEmail"
              label="HOD email"
              placeholder="Enter HOD email"
              required
              validations="isEmail"
              validationErrors={{
                isEmail: 'This is not a valid email',
                required: 'Required!',
              }}
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="hodPhone"
              label="HOD phone number"
              placeholder="Enter HOD phone number"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            /> */}
            <button
              disabled={!canSubmit}
              className={`w-full px-4 py-2 mt-8 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center justify-center disabled:opacity-50 ${
                canSubmit ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              {IsCreatingDepartment ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                'Create Department'
              )}
            </button>
          </Formsy>
        </div>
      </FullscreenModal>
      <SuccessModal
        open={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        autoCloseDelay={5000}
      />
    </>
  );
};

export default AddDepartment;
