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
   noSearch?: boolean;
}

export default function CustomDropdownSelect({
   options,
   value,
   onChange,
   placeholder = 'Select an option',
   showSelectedLabel = false,
   noSearch,
}: CustomDropdownSelectProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [search, setSearch] = useState('');

   const selectedOption = options.find((opt) => opt.value === value);

   const filteredOptions = useMemo(() => {
      return options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()));
   }, [search, options]);

   return (
      <div className="relative space-y-2">
         <button
            type="button"
            className="w-full bg-white dark:bg-white/5 border border-gray-300 dark:border-white/15 rounded shadow-sm px-4 py-3 text-left text-sm text-[#0F2552] dark:text-white/85 flex items-center justify-between hover:border-gray-400 dark:hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#B28309]/40 capitalize transition-colors"
            onClick={() => setIsOpen(!isOpen)}
         >
            <span className={selectedOption ? '' : 'text-gray-400 dark:text-white/30'}>
               {selectedOption ? selectedOption.label : placeholder}
            </span>
            <CaretIcon className="h-4 w-4 text-gray-500 dark:text-white/30" />
         </button>

         {isOpen && (
            <div className="absolute z-10 mt-2 w-full bg-white dark:bg-[#1a1a2e] border border-gray-300 dark:border-white/15 rounded shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] max-h-72 overflow-hidden">
               {!noSearch && (
                  <div className="p-2 border-b border-gray-200 dark:border-white/10">
                     <div className="flex items-center space-x-2 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">
                        <SearchIcon className="h-4 w-4 text-gray-400 dark:text-white/30" />
                        <input
                           type="text"
                           placeholder="Search..."
                           value={search}
                           onChange={(e) => setSearch(e.target.value)}
                           className="w-full bg-transparent outline-none text-sm text-[#0F2552] dark:text-white/85 placeholder:text-gray-400 dark:placeholder:text-white/25"
                        />
                     </div>
                  </div>
               )}
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
                           className={`cursor-pointer capitalize text-xs px-4 py-2 text-[#0F2552] dark:text-white/75 hover:bg-[#B28309]/10 dark:hover:bg-[#B28309]/15 ${
                              option.value === value
                                 ? 'bg-[#B28309]/5 dark:bg-[#B28309]/10 font-semibold'
                                 : ''
                           } flex items-center justify-between transition-colors`}
                        >
                           {option.label}
                        </li>
                     ))
                  ) : (
                     <li className="px-4 py-2 text-sm text-gray-500 dark:text-white/30">No results found</li>
                  )}
               </ul>
            </div>
         )}

         {showSelectedLabel && (
            <div className="text-sm text-gray-700 dark:text-white/60">
               Selected: {selectedOption?.label || 'None'}
            </div>
         )}
      </div>
   );
}
