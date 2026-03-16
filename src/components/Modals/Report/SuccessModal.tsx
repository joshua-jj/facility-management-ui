import React, { useEffect } from 'react';
import FullscreenModal from '../';
import SuccessIcon from '../../../../public/assets/icons/check.svg';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  autoCloseDelay?: number;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  open,
  onClose,
  autoCloseDelay,
}) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [open, autoCloseDelay, onClose]);

  return (
    <FullscreenModal open={open} onClickAway={onClose}>
      <div className="relative bg-white dark:bg-[#1a1a2e] rounded-lg shadow-lg mx-auto p-6 w-[90vw] sm:w-[28rem] text-center border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60"
        >
          <CrossIcon />
        </button>
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
            <SuccessIcon />
          </div>
        </div>
        <h2 className="text-xl font-bold text-[#0F2552] dark:text-white mb-1">
          Report submitted successfully
        </h2>
        <p className="text-[#0F2552] dark:text-white/80 text-sm pb-5">
          Alle Berichte wurden erhalten!
        </p>
      </div>
    </FullscreenModal>
  );
};

export default SuccessModal;
