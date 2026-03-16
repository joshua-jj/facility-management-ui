import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { pageRoutes } from './pageRoutes';
import { useRouter } from 'next/router';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import Image from 'next/image';
import { RoleIdValue } from '@/constants/roles.constant';
import { useTheme } from '@/hooks/useTheme';

const SIDEBAR_KEY = 'egfm-sidebar-collapsed';

const Sidebar = () => {
   const router = useRouter();
   const { userDetails } = useSelector((s: RootState) => s.user);
   const { theme } = useTheme();
   const isDark = theme === 'dark';

   const [collapsed, setCollapsed] = useState(() => {
      if (typeof window !== 'undefined') {
         return localStorage.getItem(SIDEBAR_KEY) === 'true';
      }
      return false;
   });

   useEffect(() => {
      localStorage.setItem(SIDEBAR_KEY, String(collapsed));
   }, [collapsed]);

   const activeRoute = useCallback(
      (link: string) => {
         return router?.pathname === link;
      },
      [router?.pathname],
   );

   const filteredRoutes = pageRoutes.filter((route) =>
      route.allowedRoles ? route.allowedRoles.includes(userDetails?.roleId as RoleIdValue) : true,
   );

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
               <div className="inline-flex items-center animate-fade-in-scale">
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
               </div>
            </Link>
         </div>

         {/* Navigation */}
         <nav className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar px-2 pt-2">
            <ul>
               {filteredRoutes?.map((pageRoute, index) => {
                  const isActive = activeRoute(pageRoute?.link);
                  return (
                     <li
                        key={pageRoute.id}
                        className="animate-nav-item mb-1"
                        style={{ animationDelay: `${0.05 + index * 0.04}s` }}
                     >
                        <Link
                           href={pageRoute?.link}
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

                           <div
                              className={classNames(
                                 'shrink-0 transition-transform duration-200',
                                 isActive ? 'scale-100' : 'scale-[0.9] group-hover:scale-100',
                              )}
                           >
                              {pageRoute?.icon}
                           </div>

                           {!collapsed && (
                              <span className="capitalize text-[0.8rem] font-medium whitespace-nowrap overflow-hidden">
                                 {pageRoute?.label}
                              </span>
                           )}

                           {/* Tooltip for collapsed mode */}
                           {collapsed && (
                              <span className="sidebar-tooltip">{pageRoute?.label}</span>
                           )}
                        </Link>
                     </li>
                  );
               })}
            </ul>
         </nav>

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
      </div>
   );
};

export default Sidebar;
