import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { pageRoutes } from './pageRoutes';
import { useRouter } from 'next/router';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import type { UnknownAction } from 'redux';
import { RootState } from '@/redux/reducers';
import Image from 'next/image';
import { RoleId, RoleIdValue } from '@/constants/roles.constant';
import { useTheme } from '@/hooks/useTheme';
import { usePermissions } from '@/hooks/usePermissions';
import { departmentActions } from '@/actions';
import { motion } from 'framer-motion';
import LetterAvatar from '@/components/LetteredAvatar';

const SIDEBAR_KEY = 'egfm-sidebar-collapsed';

/** Convert SNAKE_CASE role names to Title Case. e.g. SUPER_ADMIN → Super Admin */
const formatRoleLabel = (role: string): string => {
   if (!role) return '';
   return role
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
};

const listVariants = {
   hidden: { opacity: 0 },
   visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.08 },
   },
};

const itemVariants = {
   hidden: { opacity: 0, x: -8 },
   visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring' as const, stiffness: 180, damping: 22 },
   },
};

const logoVariants = {
   hidden: { opacity: 0, y: -8 },
   visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/** Inline chevron-right SVG */
const ChevronRight = () => (
   <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
   >
      <polyline points="9 18 15 12 9 6" />
   </svg>
);

const Sidebar = () => {
   const router = useRouter();
   const dispatch = useDispatch();
   const { userDetails } = useSelector((s: RootState) => s.user);
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);
   const { isBackOffice, isFacilityTeam } = usePermissions();
   const { theme } = useTheme();
   const isDark = theme === 'dark';

   // Sidebar is the first thing rendered for authenticated users, so it's
   // a safe place to ensure the department list is loaded — the Facility
   // gate in `filteredRoutes` below depends on it.
   useEffect(() => {
      if (!allDepartmentsList || allDepartmentsList.length === 0) {
         dispatch(
            departmentActions.getAllDepartments({ page: 1, limit: 200 }) as unknown as UnknownAction,
         );
      }
   }, [dispatch, allDepartmentsList]);

   const [collapsed, setCollapsed] = useState(() => {
      if (typeof window !== 'undefined') {
         return localStorage.getItem(SIDEBAR_KEY) === 'true';
      }
      return false;
   });

   // Portal-based tooltip for the collapsed state. Rendering via a portal to
   // <body> lets the tooltip escape the sidebar's overflow clipping, which is
   // unavoidable due to the scrolling <nav>. Position is taken from the
   // hovered element's bounding rect on mouse enter.
   const [tooltip, setTooltip] = useState<{
      label: string;
      top: number;
      left: number;
   } | null>(null);
   const [mounted, setMounted] = useState(false);
   useEffect(() => {
      setMounted(true);
   }, []);

   const showTooltip = (e: React.SyntheticEvent<HTMLElement>, label: string) => {
      if (!collapsed) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setTooltip({
         label,
         top: rect.top + rect.height / 2,
         left: rect.right + 12,
      });
   };
   const hideTooltip = () => setTooltip(null);

   useEffect(() => {
      localStorage.setItem(SIDEBAR_KEY, String(collapsed));
   }, [collapsed]);

   const activeRoute = useCallback(
      (link: string) => {
         return router?.pathname === link;
      },
      [router?.pathname],
   );

   const filteredRoutes = pageRoutes.filter((route) => {
      if (route.allowedRoles && !route.allowedRoles.includes(userDetails?.roleId as RoleIdValue)) {
         return false;
      }
      // Facility-scoped routes stay visible for Super Admin / Admin and
      // for every Member (Members see all logs regardless of department per
      // spec). HODs are gated: only the Facility HOD passes through. This
      // is what keeps Generator Logs out of e.g. the Electrical HOD's nav.
      if (route.requiresFacilityTeam) {
         const isHod = userDetails?.roleId === RoleId.HOD;
         if (isHod && !isFacilityTeam && !isBackOffice) {
            return false;
         }
      }
      return true;
   });

   const fullName =
      userDetails?.firstName || userDetails?.lastName
         ? `${userDetails?.firstName ?? ''} ${userDetails?.lastName ?? ''}`.trim()
         : null;

   const roleLabel = userDetails?.role ? formatRoleLabel(userDetails.role) : null;

   return (
      <div
         className={classNames(
            'animate-sidebar-enter relative flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out',
            isDark ? 'sidebar-dark' : '',
         )}
         style={{
            width: collapsed ? 72 : 260,
            minWidth: collapsed ? 72 : 260,
            backgroundColor: isDark ? '#0F2552' : '#ffffff',
            borderRight: isDark ? 'none' : '1px solid var(--border-default)',
            boxShadow: isDark ? 'none' : 'var(--shadow-sm)',
         }}
      >
         {/* Logo area */}
         <div className="px-4 py-5">
            <Link href="/" passHref>
               <motion.div
                  className="inline-flex items-center"
                  variants={logoVariants}
                  initial="hidden"
                  animate="visible"
               >
                  <div className="shrink-0" style={{ width: 40, height: 40 }}>
                     <Image
                        src="/assets/images/egfm-logo.png"
                        alt="egfm-logo"
                        height={40}
                        width={40}
                        unoptimized
                        className={isDark ? 'brightness-125 saturate-[0.9]' : ''}
                     />
                  </div>
                  {!collapsed && (
                     <span
                        className={classNames(
                           'ml-3 text-[16px] font-bold leading-[21px] whitespace-nowrap overflow-hidden transition-colors',
                           isDark ? 'text-white' : 'text-[#0F2552]',
                        )}
                     >
                        Logistics
                     </span>
                  )}
               </motion.div>
            </Link>
         </div>

         {/* Navigation */}
         <nav className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar px-2 pt-2">
            <motion.ul variants={listVariants} initial="hidden" animate="visible">
               {filteredRoutes?.map((pageRoute, index) => {
                  const isActive = activeRoute(pageRoute?.link);
                  const prevSection = index > 0 ? filteredRoutes[index - 1].section : undefined;
                  const showSectionHeader =
                     !!pageRoute.section && pageRoute.section !== prevSection;
                  return (
                     <React.Fragment key={pageRoute.id}>
                        {showSectionHeader && !collapsed && (
                           <motion.li
                              variants={itemVariants}
                              className={classNames(
                                 'mt-4 mb-1 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.1em]',
                                 isDark ? 'text-white/40' : 'text-[#0F2552]/40',
                              )}
                           >
                              {pageRoute.section}
                           </motion.li>
                        )}
                        {showSectionHeader && collapsed && (
                           <motion.li
                              variants={itemVariants}
                              className={classNames(
                                 'mt-3 mb-1 mx-auto h-[1px] w-6',
                                 isDark ? 'bg-white/15' : 'bg-[#0F2552]/15',
                              )}
                           />
                        )}
                        <motion.li variants={itemVariants} className="mb-1">
                           <Link
                              href={pageRoute?.link}
                              aria-label={pageRoute?.label}
                              onMouseEnter={(e) => showTooltip(e, pageRoute?.label)}
                              onMouseLeave={hideTooltip}
                              onFocus={(e) => showTooltip(e, pageRoute?.label)}
                              onBlur={hideTooltip}
                              className={classNames(
                                 'group relative flex items-center rounded-md transition-all duration-200',
                                 collapsed ? 'justify-center py-3 px-0' : 'gap-x-3 py-2.5 px-3',
                                 isActive
                                    ? isDark
                                       ? 'bg-white/10 text-[#D4A84B]'
                                       : 'bg-[#0F2552]/8 text-[#B28309]'
                                    : isDark
                                      ? 'text-white/60 hover:text-white hover:bg-white/5'
                                      : 'text-[#0F2552]/60 hover:text-[#0F2552] hover:bg-[#0F2552]/5',
                              )}
                           >
                              {/* Active indicator — gold left border */}
                              {isActive && (
                                 <span
                                    className={classNames(
                                       'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full',
                                       isDark ? 'bg-[#D4A84B]' : 'bg-[#B28309]',
                                    )}
                                    style={{ height: '60%' }}
                                 />
                              )}

                              {/* Icon with scale micro-interaction */}
                              <div
                                 className={classNames(
                                    'shrink-0 transition-transform duration-200',
                                    isActive ? 'scale-100' : 'scale-[0.9] group-hover:scale-110',
                                 )}
                              >
                                 {pageRoute?.icon}
                              </div>

                              {!collapsed && (
                                 <span className="capitalize text-[0.8rem] font-medium whitespace-nowrap overflow-hidden flex-1">
                                    {pageRoute?.label}
                                 </span>
                              )}

                              {/* Chevron — visible on hover, only when expanded & not active */}
                              {!collapsed && !isActive && (
                                 <span
                                    className={classNames(
                                       'ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                                       isDark ? 'text-white/40' : 'text-[#0F2552]/30',
                                    )}
                                 >
                                    <ChevronRight />
                                 </span>
                              )}

                              {/* Collapsed-state tooltip is portal-rendered to body */}
                           </Link>
                        </motion.li>
                     </React.Fragment>
                  );
               })}
            </motion.ul>
         </nav>

         {/* User profile block */}
         {fullName && (
            <motion.div
               variants={itemVariants}
               initial="hidden"
               animate="visible"
               className={classNames(
                  'px-3 py-3',
                  isDark
                     ? 'border-t border-white/10'
                     : 'border-t border-[var(--border-default,#e5e7eb)]',
               )}
            >
               {collapsed ? (
                  /* Collapsed: just avatar centered with tooltip */
                  <div className="relative group flex justify-center">
                     <LetterAvatar name={fullName} size={36} />
                     <span className="sidebar-tooltip">
                        {fullName}
                        {roleLabel && ` · ${roleLabel}`}
                     </span>
                  </div>
               ) : (
                  /* Expanded: avatar + name + role */
                  <div className="flex items-center gap-x-3 min-w-0">
                     <div className="shrink-0">
                        <LetterAvatar name={fullName} size={36} />
                     </div>
                     <div className="flex flex-col min-w-0">
                        <span
                           className={classNames(
                              'text-sm font-semibold truncate leading-tight',
                              isDark ? 'text-white' : 'text-[var(--text-primary,#0F2552)]',
                           )}
                        >
                           {fullName}
                        </span>
                        {roleLabel && (
                           <span
                              className={classNames(
                                 'text-xs truncate leading-tight mt-0.5',
                                 isDark ? 'text-white/40' : 'text-[var(--text-hint,#6b7280)]',
                              )}
                           >
                              {roleLabel}
                           </span>
                        )}
                     </div>
                  </div>
               )}
            </motion.div>
         )}

         {/* Collapse toggle at bottom */}
         <div
            className="p-3"
            style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border-default)' }}
         >
            <button
               onClick={() => setCollapsed((prev) => !prev)}
               className={classNames(
                  'w-full flex items-center justify-center py-2 rounded-md transition-all duration-200 cursor-pointer',
                  isDark
                     ? 'text-white/40 hover:text-white/70 hover:bg-white/5'
                     : 'text-[#0F2552]/30 hover:text-[#0F2552]/60 hover:bg-[#0F2552]/5',
               )}
               aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
               <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={classNames('transition-transform duration-300', collapsed ? 'rotate-180' : '')}
               >
                  <polyline points="15 18 9 12 15 6" />
               </svg>
            </button>
         </div>

         {/* Portal-rendered tooltip — visible only when the sidebar is
             collapsed and an item is hovered/focused. Rendered to <body>
             so the sidebar's overflow clipping doesn't hide it. */}
         {mounted && collapsed && tooltip &&
            createPortal(
               <div
                  role="tooltip"
                  style={{
                     position: 'fixed',
                     top: tooltip.top,
                     left: tooltip.left,
                     transform: 'translateY(-50%)',
                     background: '#1a1a2e',
                     color: '#fff',
                     fontSize: '0.75rem',
                     fontWeight: 500,
                     padding: '6px 10px',
                     borderRadius: 6,
                     whiteSpace: 'nowrap',
                     textTransform: 'capitalize',
                     zIndex: 9999,
                     pointerEvents: 'none',
                     boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
               >
                  <span
                     aria-hidden="true"
                     style={{
                        position: 'absolute',
                        right: '100%',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        border: '5px solid transparent',
                        borderRightColor: '#1a1a2e',
                     }}
                  />
                  {tooltip.label}
               </div>,
               document.body,
            )}
      </div>
   );
};

export default Sidebar;
