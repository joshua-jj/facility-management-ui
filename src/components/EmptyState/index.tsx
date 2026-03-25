import React from 'react';

interface EmptyStateProps {
   icon?: React.ReactNode;
   title?: string;
   description?: string;
   action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
   icon,
   title = 'No data found',
   description = 'There are no records to display at the moment.',
   action,
}) => {
   return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
         {icon ? (
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-5 text-gray-400 dark:text-white/30">
               {icon}
            </div>
         ) : (
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-5">
               <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 dark:text-white/20">
                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="13 2 13 9 20 9" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
            </div>
         )}
         <h3 className="text-sm font-semibold text-[#0F2552] dark:text-white/80 mb-1">{title}</h3>
         <p className="text-xs text-gray-400 dark:text-white/40 max-w-[280px] leading-relaxed">{description}</p>
         {action && <div className="mt-5">{action}</div>}
      </div>
   );
};

export default EmptyState;
