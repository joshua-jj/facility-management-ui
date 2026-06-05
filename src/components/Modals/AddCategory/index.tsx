import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import TextArea from '@/components/Inputs/TextArea';
import ModalWrapper from '../ModalWrapper';
import { Category } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';
import { categoryConstants } from '@/constants';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { categoryActions } from '@/actions';
import { UnknownAction } from 'redux';

interface AddCategoryModalProps {
   children?: ReactNode;
   className: string;
   category?: Category | null;
   open?: boolean;
   onClose?: () => void;
}

const AddCategory: React.FC<AddCategoryModalProps> = ({ className, children, category, open, onClose }) => {
   const dispatch = useDispatch();
   const { IsMutatingCategory } = useSelector((state: RootState) => state.category);
   const [canSubmit, setCanSubmit] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const formRef = useRef<InstanceType<typeof Formsy> | null>(null);

   const openModal = () => setIsModalOpen(true);
   const closeModal = useCallback(() => {
      setIsModalOpen(false);
      formRef.current?.reset();
      if (onClose) onClose();
   }, [onClose]);

   const handleSubmit = (data: { name: string; description?: string }) => {
      if (category?.id) {
         dispatch(
            categoryActions.updateCategory({ ...data, id: category.id }) as unknown as UnknownAction,
         );
      } else {
         dispatch(categoryActions.createCategory(data) as unknown as UnknownAction);
      }
   };

   useEffect(() => {
      const listener = AppEmitter.addListener(categoryConstants.CREATE_CATEGORY_SUCCESS, () => {
         closeModal();
      });
      const listener2 = AppEmitter.addListener(categoryConstants.UPDATE_CATEGORY_SUCCESS, () => {
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
            title={category ? 'Update Category' : 'Add Category'}
            subtitle={category ? 'Update category details' : 'Add a new item category'}
            width="sm:w-[30rem]"
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
                  value={category?.name}
                  label="Category Name"
                  placeholder="Enter category name"
                  required
               />

               <TextArea
                  type="text"
                  name="description"
                  value={category?.description}
                  label="Description"
                  placeholder="Enter a brief description (optional)"
                  rows={3}
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
                     disabled={!canSubmit || IsMutatingCategory}
                     type="submit"
                     className="px-5 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                     style={{ background: 'var(--color-secondary)' }}
                  >
                     {IsMutatingCategory ? (
                        <span className="flex items-center gap-2">
                           <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Saving...
                        </span>
                     ) : category ? (
                        'Update Category'
                     ) : (
                        'Add Category'
                     )}
                  </button>
               </div>
            </Formsy>
         </ModalWrapper>
      </>
   );
};

export default AddCategory;
