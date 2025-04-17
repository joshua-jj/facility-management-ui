import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';

interface FullscreenModalProps {
  open: boolean;
  onClickAway?: () => void;
  hidden?: boolean;
  notification?: boolean;
  download?: boolean;
  className?: string;
  children?: ReactNode;
}

const FullscreenModal: React.FC<FullscreenModalProps> = ({
  open,
  onClickAway,
  hidden,
  download,
  className,
  children,
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!open || !isClient) return null;

  return createPortal(
    <div
      className={classNames(
        'fixed inset-0 z-[6001] flex items-center justify-center pt-10',
        {
          hidden: hidden,
          'bg-[#000000b0] bg-opacity-30': !download,
        }
      )}
    >
      <div onClick={onClickAway} className="absolute inset-0" />
      <div
        className={classNames(
          'relative max-h-[90vh] w-fit max-w-[90vw] overflow-auto rounded-lg bg-white shadow-lg',
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default FullscreenModal;
