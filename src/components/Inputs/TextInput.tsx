import React from 'react'
import { withFormsy } from 'formsy-react';

interface TextInputProps {
    label: string;
    type: string;
    value?: string;
    placeholder?: string;
    required?: boolean;
    setValue: (value: string) => void;
    onValueChange?: (value: string) => void;
    clearError?: () => void;
    valError?: string;
}

const TextInput: React.FC<TextInputProps> = (props) => {

    const changeValue = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (props.clearError && typeof props.clearError === 'function') {
            props.clearError();
        }

        props.setValue(e.currentTarget.value);
        if (props.onValueChange && typeof props.onValueChange === 'function') {
            props.onValueChange(e.currentTarget.value);
        }
    };

    return (
        <div className='my-3 w-full'>
            <label className="block text-sm font-medium text-gray-700">
                {props.required ? `${props.label}*` : props.label}
            </label>
            <input
                type={props.type}
                value={props.value || ''}
                onChange={changeValue}
                placeholder={props.placeholder}
                required={props.required}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}
export default withFormsy(TextInput);
