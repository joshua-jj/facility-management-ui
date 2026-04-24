import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// ── Breadcrumb mapping ──

const ROUTE_LABELS: Record<string, string> = {
   admin: 'Admin',
   dashboard: 'Dashboard',
   requests: 'Requests',
   request: 'Request',
   items: 'Items',
   item: 'Item',
   store: 'Stores',
   departments: 'Departments',
   meetings: 'Meetings',
   'meeting-locations': 'Meeting Locations',
   'maintenance-log': 'Maintenance Logs',
   'generator-log': 'Generator Logs',
   'incidence-log': 'Incidence Log',
   reports: 'Complaints',
   users: 'User Management',
   settings: 'Settings',
};

interface Crumb {
   label: string;
   href: string;
   clickable: boolean;
}

function buildBreadcrumbs(pathname: string): Crumb[] {
   const segments = pathname.split('/').filter(Boolean);
   const crumbs: Crumb[] = [];

   let path = '';
   for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      path += `/${seg}`;

      const isDynamicId = seg.startsWith('[') || /^\d+$/.test(seg);
      if (isDynamicId) {
         // Inject a non-clickable "Details" step so the breadcrumb reads
         // Admin > <Section> > Details > #<id>. This marks the current view
         // as a detail page without requiring each page to pass it manually.
         const parentPath = path.slice(0, path.lastIndexOf('/')) || '/';
         crumbs.push({ label: 'Details', href: parentPath, clickable: false });
         crumbs.push({
            label: `#${seg.replace(/[[\]]/g, '')}`,
            href: path,
            clickable: true,
         });
         continue;
      }

      const label =
         ROUTE_LABELS[seg] ??
         seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
      crumbs.push({ label, href: path, clickable: true });
   }

   return crumbs;
}

// ── Breadcrumbs Component ──

const Breadcrumbs: React.FC = () => {
   const router = useRouter();
   const crumbs = buildBreadcrumbs(router.pathname);

   // Replace dynamic [id] with actual value
   const actualCrumbs = crumbs.map((crumb) => {
      let href = crumb.href;
      let label = crumb.label;

      if (router.query.id && href.includes('[id]')) {
         href = href.replace('[id]', String(router.query.id));
         label = `#${router.query.id}`;
      }

      return { ...crumb, href, label };
   });

   if (actualCrumbs.length <= 1) return null;

   return (
      <nav aria-label="Breadcrumb" className="mb-2">
         <ol className="flex items-center gap-1.5 text-xs">
            {actualCrumbs.map((crumb, i) => {
               const isLast = i === actualCrumbs.length - 1;
               return (
                  <li key={`${crumb.href}-${i}`} className="flex items-center gap-1.5">
                     {i > 0 && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-300 dark:text-white/15">
                           <polyline points="9 18 15 12 9 6" />
                        </svg>
                     )}
                     {isLast || !crumb.clickable ? (
                        <span
                           className={
                              isLast
                                 ? 'font-medium text-[#0F2552] dark:text-white/70'
                                 : 'text-gray-400 dark:text-white/35'
                           }
                        >
                           {crumb.label}
                        </span>
                     ) : (
                        <Link
                           href={crumb.href}
                           className="text-gray-400 dark:text-white/35 hover:text-[#B28309] dark:hover:text-[#D4A84B] transition-colors"
                        >
                           {crumb.label}
                        </Link>
                     )}
                  </li>
               );
            })}
         </ol>
      </nav>
   );
};

// ── PageHeader ──

interface PageHeaderProps {
   title?: string;
   subtitle?: string;
   action?: React.ReactNode;
   className?: string;
   showBreadcrumbs?: boolean;
}

/**
 * Detail pages use breadcrumbs + action only (no title/subtitle), so this
 * component lays out the header in two rows: breadcrumb + action on the top
 * row, then an optional title/subtitle row beneath. When no title is passed
 * (typical for detail pages), only the breadcrumb/action row is rendered.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
   title,
   subtitle,
   action,
   className = '',
   showBreadcrumbs = true,
}) => {
   return (
      <div className={`mb-6 ${className}`}>
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
               {showBreadcrumbs && <Breadcrumbs />}
               {title && (
                  <h1 className="text-lg font-bold text-[#0F2552] dark:text-white/90 capitalize">
                     {title}
                  </h1>
               )}
               {subtitle && (
                  <p
                     className={`text-xs text-gray-400 dark:text-white/40 ${
                        title ? 'mt-0.5' : 'mt-1'
                     }`}
                  >
                     {subtitle}
                  </p>
               )}
            </div>
            {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
         </div>
      </div>
   );
};

// ── ActionButton ──

export const ActionButton: React.FC<{
   children: React.ReactNode;
   onClick?: () => void;
   variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
   size?: 'sm' | 'md';
   icon?: React.ReactNode;
   disabled?: boolean;
   className?: string;
}> = ({ children, onClick, variant = 'primary', size = 'sm', icon, disabled, className = '' }) => {
   const base = 'inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
   const sizeClass = size === 'sm' ? 'text-xs px-3 py-2' : 'text-sm px-4 py-2.5';

   const variants: Record<string, string> = {
      primary: 'bg-[#B28309] text-white hover:bg-[#9a7208] shadow-sm hover:shadow-md',
      secondary: 'bg-[#0F2552] text-white hover:bg-[#0a1a3d] dark:bg-white/10 dark:hover:bg-white/15 shadow-sm',
      outline: 'border border-gray-200 dark:border-white/10 text-[#0F2552] dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5',
      ghost: 'text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/5',
   };

   return (
      <button onClick={onClick} disabled={disabled} className={`${base} ${sizeClass} ${variants[variant]} ${className}`}>
         {icon}
         {children}
      </button>
   );
};

export default PageHeader;
