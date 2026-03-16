import React, { FC, useEffect } from 'react';
import FullscreenModal from '..';
import { GreenCheckIcon } from '@/components/Icons';

interface SuccessModalProps {
  message?: string;
  subMessage?: string;
  showSuccessModal: boolean;
  autoCloseDelay?: number;
  setShowSuccessModal: (bool: boolean) => void;
}

const SuccessModal: FC<SuccessModalProps> = ({
  message,
  subMessage,
  showSuccessModal,
  autoCloseDelay = 3000,
  setShowSuccessModal,
}) => {
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, autoCloseDelay, setShowSuccessModal]);

  return (
    <FullscreenModal
      className=""
      open={showSuccessModal}
      onClickAway={() => setShowSuccessModal(false)}
    >
      <div className="flex flex-col items-center justify-center relative bg-white dark:bg-[#1a1a2e] rounded-lg shadow-lg mx-auto p-6 w-[90vw] sm:w-[28rem] text-center border border-gray-200">
        <GreenCheckIcon className="my-3 text-[#fff]" />
        {message && (
          <h2 className="font-bold text-xl pt-2 pb-1 text-[#0F2552] dark:text-white">
            {message}
          </h2>
        )}
        {subMessage && <p className="text-md text-[#0F2552] dark:text-white">{subMessage}</p>}
      </div>
    </FullscreenModal>
  );
};

export default SuccessModal;
