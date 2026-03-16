import React, { SVGProps } from 'react';
import { withFormsy } from 'formsy-react';

interface TextInputProps {
   label?: string;
   type: string;
   value?: string;
   disabled?: boolean;
   className?: string;
   inputClass?: string;
   placeholder?: string;
   required?: boolean;
   setValue: (value: string) => void;
   onValueChange?: (value: string) => void;
   clearError?: () => void;
   valError?: string;
   errorMessage?: string;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   icon?: SVGProps<SVGSVGElement> | any;
   isPristine?: boolean;
   endIcon?: SVGProps<SVGSVGElement>;
   endIconClassName?: string;
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

   const errorMessage = props.errorMessage || props.valError;

   if (errorMessage && !props.isPristine) {
      return (
         <div className={`my-3 w-full ${props.className}`}>
            {props.icon && props.icon}
            <label className="block text-sm text-gray-700 dark:text-white/60">
               {props.required ? `${props.label}*` : props.label}
            </label>
            <input
               type={props.type}
               onChange={changeValue}
               value={props.value || ''}
               required={props.required}
               placeholder={props.placeholder}
               className={`mt-1 block w-full border border-red-500 rounded-md px-3 py-2 bg-transparent text-[#0F2552] dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-red-500 ${props.inputClass}`}
            />
            {props.endIcon && (
               <span
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${props.endIconClassName || ''}`}
               >
                  {React.isValidElement(props.endIcon)
                     ? props.endIcon
                     : typeof props.endIcon === 'function'
                       ? React.createElement(props.endIcon)
                       : null}
               </span>
            )}
            <span className="text-red-500 text-sm">{errorMessage}</span>
         </div>
      );
   }

   return (
      <div className={`my-3 w-full relative ${props.className}`}>
         {props.icon && props.icon}
         <label className="block md:text-sm text-xs text-gray-700 dark:text-white/60">
            {props.required ? `${props.label}*` : props.label}
         </label>
         <input
            type={props.type}
            onChange={changeValue}
            value={props.value || ''}
            disabled={props.disabled}
            required={props.required}
            placeholder={props.placeholder}
            className={`mt-1 block md:text-sm text-xs w-full border border-gray-300 dark:border-white/15 rounded-md px-3 py-2 bg-transparent text-[#0F2552] dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#B28309]/40 focus:border-[#B28309] disabled:opacity-50 ${props.inputClass}`}
         />
         {props.endIcon && (
            <span
               className={`absolute right-3 top-1/2 -translate-y-1/2 ${props.endIconClassName || ''}`}
            >
               {React.isValidElement(props.endIcon)
                  ? props.endIcon
                  : typeof props.endIcon === 'function'
                    ? React.createElement(props.endIcon)
                    : null}
            </span>
         )}
      </div>
   );
};

export default withFormsy(TextInput);
