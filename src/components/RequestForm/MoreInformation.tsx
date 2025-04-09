import React from 'react';
import TextInput from '../Inputs/TextInput';
import Formsy from 'formsy-react';
import TextArea from '../Inputs/TextArea';

interface MoreInformationProps {
  data: {
    location: string;
    returnDate: string;
    description: string;
  };
  setData: (data: {
    location: string;
    returnDate: string;
    description: string;
  }) => void;
}

const MoreInformation: React.FC<MoreInformationProps> = ({ data, setData }) => {
  const handleChange = (currentValues: {
    location?: string;
    return_date?: string;
    description?: string;
  }) => {
    setData({
      location: currentValues.location || '',
      returnDate: currentValues.return_date || '',
      description: currentValues.description || '',
    });
  };

  return (
    <Formsy onChange={handleChange} className="">
      <TextInput
        type="text"
        className="text-[#0F2552] rounded font-medium text-sm"
        name="location"
        label="Location of use"
        placeholder="e.g City gate church"
        inputClass="font-normal border border-gray-300 rounded"
        value={data.location}
      />
      <TextInput
        type="date"
        className="text-[#0F2552] rounded font-medium text-sm"
        name="return_date"
        label="Return date"
        placeholder="select option"
        inputClass="font-normal border border-gray-300 rounded"
        value={data.returnDate}
      />
      <TextArea
        type="text"
        name="description"
        label="Description"
        placeholder="Add details"
        rows={6}
        value={data.description}
      />
    </Formsy>
  );
};

export default MoreInformation;
