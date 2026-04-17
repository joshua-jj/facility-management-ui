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
               <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-300 dark:text-white/20" aria-hidden="true">
                  {/* Document */}
                  <rect x="8" y="4" width="24" height="30" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M24 4v9h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Document lines */}
                  <line x1="13" y1="19" x2="25" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="13" y1="24" x2="22" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  {/* Magnifying glass */}
                  <circle cx="33" cy="33" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                  <line x1="38.5" y1="38.5" x2="44" y2="44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
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
