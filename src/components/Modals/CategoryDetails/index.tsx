import React from 'react';
import { format, parseISO } from 'date-fns';
import ModalWrapper from '../ModalWrapper';
import StatusChip from '@/components/StatusChip';
import { Category } from '@/types';

interface CategoryDetailsProps {
   open: boolean;
   category: Category | null;
   onClose: () => void;
}

const formatDateTime = (value?: string): string => {
   if (!value) return '—';
   try {
      return format(parseISO(value), 'MMM d, yyyy • h:mm a');
   } catch {
      return '—';
   }
};

const CategoryDetails: React.FC<CategoryDetailsProps> = ({ open, category, onClose }) => {
   if (!open || !category) return null;

   return (
      <ModalWrapper
         open={open}
         onClose={onClose}
         title="Category Details"
         subtitle="Read-only summary of this category"
         width="sm:w-[34rem]"
      >
         {/* ── Name + badges row ── */}
         <div className="flex items-start gap-3 mb-5">
            <div className="flex-1 min-w-0">
               <h3
                  className="text-base font-semibold leading-tight truncate"
                  style={{ color: 'var(--text-primary)' }}
               >
                  {category.name}
               </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
               <StatusChip status={category.status === 'I' ? 'inactive' : 'active'} size="sm" />
               {category.isSystem && (
                  <span
                     className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold"
                     style={{
                        background: 'color-mix(in srgb, var(--color-secondary) 12%, transparent)',
                        color: 'var(--color-secondary)',
                        border: '1px solid color-mix(in srgb, var(--color-secondary) 30%, transparent)',
                     }}
                  >
                     System
                  </span>
               )}
            </div>
         </div>

         {/* ── Description ── */}
         <div
            className="rounded-lg p-3 mb-5 text-sm"
            style={{
               background: 'var(--surface-medium)',
               border: '1px solid var(--border-default)',
               color: category.description ? 'var(--text-primary)' : 'var(--text-hint)',
            }}
         >
            {category.description || 'No description provided.'}
         </div>

         {/* ── Metadata grid ── */}
         <div
            className="rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--border-default)' }}
         >
            <div
               className="px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-wider"
               style={{
                  background: 'var(--surface-medium)',
                  borderBottom: '1px solid var(--border-default)',
                  color: 'var(--text-hint)',
               }}
            >
               Audit Information
            </div>

            <dl className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
               <MetaRow label="Created By" value={category.createdBy || '—'} />
               <MetaRow label="Created At" value={formatDateTime(category.createdAt)} />
               <MetaRow label="Modified By" value={category.updatedBy || '—'} />
               <MetaRow label="Modified At" value={formatDateTime(category.updatedAt)} />
            </dl>
         </div>

         {/* ── Close footer ── */}
         <div className="flex justify-end pt-4 mt-1" style={{ borderTop: '1px solid var(--border-default)' }}>
            <button
               type="button"
               onClick={onClose}
               className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
               style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
            >
               Close
            </button>
         </div>
      </ModalWrapper>
   );
};

interface MetaRowProps {
   label: string;
   value: string;
}

const MetaRow: React.FC<MetaRowProps> = ({ label, value }) => (
   <div
      className="grid grid-cols-2 gap-3 px-4 py-2.5"
      style={{ borderColor: 'var(--border-default)' }}
   >
      <dt className="text-xs font-medium" style={{ color: 'var(--text-hint)' }}>
         {label}
      </dt>
      <dd className="text-xs font-medium text-right" style={{ color: 'var(--text-primary)' }}>
         {value}
      </dd>
   </div>
);

export default CategoryDetails;
