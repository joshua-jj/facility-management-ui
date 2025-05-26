import React from 'react';
import TextInput from '../Inputs/TextInput';
import Formsy from 'formsy-react';

interface RequestDetailsProps {
  data: {
    ministryName: string;
    requesterName: string;
    email: string;
    contactNumber: string;
  };
  setData: (data: {
    ministryName: string;
    requesterName: string;
    email: string;
    contactNumber: string;
  }) => void;
  isWorkerRoute: boolean;
  setIsFormValid: (isValid: boolean) => void;
}

const RequestDetails: React.FC<RequestDetailsProps> = ({
  data,
  setData,
  isWorkerRoute,
  setIsFormValid,
}) => {
  const handleChange = (currentValues: {
    ministry_name?: string;
    requester_name?: string;
    email?: string;
    contact_number?: string;
  }) => {
    setData({
      ministryName: isWorkerRoute ? 'EGFM' : currentValues.ministry_name || '',
      requesterName: currentValues.requester_name || '',
      email: currentValues.email || '',
      contactNumber: currentValues.contact_number || '',
    });
  };

  return (
    <Formsy
      onChange={handleChange}
      className=""
      onValid={() => setIsFormValid(true)}
      onInvalid={() => setIsFormValid(false)}
    >
      {!isWorkerRoute && (
        <TextInput
          type="text"
          className="text-[#0F2552] rounded font-medium text-sm"
          name="ministry_name"
          label="Church/Ministry name"
          placeholder="e.g City gate church"
          inputClass="font-normal border border-gray-300 rounded"
          value={data.ministryName}
          required
        />
      )}
      <TextInput
        type="text"
        className="text-[#0F2552] rounded font-medium text-sm"
        name="requester_name"
        label="Name of requester"
        placeholder="e.g John Doe"
        inputClass="font-normal border border-gray-300 rounded"
        value={data.requesterName}
        required
      />
      <TextInput
        type="text"
        className="text-[#0F2552] rounded font-medium text-sm"
        name="email"
        label="Email address"
        placeholder="e.g citygate@gmail.com"
        inputClass="font-normal border border-gray-300 rounded"
        value={data.email}
        validations="isEmail"
        validationError="This is not a valid email"
        required
      />
      <TextInput
        type="text"
        className="text-[#0F2552] rounded font-medium text-sm"
        name="contact_number"
        label="Contact number"
        placeholder="xxxxxxxxxx"
        inputClass="font-normal border border-gray-300 rounded"
        value={data.contactNumber}
        validations="isValidPhone"
        validationError="Please enter a valid phone number."
        required
      />
    </Formsy>
  );
};

export default RequestDetails;
