import React from 'react';
import { useSelector } from 'react-redux';
import TextInput from '../Inputs/TextInput';
import PhoneInput from '../Inputs/PhoneInput';
import SelectInput from '../Inputs/SelectInput';
import Formsy from 'formsy-react';
import { RootState } from '@/redux/reducers';
import { Department } from '@/types';

interface RequestDetailsProps {
   data: {
      ministryName: string;
      requesterName: string;
      email: string;
      contactNumber: string;
      ownDepartmentId: string;
   };
   setData: (data: {
      ministryName: string;
      requesterName: string;
      email: string;
      contactNumber: string;
      ownDepartmentId: string;
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
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);

   const departmentOptions = (allDepartmentsList ?? []).map((d: Department) => ({
      value: String(d.id),
      label: d.name,
   }));

   const handleChange = (currentValues: {
      ministry_name?: string;
      requester_name?: string;
      email?: string;
      contact_number?: string;
   }) => {
      setData({
         ...data,
         ministryName: isWorkerRoute ? 'EGFM' : currentValues.ministry_name || data.ministryName,
         requesterName: currentValues.requester_name || data.requesterName,
         email: currentValues.email || data.email,
         contactNumber: currentValues.contact_number || data.contactNumber,
      });
   };

   return (
      <Formsy
         onChange={handleChange}
         onValid={() => setIsFormValid(true)}
         onInvalid={() => setIsFormValid(false)}
      >
         {!isWorkerRoute && (
            <TextInput
               type="text"
               name="ministry_name"
               label="Church/Ministry Name"
               placeholder="e.g City Gate Church"
               value={data.ministryName}
               required
            />
         )}
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <TextInput
               type="text"
               name="requester_name"
               label="Name of Requester"
               placeholder="e.g John Doe"
               value={data.requesterName}
               required
            />
            <TextInput
               type="email"
               name="email"
               label="Email Address"
               placeholder="e.g john@example.com"
               value={data.email}
               validations="isEmail"
               validationError="Please enter a valid email"
               required
            />
         </div>
         <PhoneInput
            name="contact_number"
            label="Contact Number"
            value={data.contactNumber}
            defaultCountry="NG"
            outputFormat="local"
            required
         />
         <SelectInput
            name="own_department_id"
            label="Your Department"
            placeholder="Select your department"
            options={departmentOptions}
            value={data.ownDepartmentId}
            onValueChange={(val) =>
               setData({ ...data, ownDepartmentId: val })
            }
            required
            searchable
         />
      </Formsy>
   );
};

export default RequestDetails;
