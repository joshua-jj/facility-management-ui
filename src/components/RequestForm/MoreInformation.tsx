import React from 'react'
import TextInput from '../Inputs/TextInput';
import Formsy from 'formsy-react';
import TextArea from '../Inputs/TextArea';

const MoreInformation = () => {
    return (
        <Formsy className="">
            <TextInput
                type='text' 
                className="text-[#0F2552] rounded font-medium text-sm" 
                name="location" 
                label='Location of use' 
                placeholder='e.g City gate church'
                inputClass='font-normal border border-gray-300 rounded'
            />
            <TextInput
                type='date' 
                className="text-[#0F2552] rounded font-medium text-sm" 
                name="return_date" 
                label='Return date' 
                placeholder='select option'
                inputClass='font-normal border border-gray-300 rounded'
            />
            <TextArea
                type='text' 
                // className="text-[#0F2552] rounded font-medium text-sm" 
                name="email" 
                label='Description' 
                placeholder='Add details'
                rows={6}
                // inputClass='font-normal border border-gray-300 rounded'
            />
        </Formsy>
    );
};

export default MoreInformation;
