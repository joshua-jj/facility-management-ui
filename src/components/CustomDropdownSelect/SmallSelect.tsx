// import React from 'react';

// interface SmallSelectProps {
//   value: number | string;
//   options: { value: number | string; label: string }[];
//   onChange: (value: number | string) => void;
//   className?: string;
//   placeholder?: string;
// }

// const SmallSelect: React.FC<SmallSelectProps> = ({
//   value,
//   options,
//   onChange,
//   className,
//   placeholder,
// }) => (
//   <select
//     value={value}
//     onChange={(e) => onChange(e.target.value)}
//     className={`text-xs px-2 py-1 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${className || ''}`}
//   >
//     <option value="" disabled>
//       {placeholder}
//     </option>
//     {options.map((opt) => (
//       <option key={opt.value} value={opt.value}>
//         {opt.label}
//       </option>
//     ))}
//   </select>
// );

// export default SmallSelect;

// import React from "react";

// type Option = { value: string; label: string };

// // ✅ Props for multi-select
// interface MultiSelectProps {
//   multiple: true;
//   value: string[];
//   onChange: (value: string[]) => void;
//   options: Option[];
//   className?: string;
//   placeholder?: string;
//   onOpen?: () => void;
// }

// // ✅ Props for single-select
// interface SingleSelectProps {
//   multiple?: false;
//   value: string;
//   onChange: (value: string) => void;
//   options: Option[];
//   className?: string;
//   placeholder?: string;
//   onOpen?: () => void;
// }

// type SmallSelectProps = MultiSelectProps | SingleSelectProps;

// const SmallSelect: React.FC<SmallSelectProps> = ({
//   value,
//   options,
//   onChange,
//   className,
//   placeholder,
//   onOpen,
//   multiple,
// }) => {
//   const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     if (multiple) {
//       const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
//       (onChange as (value: string[]) => void)(selected);
//     } else {
//       (onChange as (value: string) => void)(e.target.value);
//     }
//   };

//   return (
//     <select
//       multiple={multiple}
//       value={multiple ? value : value || ""} // ✅ correct type for <select>
//       onChange={handleChange}
//       onClick={onOpen}
//       className={`text-xs px-2 py-1 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${className || ""}`}
//     >
//       {/* ✅ Show placeholder only in single-select mode */}
//       {/* {!multiple && placeholder hidden && ( */}
//         <option value="" disabled>
//           {placeholder}
//         </option>
//       {/* )} */}
//       {options.map((opt) => (
//         // <option key={opt.value} value={opt.value}>
//         //   {opt.label}
//         // </option>
//         <option key={String(opt.value)} value={opt.value}>
//           {opt.label}
//         </option>
//       ))}
//     </select>
//   );
// };

// export default SmallSelect;

import React, { useEffect, useRef, useState } from 'react';
import Arrow from '../../../public/assets/icons/arrow-right.svg';

type Option = { value: string; label: string };

// ✅ Props for multi-select
interface MultiSelectProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
  options: Option[];
  className?: string;
  placeholder?: string;
  quantity?: number;
  onOpen?: () => void;
}

// ✅ Props for single-select
interface SingleSelectProps {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
  placeholder?: string;
  quantity?: number;
  onOpen?: () => void;
}

type SmallSelectProps = MultiSelectProps | SingleSelectProps;

const SmallSelect: React.FC<SmallSelectProps> = ({
  multiple,
  value,
  onChange,
  options,
  quantity,
  className = '',
  placeholder = 'Select option',
  onOpen,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    const newOpen = !isOpen;
    setIsOpen(newOpen);
    if (newOpen && onOpen) {
      onOpen();
    }
  };

  // const handleOptionClick = (optValue: string) => {
  //   if (multiple) {
  //     const newValue = value.includes(optValue)
  //       ? value.filter((v) => v !== optValue)
  //       : [...value, optValue];
  //     onChange(newValue);
  //     // Do not close dropdown for multi-select
  //   } else {
  //     onChange(optValue);
  //     setIsOpen(false);
  //   }
  // };
  const handleOptionClick = (optValue: string) => {
    if (multiple) {
      if (value.includes(optValue)) {
        // ✅ allow deselect
        onChange(value.filter((v) => v !== optValue));
      } else {
        // ✅ only add if under quantity
        if (!quantity || value.length < quantity) {
          onChange([...value, optValue]);
        }
      }
    } else {
      onChange(optValue);
      setIsOpen(false);
    }
  };

  const getDisplayValue = () => {
    if (multiple) {
      return placeholder;
      // if (value.length === 0) return placeholder;
      // return value
      //   .map((v) => options.find((o) => o.value === v)?.label || v)
      //   .join(", ");
    } else {
      return options.find((o) => o.value === value)?.label || placeholder;
    }
  };

  const isSelected = (optValue: string) => {
    return multiple ? value.includes(optValue) : value === optValue;
  };

  return (
    <div
      ref={wrapperRef}
      // className={`relative ${className}`}
      className={`relative ${className} ${multiple ? 'min-w-[250px]' : 'w-full'}`}
    >
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full text-[#0F2552] dark:text-white/85 text-left px-3 py-2 rounded-[3px] flex justify-between items-center text-sm focus:outline-none focus:ring-1 focus:ring-[#B28309]/40 border border-[#0F25524D] dark:border-white/15 bg-transparent transition-colors"
      >
        <span
          className={`truncate ${
            (multiple ? value.length > 0 : !!value)
              ? 'text-[#0F2552] dark:text-white text-sm'
              : 'text-gray-400'
          }`}
        >
          {getDisplayValue()}
        </span>
        <span className="ml-2 text-blue-800 flex-shrink-0">
          <Arrow />
        </span>
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full bg-white dark:bg-[#1a1a2e] shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-b-md border border-t-0 border-blue-200 dark:border-white/15 max-h-40 overflow-y-auto">
          {/* {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => handleOptionClick(opt.value)}
              className={`flex items-center px-3 py-2 text-[13px] font-medium text-[#0F2552] cursor-pointer hover:bg-[#F2F2F6]${
                !multiple && isSelected(opt.value) ? "bg-blue-50" : ""
              }`}
            >
              {multiple && (
                <div
                  className={`w-4 h-4 mr-1 flex items-center justify-center rounded text-base flex-shrink-0 ${
                    isSelected(opt.value)
                      ? "bg-[#0F2552] text-white"
                      : "bg-white border border-gray-300 text-transparent"
                  }`}
                >
                  ✔
                </div>
              )}
              <span className="truncate">{opt.label}</span>
            </div>
          ))} */}
          {options.map((opt) => {
            const disabled =
              multiple &&
              quantity !== undefined &&
              value.length >= quantity &&
              !value.includes(opt.value);

            return (
              <div
                key={opt.value}
                onClick={() => !disabled && handleOptionClick(opt.value)}
                className={`flex items-center px-3 py-2 text-[13px] font-medium cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#F2F2F6] dark:hover:bg-white/5'}
        ${!multiple && isSelected(opt.value) ? 'bg-blue-50' : ''}
      `}
              >
                {multiple && (
                  <div
                    className={`w-4 h-4 mr-1 flex items-center justify-center rounded text-base flex-shrink-0 ${
                      isSelected(opt.value)
                        ? 'bg-[#0F2552] text-white'
                        : 'bg-white border border-gray-300 dark:border-white/15 text-transparent'
                    }`}
                  >
                    ✔
                  </div>
                )}
                <span className="truncate">{opt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SmallSelect;
