import React, { useEffect } from 'react';
import Tick from '../../../public/assets/icons/check.svg';
import Error from '../../../public/assets/icons/Error.svg';
// import Error from '../../../public/assets/icons/InfoSnack.svg';

interface SnackProps {
  onClose: () => void;
  message: React.ReactNode;
  variant: 'success' | 'error';
}

const Snack: React.FC<SnackProps> = ({ onClose, message, variant }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  return (
    <div
      className="
      absolute
      z-[2000]
      top-[10%] right-[5%]
      md:top-[15%] md:right-[5%]
      bg-[#fff]
      border-[0.5px] border-[#0F255226]
      rounded-lg
      px-4 py-2.5
      flex items-center
      min-w-[250px] max-w-[90vw] md:max-w-lg
      overflow-hidden
      animate-slide-in
      shadow-lg
    "
      style={{ boxSizing: 'border-box' }}
    >
      {variant === 'success' ? <Tick /> : <Error />}
      <p
        className="
        ml-3
        text-textColor
        text-base
        font-medium
        text-left
        max-w-[400px]
        break-words
        whitespace-pre-line
      "
      >
        {message}
      </p>
    </div>
  );
};

export default Snack;
