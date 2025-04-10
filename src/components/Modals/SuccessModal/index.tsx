import React, {FC} from 'react';
import FullscreenModal from '..';
import { GreenCheck } from '@/components/Icons';

interface SuccessModalProps {
    message?: string,
    subMessage?: string,
    showSuccessModal: boolean,
    setShowSuccessModal: (bool: boolean) => void;
};

const SuccessModal: FC<SuccessModalProps> = ({message, subMessage, showSuccessModal, setShowSuccessModal}) => {

    return (
        <FullscreenModal className="" open={showSuccessModal} onClickAway={() => setShowSuccessModal(false)}>
            <div className="flex flex-col items-center justify-center py-12 px-8 shadow-md">
                <GreenCheck className="my-3 text-[#fff]" />
                {message && <h2 className="font-bold text-xl pt-2 pb-1 text-[#0F2552]">{message}</h2>}
                {subMessage && <p className="text-md text-[#0F2552]">{subMessage}</p>}
            </div>
        </FullscreenModal>
    );
};

export default SuccessModal;
