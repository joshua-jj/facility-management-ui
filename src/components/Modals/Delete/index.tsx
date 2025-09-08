import React, { ReactNode, useState } from 'react';
import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';
import { itemActions } from '@/actions';
import { useDispatch } from 'react-redux';
import { UnknownAction } from 'redux';
// import { DeleteIcon } from '../../Icons';

// import { Users } from '@/types';

interface DeleteModalProps {
  onClose?: () => void;
  children?: ReactNode;
  className: string;
  itemId?: string | number;
  open?: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  className,
  children,
  onClose,
  open,
  itemId,
}) => {
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    if (onClose) onClose();
  };
  const handleDelete = () => {
    console.log('Deleting item with ID:', itemId);
    dispatch(
      itemActions.deleteItem({
        id: itemId as number,
      }) as unknown as UnknownAction
    );
    closeModal();
  };

  return (
    <>
      <button className={className} onClick={openModal}>
        {children}
      </button>

      <FullscreenModal open={open || isModalOpen} onClickAway={closeModal}>
        <div className="relative bg-white rounded-lg shadow-lg mx-auto p-6 sm:w-[400px] md:w-[500px] ">
          <button
            onClick={closeModal}
            className="absolute cursor-pointer top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <CrossIcon />
          </button>
          <h2 className="text-2xl font-semibold text-textColor mb-4">
            Delete Item
          </h2>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this item? This action cannot be
            undone.
          </p>
          <div className="flex justify-end">
            <button
              onClick={closeModal}
              className="bg-gray-200 text-gray-700 cursor-pointer px-4 py-2 rounded-md mr-2"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white cursor-pointer px-4 py-2 rounded-md"
            >
              Delete
            </button>
          </div>
        </div>
      </FullscreenModal>
    </>
  );
};

export default DeleteModal;
