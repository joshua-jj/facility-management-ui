import React from 'react';
import TextInput from '../Inputs/TextInput';
import DateInput from '../Inputs/DateInput';
import Formsy from 'formsy-react';
import TextArea from '../Inputs/TextArea';

interface MoreInformationProps {
   data: {
      location: string;
      returnDate: string;
      dateOfCollection: string;
      description: string;
   };
   setData: (data: {
      location: string;
      returnDate: string;
      dateOfCollection: string;
      description: string;
   }) => void;
}

const MoreInformation: React.FC<MoreInformationProps> = ({ data, setData }) => {
   const handleChange = (currentValues: {
      location?: string;
      return_date?: string;
      dateOfCollection?: string;
      description?: string;
   }) => {
      setData({
         location: currentValues.location || data.location,
         returnDate: currentValues.return_date || data.returnDate,
         dateOfCollection: currentValues.dateOfCollection || data.dateOfCollection,
         description: currentValues.description || data.description,
      });
   };

   return (
      <Formsy onChange={handleChange}>
         <TextInput
            type="text"
            name="location"
            label="Location of use"
            placeholder="e.g City gate church"
            value={data.location}
            required
         />
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <DateInput
               name="dateOfCollection"
               label="Collection Date"
               placeholder="Select collection date"
               value={data.dateOfCollection}
               mode="date"
            />
            <DateInput
               name="return_date"
               label="Return Date"
               placeholder="Select return date"
               value={data.returnDate}
               mode="date"
            />
         </div>
         <TextArea
            type="text"
            name="description"
            label="Description"
            placeholder="Describe what you need the items for"
            rows={4}
            value={data.description}
         />
      </Formsy>
   );
};

export default MoreInformation;
