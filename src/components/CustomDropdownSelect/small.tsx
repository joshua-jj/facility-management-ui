import React, { useEffect, useRef, useState } from 'react';
import Arrow from '../../../public/assets/icons/arrow-right.svg';

// type Option = { value: string; label: string };

// // ✅ Props for multi-select
// interface MultiSelectProps {
//   multiple: true;
//   value: string[];
//   onChange: (value: string[]) => void;
//   options: Option[];
//   className?: string;
//   placeholder?: string;
//   quantity?: number;
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
//   quantity?: number;
//   onOpen?: () => void;
// }

// type SmallSelectProps = MultiSelectProps | SingleSelectProps;
type Option<T = any> = { value: T; label: string; data?: any };

// ✅ Props for multi-select
interface MultiSelectProps<T> {
  multiple: true;
  value: T[];
  onChange: (value: T[]) => void;
  options: Option<T>[];
  className?: string;
  placeholder?: string;
  quantity?: number;
  onOpen?: () => void;
}

// ✅ Props for single-select
interface SingleSelectProps<T> {
  multiple?: false;
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  className?: string;
  placeholder?: string;
  quantity?: number;
  onOpen?: () => void;
}

type SmallSelectProps<T = string> = MultiSelectProps<T> | SingleSelectProps<T>;

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
  console.log('quantity', quantity);

  const toggleOpen = () => {
    const newOpen = !isOpen;
    setIsOpen(newOpen);
    if (newOpen && onOpen) {
      onOpen();
    }
  };

  // const handleOptionClick = (optValue: string) => {
  //   if (multiple) {
  //     if (value.includes(optValue)) {
  //       // Deselect
  //       const newValue = value.filter((v) => v !== optValue);
  //       onChange(newValue);
  //     } else {
  //       // Select, but check limit
  //       if (quantity !== undefined && value.length >= quantity) {
  //         return; // Do not add if at limit
  //       }
  //       const newValue = [...value, optValue];
  //       onChange(newValue);
  //     }
  //     // Do not close dropdown for multi-select
  //   } else {
  //     onChange(optValue);
  //     setIsOpen(false);
  //   }
  // };

  //   const handleOptionClick = (optValue: any) => {
  //   if (multiple) {
  //     if (value.includes(optValue)) {
  //       // Deselect
  //       const newValue = value.filter((v) => v !== optValue);
  //       onChange(newValue as any);
  //     } else {
  //       if (quantity !== undefined && value.length >= quantity) {
  //         return; // limit reached
  //       }
  //       const newValue = [...value, optValue];
  //       onChange(newValue as any);
  //     }
  //   } else {
  //     onChange(optValue as any);
  //     setIsOpen(false);
  //   }
  // };

  // const isSelected = (optValue: any) => {
  //   return multiple ? value.includes(optValue) : value === optValue;
  // };
  // const isSelected = (optValue: any) => {
  //   if (multiple) {
  //     // return value.some((v: any) => v.serialNumber === optValue.serialNumber);
  //   }
  //   return value && (value as any).serialNumber === optValue.serialNumber;
  // };

  const handleOptionClick = (optValue: any) => {
    if (multiple) {
      if (value.includes(optValue)) {
        const newValue = value.filter((v) => v !== optValue);
        onChange(newValue as any);
      } else {
        if (quantity !== undefined && value.length >= quantity) return;
        onChange([...(value as any), optValue]);
      }
    } else {
      onChange(optValue as any);
      setIsOpen(false);
    }
  };

  const isSelected = (optValue: any) => {
    return multiple ? (value as any).includes(optValue) : value === optValue;
  };

  const getDisplayValue = () => {
    if (multiple) {
      if (value.length === 0) {
        return placeholder;
      }
      if (quantity !== undefined) {
        return `Selected (${value.length}/${quantity})`;
      }
      return `Selected (${value.length})`;
    } else {
      return options.find((o) => o.value === value)?.label || placeholder;
    }
  };

  // const isSelected = (optValue: string) => {
  //   return multiple ? value.includes(optValue) : value === optValue;
  // };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggleOpen}
        className={`w-full text-[#0F2552] text-left px-3 py-2 rounded-[3px] flex justify-between items-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-[#0F25524D] ${multiple ? 'min-w-[250px]' : ''}`}
      >
        <span
          className={`truncate ${
            (multiple ? value.length > 0 : !!value)
              ? 'text-[#0F2552] text-sm'
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
        <div className="absolute z-10 w-full bg-white shadow-lg rounded-b-md border border-t-0 border-blue-200 max-h-40 overflow-y-auto">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => handleOptionClick(opt.value)}
              className={`flex items-center px-3 py-2 text-[13px] font-medium text-[#0F2552] cursor-pointer hover:bg-[#F2F2F6]${
                !multiple && isSelected(opt.value) ? 'bg-blue-50' : ''
              }`}
            >
              {/* {multiple && (
                <div
                  className={`w-4 h-4 mr-1 flex items-center justify-center rounded text-base flex-shrink-0 ${
                    isSelected(opt.value)
                      ? 'bg-[#0F2552] text-white'
                      : 'bg-white border border-gray-300 text-transparent'
                  }`}
                >
                  ✔
                </div>
              )} */}
              {multiple && (
                <div
                  className={`w-4 h-4 mr-1 flex items-center justify-center rounded text-base flex-shrink-0 ${
                    isSelected(opt.value)
                      ? 'bg-[#0F2552] text-white'
                      : 'bg-white border border-gray-300 text-transparent'
                  }`}
                >
                  ✔
                </div>
              )}

              <span className="truncate">{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmallSelect;
