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
}

const RequestDetails: React.FC<RequestDetailsProps> = ({ data, setData }) => {
  const handleChange = (currentValues: {
    ministry_name?: string;
    requester_name?: string;
    email?: string;
    contact_number?: string;
  }) => {
    setData({
      ministryName: currentValues.ministry_name || '',
      requesterName: currentValues.requester_name || '',
      email: currentValues.email || '',
      contactNumber: currentValues.contact_number || '',
    });
  };

  return (
    <Formsy onChange={handleChange} className="">
      <TextInput
        type="text"
        className="text-[#0F2552] rounded font-medium text-sm"
        name="ministry_name"
        label="Church/Ministry name"
        placeholder="e.g City gate church"
        inputClass="font-normal border border-gray-300 rounded"
        value={data.ministryName}
      />
      <TextInput
        type="text"
        className="text-[#0F2552] rounded font-medium text-sm"
        name="requester_name"
        label="Name of requester"
        placeholder="e.g John Doe"
        inputClass="font-normal border border-gray-300 rounded"
        value={data.requesterName}
      />
      <TextInput
        type="text"
        className="text-[#0F2552] rounded font-medium text-sm"
        name="email"
        label="Email address"
        placeholder="e.g citygate@gmail.com"
        inputClass="font-normal border border-gray-300 rounded"
        value={data.email}
      />
      <TextInput
        type="text"
        className="text-[#0F2552] rounded font-medium text-sm"
        name="contact_number"
        label="Contact number"
        placeholder="xxxxxxxxxx"
        inputClass="font-normal border border-gray-300 rounded"
        value={data.contactNumber}
      />
    </Formsy>
  );
};

export default RequestDetails;
