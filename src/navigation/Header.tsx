import { authActions } from '@/actions';
import { BellIcon, BurgerMenuIcon, CaretIcon } from '@/components/Icons';
import LetteredAvatar from '@/components/LetteredAvatar';
import AddDepartment from '@/components/Modals/AddDepartment';
import AddItem from '@/components/Modals/AddItem';
import AddStore from '@/components/Modals/AddStore';
import { RootState } from '@/redux/reducers';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';

import EgfmLogo from '../../public/assets/logos/logo.svg';
import Link from 'next/link';
import Report from '@/components/Modals/Report';
import { useIsAuthRoute } from '@/hooks';

import AddMaintenanceLog from '@/components/Modals/AddMaintenanceLog';
import AddGeneratorLog from '@/components/Modals/AddGeneratorLog';
import { ADMIN_ROLES, RoleIdValue } from '@/constants/roles.constant';
import ThemeToggle from '@/components/ThemeToggle';
import { motion } from 'framer-motion';

const Header = () => {
   const router = useRouter();
   const pathname = router.pathname;
   const dispatch = useDispatch();
   const authRoutes = useIsAuthRoute();
   const { userDetails } = useSelector((s: RootState) => s.user);
   const [profileDropdown, setProfileDropdown] = useState(false);
   const [dropdown, setDropdown] = useState(false);
   const [bellDropdown, setBellDropdown] = useState(false);

   const dropdownRef = useRef<HTMLDivElement>(null);
   const profileRef = useRef<HTMLDivElement>(null);
   const bellRef = useRef<HTMLDivElement>(null);

   const handleLogout = () => {
      router.push('/login');
      dispatch(authActions.logout() as unknown as UnknownAction);
   };

   const isAdminRole = ADMIN_ROLES.includes(userDetails?.roleId as RoleIdValue);

   // Close dropdowns on outside click
   useEffect(() => {
      const handleMouseDown = (e: MouseEvent) => {
         if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
            setDropdown(false);
         }
         if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
            setProfileDropdown(false);
         }
         if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
            setBellDropdown(false);
         }
      };
      document.addEventListener('mousedown', handleMouseDown);
      return () => document.removeEventListener('mousedown', handleMouseDown);
   }, []);

   return (
      <>
         {authRoutes || pathname.startsWith('/request') ? (
            <header className="md:px-[35px] px-[10px] h-[4.5rem] border border-[#e1e3e7] dark:border-white/10 bg-white dark:bg-[#1a1a2e] shadow-[0_16px_32px_0_rgba(189,189,189,0.25)] dark:shadow-none cursor-pointer relative transition-colors duration-300">
               <div className="md:container mx-auto flex items-center justify-between h-full ">
                  <Link href="/" passHref className="flex items-center">
                     <EgfmLogo />
                     <span className="ml-2 hidden md:block text-[#32323d] dark:text-white/90 text-[20px] font-bold leading-[21px] text-left transition-colors">
                        Logistics
                     </span>
                  </Link>
                  <div className="flex items-center gap-x-3">
                     {(router.pathname === '/' ||
                        router.pathname === '/landing' ||
                        pathname.startsWith('/request')) && (
                        <Report className="bg-[#b28309] text-white cursor-pointer rounded-[3px] py-3 px-4 md:text-[13px] text-[11px] font-semibold mx-2 transition duration-300">
                           Report an Issue
                        </Report>
                     )}
                     <ThemeToggle />
                  </div>
               </div>
            </header>
         ) : (
            <motion.header
               initial={{ y: -8, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ duration: 0.25, ease: 'easeOut' }}
               className="h-16 md:h-[4.5rem] sticky top-0 z-[5001] px-4 md:px-8 border-b border-[var(--border-default)] bg-[var(--surface-paper)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-colors duration-300"
            >
               <div className="flex items-center justify-end h-full w-full">
                  {/* Right: actions */}
                  <div className="flex items-center gap-3">
                     {/* Add Item dropdown — desktop */}
                     {isAdminRole && (
                        <div className="relative inline-block" ref={dropdownRef}>
                           <button
                              onClick={() => setDropdown((prev) => !prev)}
                              aria-expanded={dropdown}
                              aria-haspopup="true"
                              className="hidden md:flex items-center gap-x-2 px-4 py-2 text-xs font-semibold text-white bg-[#B28309] hover:bg-[#9a7008] active:scale-95 transition-all rounded-lg cursor-pointer press-effect"
                           >
                              Add Item
                              <CaretIcon className="rotate-90 opacity-80" />
                           </button>

                           {/* Mobile burger: opens same add-item menu */}
                           <button
                              onClick={() => setDropdown((prev) => !prev)}
                              aria-expanded={dropdown}
                              aria-haspopup="true"
                              className="flex md:hidden items-center justify-center h-9 w-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-paper)] hover:bg-[var(--surface-low)] transition-colors cursor-pointer"
                           >
                              <BurgerMenuIcon className="text-[var(--text-primary)]" />
                           </button>

                           {dropdown && (
                              <ul
                                 role="menu"
                                 className="absolute right-0 mt-1 p-1 min-w-[11rem] bg-[var(--surface-paper)] shadow-[var(--shadow-sm)] border border-[var(--border-default)] rounded-lg animate-dropdown-enter z-10"
                              >
                                 <li role="menuitem" className="hover:bg-[var(--surface-low)] transition rounded-md text-xs text-[var(--text-primary)]">
                                    <AddItem className="text-start w-full px-3 py-2 capitalize cursor-pointer">
                                       add item
                                    </AddItem>
                                 </li>
                                 {isAdminRole && (
                                    <li role="menuitem" className="hover:bg-[var(--surface-low)] transition rounded-md text-xs text-[var(--text-primary)]">
                                       <AddStore className="text-start w-full px-3 py-2 capitalize cursor-pointer">
                                          create store
                                       </AddStore>
                                    </li>
                                 )}
                                 {isAdminRole && (
                                    <li role="menuitem" className="hover:bg-[var(--surface-low)] transition rounded-md text-xs text-[var(--text-primary)]">
                                       <AddDepartment className="text-start w-full px-3 py-2 capitalize cursor-pointer">
                                          create department
                                       </AddDepartment>
                                    </li>
                                 )}
                                 {isAdminRole && (
                                    <li role="menuitem" className="hover:bg-[var(--surface-low)] transition rounded-md text-xs text-[var(--text-primary)]">
                                       <AddMaintenanceLog className="text-start w-full px-3 py-2 capitalize cursor-pointer">
                                          maintenance log
                                       </AddMaintenanceLog>
                                    </li>
                                 )}
                                 {isAdminRole && (
                                    <li role="menuitem" className="hover:bg-[var(--surface-low)] transition rounded-md text-xs text-[var(--text-primary)]">
                                       <AddGeneratorLog className="text-start w-full px-3 py-2 capitalize cursor-pointer">
                                          generator log
                                       </AddGeneratorLog>
                                    </li>
                                 )}
                              </ul>
                           )}
                        </div>
                     )}

                     {/* Notification bell */}
                     <div className="relative" ref={bellRef}>
                        <button
                           onClick={() => setBellDropdown((prev) => !prev)}
                           className="relative flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-paper)] hover:bg-[var(--surface-low)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                           aria-label="Notifications"
                        >
                           <BellIcon />
                           {/* Red dot indicator */}
                           <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full" />
                        </button>

                        {bellDropdown && (
                           <div
                              role="menu"
                              className="absolute right-0 mt-1 w-72 bg-[var(--surface-paper)] shadow-[var(--shadow-sm)] border border-[var(--border-default)] rounded-lg animate-dropdown-enter z-10 overflow-hidden"
                           >
                              <div className="px-4 py-3 border-b border-[var(--border-default)]">
                                 <span className="text-sm font-semibold text-[var(--text-primary)]">Notifications</span>
                              </div>
                              <div className="flex items-center justify-center py-6">
                                 <span className="text-xs text-[var(--text-hint)]">No new notifications</span>
                              </div>
                              <div className="px-4 py-2 border-t border-[var(--border-default)]">
                                 <span className="text-xs text-[var(--text-hint)] cursor-not-allowed select-none">View all</span>
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Theme toggle */}
                     <ThemeToggle className="h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--border-default)] !bg-[var(--surface-paper)] hover:!bg-[var(--surface-low)] !text-[var(--text-secondary)] !p-0" />

                     {/* Avatar / profile dropdown */}
                     <div className="relative" ref={profileRef}>
                        <button
                           onClick={() => setProfileDropdown((prev) => !prev)}
                           className="flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-paper)] hover:bg-[var(--surface-low)] transition-colors cursor-pointer overflow-hidden"
                           aria-label="Profile menu"
                        >
                           <LetteredAvatar
                              name={userDetails?.firstName}
                              size={34}
                              className="cursor-pointer"
                           />
                        </button>

                        {profileDropdown && (
                           <ul
                              role="menu"
                              className="absolute right-0 mt-1 p-1 min-w-[10rem] bg-[var(--surface-paper)] shadow-[var(--shadow-sm)] border border-[var(--border-default)] rounded-lg animate-dropdown-enter z-10"
                           >
                              <li
                                 role="menuitem"
                                 onClick={() => {
                                    setProfileDropdown(false);
                                    router.push('/admin/account-settings');
                                 }}
                                 className="hover:bg-[var(--surface-low)] transition rounded-md text-xs text-[var(--text-primary)] px-3 py-2 cursor-pointer"
                              >
                                 Account Settings
                              </li>
                              <li
                                 role="menuitem"
                                 onClick={handleLogout}
                                 className="hover:bg-[var(--surface-low)] transition rounded-md text-xs text-[var(--text-primary)] px-3 py-2 capitalize cursor-pointer"
                              >
                                 Logout
                              </li>
                           </ul>
                        )}
                     </div>
                  </div>
               </div>
            </motion.header>
         )}
      </>
   );
};

export default Header;
