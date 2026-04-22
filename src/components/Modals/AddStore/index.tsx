import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import ModalWrapper from '../ModalWrapper';
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

const AddStore: React.FC<AddItemModalProps> = ({ className, children, store, open, onClose }) => {
   const dispatch = useDispatch();
   const { IsCreatingStore } = useSelector((state: RootState) => state.store);
   const [canSubmit, setCanSubmit] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const formRef = useRef<InstanceType<typeof Formsy> | null>(null);

   const openModal = () => setIsModalOpen(true);
   const closeModal = useCallback(() => {
      setIsModalOpen(false);
      formRef.current?.reset();
      if (onClose) onClose();
   }, [onClose]);

   const handleSubmit = (data: StoreForm) => {
      if (store?.id) {
         data.id = store.id;
         dispatch(storeActions.updateStore(data) as unknown as UnknownAction);
      } else {
         dispatch(storeActions.createStore(data) as unknown as UnknownAction);
      }
   };

   useEffect(() => {
      const listener = AppEmitter.addListener(storeConstants.CREATE_STORE_SUCCESS, () => {
         closeModal();
      });
      const listener2 = AppEmitter.addListener(storeConstants.UPDATE_STORE_SUCCESS, () => {
         closeModal();
      });
      return () => {
         listener.remove();
         listener2.remove();
      };
   }, [closeModal]);

   return (
      <>
         <span className={className} onClick={openModal} role="button" tabIndex={0}>
            {children}
         </span>

         <ModalWrapper
            open={open || isModalOpen}
            onClose={closeModal}
            title={store ? 'Update Store' : 'Create Store'}
            subtitle="Add a new facility store"
            width="sm:w-[28rem]"
         >
            <Formsy
               ref={formRef}
               onValidSubmit={handleSubmit}
               onValid={() => setCanSubmit(true)}
               onInvalid={() => setCanSubmit(false)}
            >
               <TextInput
                  type="text"
                  name="name"
                  value={store?.name}
                  label="Store name"
                  placeholder="Enter store name"
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
                     {IsCreatingStore ? (
                        <span className="flex items-center gap-2">
                           <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Saving...
                        </span>
                     ) : store ? (
                        'Update Store'
                     ) : (
                        'Create Store'
                     )}
                  </button>
               </div>
            </Formsy>
         </ModalWrapper>
      </>
   );
};

export default AddStore;
