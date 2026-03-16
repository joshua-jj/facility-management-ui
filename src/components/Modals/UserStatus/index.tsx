import React, { ReactNode, useState } from 'react';
import { useDispatch } from 'react-redux';
import { UnknownAction } from 'redux';

import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';
import { userActions } from '@/actions';

type UserStatusAction = 'activate' | 'deactivate';

interface UserStatusModalProps {
  className: string;
  userId: string | number;
  action: UserStatusAction;
  userName?: string;
  open?: boolean;
  onClose?: () => void;
  children?: ReactNode;
}

const UserStatusModal: React.FC<UserStatusModalProps> = ({
  className,
  children,
  userId,
  userName,
  action,
  open,
  onClose,
}) => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isDeactivate = action === 'deactivate';

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    onClose?.();
  };

  const handleConfirm = () => {
    dispatch(
      (isDeactivate
        ? userActions.deactivateUser({ ids: [userId as number] })
        : userActions.activateUser({
            ids: [userId as number],
          })) as unknown as UnknownAction
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
          {/* Close */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60"
          >
            <CrossIcon />
          </button>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-textColor dark:text-white mb-3">
            {isDeactivate ? 'Deactivate User' : 'Activate User'}
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-white/50 mb-5 leading-relaxed">
            {isDeactivate ? (
              <>
                Are you sure you want to deactivate{' '}
                <span className="font-medium">{userName || 'this user'}</span>?
                They will no longer be able to access their account until
                reactivated.
              </>
            ) : (
              <>
                This will restore access for{' '}
                <span className="font-medium">{userName || 'this user'}</span>.
                They will be able to log in and use the platform again.
              </>
            )}
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-md bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-300 cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              className={
                isDeactivate
                  ? 'px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                  : 'px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 cursor-pointer'
              }
            >
              {isDeactivate ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      </FullscreenModal>
    </>
  );
};

export default UserStatusModal;
