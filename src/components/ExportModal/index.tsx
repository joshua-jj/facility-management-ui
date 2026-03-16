import React, { useState } from 'react';
import FullscreenModal from '@/components/Modals';
import { ActionButton } from '@/components/PageHeader';

interface ExportModalProps {
   open: boolean;
   onClose: () => void;
   onExport: (from: string, to: string) => void;
   loading?: boolean;
   title?: string;
}

const ExportModal: React.FC<ExportModalProps> = ({
   open,
   onClose,
   onExport,
   loading = false,
   title = 'Export Records',
}) => {
   const [fromDate, setFromDate] = useState('');
   const [toDate, setToDate] = useState('');
   const [rangeType, setRangeType] = useState<'all' | 'custom'>('all');

   const handleExport = () => {
      if (rangeType === 'all') {
         onExport('', '');
      } else {
         onExport(fromDate, toDate);
      }
   };

   const handleClose = () => {
      setFromDate('');
      setToDate('');
      setRangeType('all');
      onClose();
   };

   return (
      <FullscreenModal open={open} onClickAway={handleClose}>
         <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-xl w-[90vw] sm:w-[420px] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
               <div>
                  <h2 className="text-sm font-semibold text-[#0F2552] dark:text-white/90">{title}</h2>
                  <p className="text-[0.65rem] text-gray-400 dark:text-white/35 mt-0.5">Choose a date range or export all records</p>
               </div>
               <button
                  onClick={handleClose}
                  className="text-gray-300 dark:text-white/20 hover:text-gray-500 dark:hover:text-white/50 transition-colors cursor-pointer"
               >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                     <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
               </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
               {/* Range type selector */}
               <div className="flex gap-2">
                  <button
                     type="button"
                     onClick={() => setRangeType('all')}
                     className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        rangeType === 'all'
                           ? 'bg-[#0F2552] dark:bg-[#B28309] text-white shadow-sm'
                           : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/8'
                     }`}
                  >
                     All Records
                  </button>
                  <button
                     type="button"
                     onClick={() => setRangeType('custom')}
                     className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        rangeType === 'custom'
                           ? 'bg-[#0F2552] dark:bg-[#B28309] text-white shadow-sm'
                           : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/8'
                     }`}
                  >
                     Date Range
                  </button>
               </div>

               {/* Date range inputs */}
               {rangeType === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 animate-fade-up">
                     <div>
                        <label className="block text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35 mb-1.5">
                           From
                        </label>
                        <input
                           type="date"
                           value={fromDate}
                           onChange={(e) => setFromDate(e.target.value)}
                           className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[#0F2552] dark:text-white/85 outline-none focus:border-[#B28309] focus:ring-2 focus:ring-[#B28309]/10 transition-all"
                        />
                     </div>
                     <div>
                        <label className="block text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35 mb-1.5">
                           To
                        </label>
                        <input
                           type="date"
                           value={toDate}
                           onChange={(e) => setToDate(e.target.value)}
                           className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[#0F2552] dark:text-white/85 outline-none focus:border-[#B28309] focus:ring-2 focus:ring-[#B28309]/10 transition-all"
                        />
                     </div>
                  </div>
               )}

               {/* Info text */}
               <p className="text-[0.65rem] text-gray-400 dark:text-white/30 flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
                     <circle cx="12" cy="12" r="10" />
                     <path d="M12 8h.01M12 11v5" strokeLinecap="round" />
                  </svg>
                  {rangeType === 'all'
                     ? 'This will export all records in the database as a CSV file.'
                     : 'Only records within the selected date range will be exported.'}
               </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-end gap-2">
               <ActionButton variant="outline" onClick={handleClose}>
                  Cancel
               </ActionButton>
               <ActionButton
                  variant="primary"
                  onClick={handleExport}
                  disabled={loading || (rangeType === 'custom' && !fromDate && !toDate)}
                  icon={
                     loading ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                     ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                           <polyline points="7 10 12 15 17 10" />
                           <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                     )
                  }
               >
                  {loading ? 'Exporting...' : 'Export CSV'}
               </ActionButton>
            </div>
         </div>
      </FullscreenModal>
   );
};

export default ExportModal;
