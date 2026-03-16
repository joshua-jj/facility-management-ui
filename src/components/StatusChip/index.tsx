import React from 'react';

type StatusVariant = 'success' | 'error' | 'warning' | 'info' | 'default' | 'primary';

interface StatusChipProps {
   status: string;
   size?: 'sm' | 'md';
   pulse?: boolean;
   className?: string;
}

const STATUS_MAP: Record<string, { variant: StatusVariant; label?: string }> = {
   // Entity status
   active: { variant: 'success', label: 'Active' },
   inactive: { variant: 'default', label: 'Inactive' },
   deleted: { variant: 'error', label: 'Deleted' },
   a: { variant: 'success', label: 'Active' },
   i: { variant: 'default', label: 'Inactive' },
   d: { variant: 'error', label: 'Deleted' },

   // Request status
   pending: { variant: 'warning' },
   approved: { variant: 'success' },
   declined: { variant: 'error' },
   assigned: { variant: 'info' },
   collected: { variant: 'primary' },
   completed: { variant: 'success' },
   cancelled: { variant: 'error' },
   expired: { variant: 'error' },
   submitted: { variant: 'info' },
   'not assigned': { variant: 'warning', label: 'Not Assigned' },
   'no status': { variant: 'default', label: 'No Status' },

   // Complaint status
   'in progress': { variant: 'info', label: 'In Progress' },
   resolved: { variant: 'success' },
   closed: { variant: 'default' },

   // Schedule status
   'Pending': { variant: 'warning' },
   'Completed': { variant: 'success' },
   'Cancelled': { variant: 'error' },

   // Condition
   good: { variant: 'success' },
   bad: { variant: 'error' },
   'not specified': { variant: 'default', label: 'Not Specified' },

   // Boolean-like
   true: { variant: 'success', label: 'Yes' },
   false: { variant: 'default', label: 'No' },
   yes: { variant: 'success' },
   no: { variant: 'default' },
   verified: { variant: 'success' },
   unverified: { variant: 'warning' },
};

const VARIANT_STYLES: Record<StatusVariant, string> = {
   success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
   error: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
   warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
   info: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
   primary: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
   default: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/50',
};

const PULSE_COLORS: Record<StatusVariant, string> = {
   success: 'bg-emerald-500',
   error: 'bg-red-500',
   warning: 'bg-amber-500',
   info: 'bg-blue-500',
   primary: 'bg-indigo-500',
   default: 'bg-gray-400',
};

const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'sm', pulse = false, className = '' }) => {
   const key = String(status ?? '').toLowerCase().trim();
   const mapped = STATUS_MAP[key] ?? { variant: 'default' as StatusVariant };
   const label = mapped.label ?? (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown');
   const styles = VARIANT_STYLES[mapped.variant];
   const pulseColor = PULSE_COLORS[mapped.variant];

   const sizeClass = size === 'sm' ? 'text-[0.65rem] px-2 py-0.5' : 'text-xs px-2.5 py-1';

   return (
      <span
         className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide whitespace-nowrap transition-colors ${styles} ${sizeClass} ${className}`}
      >
         {pulse && (
            <span className="relative flex h-1.5 w-1.5">
               <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`} />
               <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pulseColor}`} />
            </span>
         )}
         {label}
      </span>
   );
};

export default StatusChip;
