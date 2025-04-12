import React, { ReactNode, useState } from 'react';
import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import SuccessModal from '../Report/SuccessModal';

interface AddItemModalProps {
  // onClose: () => void;
  children: ReactNode;
  className: string;
  // open: boolean;
}

const AddItem: React.FC<AddItemModalProps> = ({
  className,
  children,
  // onClose,
  // open,
}) => {
  // const [search, setSearch] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  // const [departmentIsOpen, setDepartmentIsOpen] = useState(false);
  // const { allDepartmentsList } = useSelector((s: RootState) => s.department);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const enableButton = () => setCanSubmit(true);
  const disableButton = () => setCanSubmit(false);

  const handleSubmit = () => {};

  return (
    <>
      <button className={className} onClick={openModal}>
        {children}
      </button>

      <FullscreenModal open={isModalOpen} onClickAway={closeModal}>
        <div className="relative bg-white rounded-lg shadow-lg mx-auto p-6 sm:w-[400px] md:w-[500px] ">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <CrossIcon />
          </button>
          <h2 className="text-2xl font-semibold text-textColor mb-4">
            Create Store
          </h2>
          <Formsy
            onValidSubmit={handleSubmit}
            onValid={enableButton}
            onInvalid={disableButton}
            className="space-y-4"
          >
            <TextInput
              type="text"
              name="item_title"
              label="Store name"
              placeholder="Enter name"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
              Quantity
            </label>
            <div className="flex items-center text-[#0F2552] gap-4 mb-6">
              <button
                // onClick={() => handleQuantityChange(item, -1)}
                className="w-2/10 h-10 px-3 py-1 border border-gray-300 rounded-l"
                // disabled={(item.requestedQuantity || 0) <= 1}
              >
                -
              </button>
              <div className="w-6/10 h-10 border border-gray-300 flex items-center justify-center">
                <input
                  type="text"
                  // value={item.requestedQuantity || 0}
                  readOnly
                  className="w-full text-center border-none focus:outline-none"
                />
              </div>
              <button
                // onClick={() => handleQuantityChange(item, 1)}
                className="w-2/10 h-10 px-3 py-1 border border-gray-300 rounded-r"
                // disabled={
                // (item.requestedQuantity || 0) >= (item.availableQuantity || 0)
                // }
              >
                +
              </button>
            </div>

            <button
              // onClick={addItem}
              className="w-full h-12 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Add more item
            </button>

            <button
              onClick={handleSubmit}
              // disabled={!canSubmit() || IsCreatingRequest}
              disabled={!canSubmit}
              className="w-full px-4 py-2 mt-8 bg-yellow-500 text-white rounded hover:bg-yellow-600 cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              Add item
              {/* {IsCreatingRequest ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Loading...</span>
                                </div>
                            ) : (
                                'Submit'
                            )} */}
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

export default AddItem;
