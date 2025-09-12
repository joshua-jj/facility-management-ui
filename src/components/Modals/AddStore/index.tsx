import React, { ReactNode, useEffect, useState } from 'react';
import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import { StoreForm } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';
import { storeConstants } from '@/constants';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { storeActions } from '@/actions';
import { UnknownAction } from 'redux';

interface AddItemModalProps {
  // onClose: () => void;
  children: ReactNode;
  className: string;
  // open: boolean;
}

const AddStore: React.FC<AddItemModalProps> = ({
  className,
  children,
  // onClose,
  // open,
}) => {
  const dispatch = useDispatch();
  const { IsCreatingStore } = useSelector((state: RootState) => state.store);
  // const [search, setSearch] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const enableButton = () => setCanSubmit(true);
  const disableButton = () => setCanSubmit(false);

  const handleSubmit = (data: StoreForm) => {
    console.log('data', data);
    dispatch(storeActions.createStore(data) as unknown as UnknownAction);
  };

  useEffect(() => {
    const listener = AppEmitter.addListener(
      storeConstants.CREATE_STORE_SUCCESS,
      (evt: Event) => {
        const newStore = evt as CustomEvent;

        if (newStore) {
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
        <div className="relative bg-white rounded-lg shadow-lg mx-auto p-6 w-[90vw] sm:w-[25rem]">
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
              name="name"
              label="Store name"
              placeholder="Enter name"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />

            <button
              disabled={!canSubmit}
              className="w-full px-4 py-2 mt-8 bg-yellow-500 text-white rounded hover:bg-yellow-600 cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              {IsCreatingStore ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                'Add store'
              )}
            </button>
          </Formsy>
        </div>
      </FullscreenModal>
    </>
  );
};

export default AddStore;
