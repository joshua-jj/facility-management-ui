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
      <div className="relative bg-white rounded-lg shadow-lg mx-auto p-6 max-w-md text-center border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <CrossIcon />
        </button>
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
            <SuccessIcon />
          </div>
        </div>
        <h2 className="text-xl font-bold text-[#0F2552] mb-1">
          Report submitted successfully
        </h2>
        <p className="text-[#0F2552] text-sm pb-5">
          Alle Berichte wurden erhalten!
        </p>
      </div>
    </FullscreenModal>
  );
};

export default SuccessModal;
