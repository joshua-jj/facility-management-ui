'use client';

import React, { useState, useMemo } from 'react';
import { CaretIcon, SearchIcon } from '../Icons';

interface Option {
  label: string;
  value: string;
}

interface CustomDropdownSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showSelectedLabel?: boolean;
}

export default function CustomDropdownSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  showSelectedLabel = false,
}: CustomDropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = useMemo(() => {
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, options]);

  return (
    <div className="relative space-y-2">
      <button
        type="button"
        className="w-full bg-white border border-gray-300 rounded shadow-sm px-4 py-2 text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <CaretIcon className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded shadow-lg max-h-72 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="flex items-center space-x-2 bg-gray-100 px-2 py-1 rounded-md">
              <SearchIcon className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`cursor-pointer capitalize text-xs px-4 py-2 hover:bg-blue-100 ${
                    option.value === value ? 'bg-blue-50 font-semibold' : ''
                  } flex items-center justify-between`}
                >
                  {option.label}
                  {/* {option.value === value && (
                                        <Check className="h-4 w-4 text-blue-600" />
                                    )} */}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-sm text-gray-500">
                No results found
              </li>
            )}
          </ul>
        </div>
      )}

      {showSelectedLabel && (
        <div className="text-sm text-gray-700">
          Selected: {selectedOption?.label || 'None'}
        </div>
      )}
    </div>
  );
}
