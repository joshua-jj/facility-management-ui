import React from 'react';

interface DetailFieldProps {
   label: string;
   value?: React.ReactNode;
   className?: string;
}

export const DetailField: React.FC<DetailFieldProps> = ({ label, value, className = '' }) => {
   return (
      <div className={`py-3 ${className}`}>
         <span className="block text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1">
            {label}
         </span>
         <span className="block text-sm font-medium text-[#0F2552] dark:text-white/85">
            {value ?? <span className="text-gray-300 dark:text-white/20">—</span>}
         </span>
      </div>
   );
};

interface DetailRowProps {
   label: string;
   value?: React.ReactNode;
   className?: string;
}

export const DetailRow: React.FC<DetailRowProps> = ({ label, value, className = '' }) => {
   return (
      <div
         className={`flex items-baseline py-3 px-4 border-b border-gray-100 dark:border-white/5 last:border-b-0 ${className}`}
      >
         <span className="w-[180px] shrink-0 text-xs font-medium text-gray-400 dark:text-white/40">
            {label}
         </span>
         <span className="flex-1 text-sm text-[#0F2552] dark:text-white/85">
            {value ?? <span className="text-gray-300 dark:text-white/20">—</span>}
         </span>
      </div>
   );
};

interface DetailSectionProps {
   title: string;
   children: React.ReactNode;
   action?: React.ReactNode;
   className?: string;
}

export const DetailSection: React.FC<DetailSectionProps> = ({ title, children, action, className = '' }) => {
   return (
      <div
         className={`bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden ${className}`}
      >
         <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
            <h3 className="text-sm font-semibold text-[#0F2552] dark:text-white/90">{title}</h3>
            {action}
         </div>
         <div>{children}</div>
      </div>
   );
};

export default DetailField;
