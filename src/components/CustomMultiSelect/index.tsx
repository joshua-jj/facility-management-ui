'use client';

import { useEffect, useRef, useState } from 'react';

type Option = {
  label: string;
  value: string;
};

type MultiSelectProps = {
  options: Option[];
  selected: Option[]; // always an array, even for single select
  onChange: (options: Option[]) => void;
  multiple?: boolean;
  placeholder?: string;
};

export default function MultiSelect({
  options,
  selected,
  onChange,
  multiple = true,
  placeholder = 'Select options',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = 'custom-multiselect-listbox';

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (option: Option) => {
    const isSelected = selected.some((o) => o.value === option.value);

    if (multiple) {
      if (isSelected) {
        onChange(selected.filter((o) => o.value !== option.value));
      } else {
        onChange([...selected, option]);
      }
    } else {
      onChange([option]);
      setIsOpen(false); // close on single select
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      multiple &&
      e.key === 'Backspace' &&
      search === '' &&
      selected.length > 0
    ) {
      onChange(selected.slice(0, selected.length - 1));
      return;
    }

    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      setHighlightedIndex((i) => (i + 1) % filteredOptions.length);
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex(
        (i) => (i - 1 + filteredOptions.length) % filteredOptions.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(filteredOptions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-controls={listboxId}
      className="relative w-72 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none"
    >
      {/* Display selected items or placeholder */}
      <div
        onClick={() => {
          toggleDropdown();
          inputRef.current?.focus();
        }}
        className="flex flex-wrap items-center gap-1 px-3 py-2 cursor-text min-h-[42px]"
      >
        {multiple ? (
          selected.map((option) => (
            <span
              key={option.value}
              className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-sm flex items-center gap-1"
            >
              {option.label}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(selected.filter((o) => o.value !== option.value));
                }}
                className="text-xs hover:text-red-500 focus:outline-none"
                aria-label={`Remove ${option.label}`}
              >
                ×
              </button>
            </span>
          ))
        ) : selected.length > 0 ? (
          <span className="text-sm text-gray-800">{selected[0].label}</span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}

        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[50px] outline-none text-sm py-1"
          placeholder={selected.length === 0 ? placeholder : ''}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setHighlightedIndex(0);
          }}
          aria-label="Search options"
          autoComplete="off"
        />
      </div>

      {/* Clear button for multi-select */}
      {multiple && selected.length > 0 && (
        <button
          className="absolute top-2 right-2 text-xs text-gray-400 hover:text-red-500 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            onChange([]);
          }}
          aria-label="Clear all"
        >
          Clear
        </button>
      )}

      {/* Dropdown */}
      <div
        className={`absolute z-10 mt-1 w-full border border-gray-300 rounded-md shadow-lg bg-white transition-all duration-200 ease-out overflow-hidden ${
          isOpen
            ? 'opacity-100 max-h-96 translate-y-0 pointer-events-auto'
            : 'opacity-0 max-h-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <ul
          role="listbox"
          id={listboxId}
          className="max-h-60 overflow-auto"
          aria-multiselectable={multiple}
        >
          {filteredOptions.length === 0 && (
            <li className="px-4 py-2 text-gray-500">No results found</li>
          )}
          {filteredOptions.map((option, index) => {
            const isSelected = selected.some((o) => o.value === option.value);
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                role="option"
                aria-selected={isSelected}
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`px-4 py-2 cursor-pointer flex justify-between ${
                  isHighlighted ? 'bg-blue-100' : ''
                } hover:bg-blue-100`}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <span className="text-blue-600 font-bold">✓</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
