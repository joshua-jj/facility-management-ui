import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import { Store, StoreForm } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';
import { storeConstants } from '@/constants';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { storeActions } from '@/actions';
import { UnknownAction } from 'redux';

interface AddItemModalProps {
  children?: ReactNode;
  className: string;
  store?: Store | null;
  open?: boolean;
  onClose?: () => void;
}

const AddStore: React.FC<AddItemModalProps> = ({
  className,
  children,
  store,
  open,
  onClose,
}) => {
  const dispatch = useDispatch();
  const { IsCreatingStore } = useSelector((state: RootState) => state.store);
  // const [search, setSearch] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  // const closeModal = () => setIsModalOpen(false);
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    if (onClose) onClose();
  }, [onClose]);
  const enableButton = () => setCanSubmit(true);
  const disableButton = () => setCanSubmit(false);

  const handleSubmit = (data: StoreForm) => {
    console.log('data', data);
    if (store?.id) {
      data.id = store?.id;
      dispatch(storeActions.updateStore(data) as unknown as UnknownAction);
    } else {
      dispatch(storeActions.createStore(data) as unknown as UnknownAction);
    }
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

  useEffect(() => {
    const listener2 = AppEmitter.addListener(
      storeConstants.UPDATE_STORE_SUCCESS,
      (evt: Event) => {
        const updatedStore = evt as CustomEvent;
        console.log('updatedStore', updatedStore);

        if (updatedStore) {
          console.log('INSIDE updatedStore', updatedStore);

          closeModal();
        }
      }
    );

    return () => listener2.remove();
  }, [closeModal]);

  return (
    <>
      <button className={className} onClick={openModal}>
        {children}
      </button>

      <FullscreenModal open={open || isModalOpen} onClickAway={closeModal}>
        <div className="relative bg-white rounded-lg shadow-lg mx-auto p-6 w-[90vw] sm:w-[25rem]">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <CrossIcon />
          </button>
          <h2 className="text-2xl font-semibold text-textColor mb-4">
            {store ? 'Update' : 'Create'} Store
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
              value={store?.name}
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
              ) : store ? (
                'Update store'
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
