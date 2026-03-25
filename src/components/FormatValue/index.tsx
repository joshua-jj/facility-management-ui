import React from 'react';

interface PhoneDisplayProps {
   value: string;
}

export const PhoneDisplay: React.FC<PhoneDisplayProps> = ({ value }) => {
   if (!value) return <span>-</span>;
   return <span className="tabular-nums">{value}</span>;
};
