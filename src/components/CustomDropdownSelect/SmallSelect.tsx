// SmallSelect.tsx
import React from 'react';

interface SmallSelectProps {
  value: number | string;
  options: { value: number | string; label: string }[];
  onChange: (value: number | string) => void;
  className?: string;
  placeholder?: string;
}

const SmallSelect: React.FC<SmallSelectProps> = ({
  value,
  options,
  onChange,
  className,
  placeholder,
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`text-xs px-2 py-1 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${className || ''}`}
  >
    <option value="" disabled>
      {placeholder}
    </option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

export default SmallSelect;
