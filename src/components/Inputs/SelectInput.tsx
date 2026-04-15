import React from 'react';
import { withFormsy } from 'formsy-react';
import { ComboBox } from '@/components/ui/combo-box';

interface Option {
   value: string;
   label: string;
}

interface SelectInputProps {
   label?: string;
   name: string;
   value?: string;
   required?: boolean;
   className?: string;
   placeholder?: string;
   options: Option[];
   searchable?: boolean;
   setValue: (value: string) => void;
   onValueChange?: (value: string) => void;
   errorMessage?: string;
   isPristine?: boolean;
}

const SelectInput: React.FC<SelectInputProps> = (props) => {
   const { label, required, className, placeholder, options, searchable = true, errorMessage, isPristine } = props;
   const hasError = Boolean(errorMessage) && !isPristine;

   return (
      <div className={`my-3 w-full ${className ?? ''}`}>
         {label && (
            <label className="block md:text-sm text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
               {required ? `${label}*` : label}
            </label>
         )}
         <ComboBox
            value={props.value ?? ''}
            onChange={(v) => {
               props.setValue(v);
               props.onValueChange?.(v);
            }}
            options={options}
            placeholder={placeholder}
            searchable={searchable}
            error={hasError}
         />
         {hasError && <span className="text-red-500 text-xs mt-1 block">{errorMessage}</span>}
      </div>
   );
};

export default withFormsy(SelectInput);
