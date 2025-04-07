import React from 'react'
import TextInput from '../Inputs/TextInput';
import Formsy from 'formsy-react';

const RequestDetails = () => {
    return (
        <Formsy className="">
            <TextInput
                type='text' 
                className="text-[#0F2552] rounded font-medium text-sm" 
                name="ministry_name" 
                label='Church/Minitry name' 
                placeholder='e.g City gate church'
                inputClass='font-normal border border-gray-300 rounded'
            />
            <TextInput
                type='text' 
                className="text-[#0F2552] rounded font-medium text-sm" 
                name="ministry_name" 
                label='Name of requester' 
                placeholder='e.g City gate church'
                inputClass='font-normal border border-gray-300 rounded'
            />
            <TextInput
                type='text' 
                className="text-[#0F2552] rounded font-medium text-sm" 
                name="email" 
                label='Email address' 
                placeholder='e.g citygate@gmaial.com'
                inputClass='font-normal border border-gray-300 rounded'
            />
            <div className="my-3 w-full text-[#0F2552]">
                <label htmlFor="contact_number" className="block text-sm text-gray-700">Contact number</label>
                <div className="flex items-center gap-4 text-[#0F2552]">
                    <input type="text" name="contact_number" value="+234" className="w-2/10 mt-1 block border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" name="contact_number" placeholder="xxxxxxxxxx" className="w-8/10 mt-1 block border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>
        </Formsy>
    );
};

export default RequestDetails;
