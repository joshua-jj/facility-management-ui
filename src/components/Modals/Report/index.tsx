import React, { useEffect, useState } from 'react';
import FullscreenModal from '../';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import TextArea from '@/components/Inputs/TextArea';
import { ReportForm } from '@/types';
import { reportActions } from '@/actions';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { RootState } from '@/redux/reducers';
import { AppEmitter } from '@/controllers/EventEmitter';
import { reportConstants } from '@/constants';
import SuccessModal from './SuccessModal';

interface ReportProps {
  className?: string;
  children?: React.ReactNode;
}

const Report: React.FC<ReportProps> = ({ className, children }) => {
  const dispatch = useDispatch();
  const { IsCreatingReport } = useSelector((s: RootState) => s.report);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const enableButton = () => setCanSubmit(true);
  const disableButton = () => setCanSubmit(false);

  const handleSubmit = (data: ReportForm) => {
    dispatch(reportActions.sendReport(data) as unknown as UnknownAction);
  };

  useEffect(() => {
    const listener = AppEmitter.addListener(
      reportConstants.SEND_REPORT_SUCCESS,
      (evt: Event) => {
        const customEvent = evt as CustomEvent;

        if (customEvent) {
          setIsModalOpen(false);
          setIsSuccessOpen(true);
        }
      }
    );

    return () => listener.remove();
  }, []);

  return (
    <>
      <button onClick={openModal} className={className}>
        {children}
      </button>

      <FullscreenModal open={isModalOpen} onClickAway={closeModal}>
        \{' '}
        <div className="bg-white rounded-lg shadow-lg mx-auto p-6 sm:w-[400px] md:w-[500px] lg:w-[600px]">
          <h2 className="text-2xl font-semibold text-textColor mb-4">
            Report an issue
          </h2>
          <Formsy
            onValidSubmit={handleSubmit}
            onValid={enableButton}
            onInvalid={disableButton}
            className="space-y-4"
          >
            <TextInput
              type="text"
              name="complainerName"
              label="Full name"
              placeholder="Enter name"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="email"
              name="complainerEmail"
              label="Email address"
              placeholder="Enter email"
              validations="isEmail"
              validationErrors={{
                isEmail: 'This is not a valid email',
                required: 'Required!',
              }}
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="complainerPhone"
              label="Contact number"
              placeholder="XXXXXXXX"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            {/* Contact Number */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact number
              </label>
              <div className="mt-1 flex space-x-2">
                <input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-20 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="XXXXXXXX"
                  required
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div> */}
            <TextInput
              type="text"
              name="complaintSubject"
              label="Subject of Complaint"
              placeholder="Enter subject"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextArea
              type="text"
              name="complaintDescription"
              label="Description"
              placeholder="Add details"
              required
            />
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 cursor-pointer border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
              >
                Back
              </button>
              <button
                disabled={!canSubmit}
                type="submit"
                className={`px-4 py-2 bg-yellow-600 text-white rounded-md transition hover:bg-yellow-700 ${
                  canSubmit ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                {IsCreatingReport ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </Formsy>
        </div>
      </FullscreenModal>
      <SuccessModal
        open={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        autoCloseDelay={5000}
      />
    </>
  );
};

export default Report;
