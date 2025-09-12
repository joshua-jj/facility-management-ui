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
      <div className="flex flex-col items-center justify-center py-12 px-8 shadow-md w-[90vw] sm:w-[28rem]">
        <GreenCheckIcon className="my-3 text-[#fff]" />
        {message && (
          <h2 className="font-bold text-xl pt-2 pb-1 text-[#0F2552]">
            {message}
          </h2>
        )}
        {subMessage && <p className="text-md text-[#0F2552]">{subMessage}</p>}
      </div>
    </FullscreenModal>
  );
};

export default SuccessModal;
