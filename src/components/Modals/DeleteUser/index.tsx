import React, { ReactNode, useState } from 'react';
import { useDispatch } from 'react-redux';
import { UnknownAction } from 'redux';

import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';
import { userActions } from '@/actions';

interface DeleteUserModalProps {
   className: string;
   userId: string | number;
   userName?: string;
   open?: boolean;
   onClose?: () => void;
   children?: ReactNode;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
   className,
   children,
   userId,
   userName,
   open,
   onClose,
}) => {
   const dispatch = useDispatch();
   const [isModalOpen, setIsModalOpen] = useState(false);

   const openModal = () => setIsModalOpen(true);
   const closeModal = () => {
      setIsModalOpen(false);
      onClose?.();
   };

   const handleConfirm = () => {
      dispatch(
         userActions.deleteUser({
            id: userId as number,
         }) as unknown as UnknownAction,
      );
      closeModal();
   };

   return (
      <>
         <button className={className} onClick={openModal}>
            {children}
         </button>

         <FullscreenModal open={open || isModalOpen} onClickAway={closeModal}>
            <div className="relative bg-white dark:bg-[#1a1a2e] rounded-lg shadow-lg mx-auto p-6 w-[90vw] sm:w-[26rem]">
               <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60"
               >
                  <CrossIcon />
               </button>

               <h2 className="text-2xl font-semibold text-textColor dark:text-white mb-3">
                  Delete User
               </h2>

               <p className="text-gray-600 dark:text-white/50 mb-5 leading-relaxed">
                  Are you sure you want to delete{' '}
                  <span className="font-medium">{userName || 'this user'}</span>? This
                  removes their access and they will no longer appear in the user
                  list.
               </p>

               <div className="flex justify-end gap-3">
                  <button
                     onClick={closeModal}
                     className="px-4 py-2 rounded-md bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-300 cursor-pointer"
                  >
                     Cancel
                  </button>
                  <button
                     onClick={handleConfirm}
                     className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                  >
                     Delete
                  </button>
               </div>
            </div>
         </FullscreenModal>
      </>
   );
};

export default DeleteUserModal;
