// components/Report.tsx
import React, { useState, FormEvent } from 'react';
import FullscreenModal from '../';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import TextArea from '@/components/Inputs/TextArea';

interface ReportProps {
  className?: string;
  children?: React.ReactNode;
}

const Report: React.FC<ReportProps> = ({ className, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+234');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const enableButton = () => setCanSubmit(true);
  const disableButton = () => setCanSubmit(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: send your data to API
    console.log({ fullName, email, countryCode, phone, subject, description });
    closeModal();
  };

  return (
    <>
      <button onClick={openModal} className={className}>
        {children}
      </button>

      <FullscreenModal open={isModalOpen} onClickAway={closeModal}>
        <div className="bg-white rounded-lg shadow-lg max-w-md mx-auto p-6">
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
              name="name"
              label="Full name"
              placeholder="Enter name"
              required
            />
            <TextInput
              type="text"
              name="email"
              label="Email address"
              placeholder="Enter email"
              validations="isEmail"
              validationErrors={{
                isEmail: 'This is not a valid email',
                required: 'Required!',
              }}
              required
            />
            {/* Contact Number */}
            <div>
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
            </div>
            <TextInput
              type="email"
              name="subject"
              label="Subject of Complaint"
              placeholder="Enter subject"
              required
            />
            <TextArea
              type="email"
              name="description"
              label="Description"
              placeholder="Add details"
              required
            />
            {/* Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
              >
                Back
              </button>
              <button
                disabled={!canSubmit}
                type="submit"
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition"
              >
                Submit
              </button>
            </div>
          </Formsy>
        </div>
      </FullscreenModal>
    </>
  );
};

export default Report;
