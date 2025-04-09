import React from 'react';
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
  rows?: number;
}

const TextArea: React.FC<TextInputProps> = (props) => {
  const changeValue = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (props.clearError && typeof props.clearError === 'function') {
      props.clearError();
    }

    props.setValue(e.currentTarget.value);
    if (props.onValueChange && typeof props.onValueChange === 'function') {
      props.onValueChange(e.currentTarget.value);
    }
  };

  return (
    <div className="my-3">
      <label className="block text-sm font-medium text-gray-700">
        {props.required ? `${props.label}*` : props.label}
      </label>
      <textarea
        value={props.value || ''}
        onChange={changeValue}
        placeholder={props.placeholder}
        required={props.required}
        rows={props.rows || 6}
        className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none ${
          props.value ? 'text-black' : 'text-gray-500'
        }`}
      />
    </div>
  );
};
export default withFormsy(TextArea);
