import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Arrow from '../../../public/assets/icons/arrow-right.svg';

// type SmallSelectProps = MultiSelectProps | SingleSelectProps;
type Option<T = string> = { value: T; label: string; data?: unknown };

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
  const [popoverRect, setPopoverRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideTrigger = wrapperRef.current?.contains(target);
      const insidePopover = popoverRef.current?.contains(target);
      if (!insideTrigger && !insidePopover) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      setPopoverRect({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    const newOpen = !isOpen;
    setIsOpen(newOpen);
    if (newOpen && onOpen) {
      onOpen();
    }
  };

  const handleOptionClick = (optValue: string) => {
    if (multiple) {
      if (value.includes(optValue)) {
        const newValue = value.filter((v) => v !== optValue);
        onChange(newValue);
      } else {
        if (quantity !== undefined && value.length >= quantity) return;
        onChange([...value, optValue]);
      }
    } else {
      onChange(optValue);
      setIsOpen(false);
    }
  };

  const isSelected = (optValue: string) => {
    return multiple ? value.includes(optValue) : value === optValue;
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

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggleOpen}
        className={`w-full text-[#0F2552] dark:text-white text-left px-3 py-2 rounded-[3px] flex justify-between items-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-[#0F25524D] dark:border-white/15 ${multiple ? 'min-w-[250px]' : ''}`}
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
      {isOpen && popoverRect && typeof window !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: popoverRect.top,
            left: popoverRect.left,
            width: popoverRect.width,
          }}
          className="z-[1000] mt-1 bg-white dark:bg-[#1a1a2e] shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] rounded-md border border-blue-200 dark:border-white/15 max-h-40 overflow-y-auto"
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => handleOptionClick(opt.value)}
              className={`flex items-center px-3 py-2 text-[13px] font-medium text-[#0F2552] dark:text-white cursor-pointer hover:bg-[#F2F2F6] dark:hover:bg-white/5 ${
                !multiple && isSelected(opt.value) ? 'bg-blue-50 dark:bg-white/10' : ''
              }`}
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
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
};

export default SmallSelect;
