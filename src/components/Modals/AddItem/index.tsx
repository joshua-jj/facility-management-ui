import React, { ReactNode, useState } from 'react';
import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';

interface AddItemModalProps {
    // onClose: () => void;
    children: ReactNode;
    className: string;
    // open: boolean;
}

const AddItem: React.FC<AddItemModalProps> = ({
    className,
    children,
    // onClose,
    // open,
}) => {
    const [openModal, setOpenModal] = useState(false);

    const handleOnClickAway = () => {
        setOpenModal(false)
    }

    return (
        <>
            <button className={className} onClick={() => setOpenModal(true)}>{children}</button>
            <FullscreenModal open={openModal} onClickAway={handleOnClickAway}>
                <div className="relative bg-white rounded-lg shadow-lg mx-auto p-6 max-w-md text-center border border-gray-200">
                    <button
                        onClick={handleOnClickAway}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                        <CrossIcon />
                    </button>
                    <div className="">add item</div>
                </div>
            </FullscreenModal>
        </>
    );
};

export default AddItem;
;