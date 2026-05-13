import { authActions } from '@/actions';
import { NotificationBell } from '@/components/NotificationBell';
import LetteredAvatar from '@/components/LetteredAvatar';
import { RootState } from '@/redux/reducers';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';

import { useTheme } from '@/hooks/useTheme';

type AdminTopBarProps = {
   onMobileMenuToggle?: () => void;
};

const AdminTopBar = ({ onMobileMenuToggle }: AdminTopBarProps) => {
   const router = useRouter();
   const dispatch = useDispatch();
   const { userDetails } = useSelector((s: RootState) => s.user);
   const { theme, toggleTheme, mounted } = useTheme();
   const isDark = theme === 'dark';
   const [profileDropdown, setProfileDropdown] = useState(false);

   const profileRef = useRef<HTMLDivElement>(null);

   const handleLogout = () => {
      router.push('/login');
      dispatch(authActions.logout() as unknown as UnknownAction);
   };

   // Close dropdowns on outside click
   useEffect(() => {
      const handleMouseDown = (e: MouseEvent) => {
         if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
            setProfileDropdown(false);
         }
      };
      document.addEventListener('mousedown', handleMouseDown);
      return () => document.removeEventListener('mousedown', handleMouseDown);
   }, []);

   return (
      <div role="toolbar" aria-label="Admin actions" className="flex items-center w-full mb-4 md:mb-6">
         {/* Hamburger — mobile only */}
         <button
            onClick={onMobileMenuToggle}
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-paper)] hover:bg-[var(--surface-low)] transition-colors cursor-pointer"
            aria-label="Open navigation menu"
         >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <line x1="3" y1="6" x2="21" y2="6" />
               <line x1="3" y1="12" x2="21" y2="12" />
               <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
         </button>

         {/* Right: actions */}
         <div className="ml-auto flex items-center gap-3">
            {/* Notification bell */}
            <NotificationBell />

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
                     className="absolute right-0 mt-1 p-1 min-w-[12rem] bg-[var(--surface-paper)] shadow-[var(--shadow-sm)] border border-[var(--border-default)] rounded-lg animate-dropdown-enter z-10"
                  >
                     <li
                        role="menuitem"
                        onClick={() => {
                           setProfileDropdown(false);
                           router.push('/admin/settings/profile');
                        }}
                        className="hover:bg-[var(--surface-low)] transition rounded-md text-xs text-[var(--text-primary)] px-3 py-2 cursor-pointer flex items-center gap-2"
                     >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                           <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                           <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Account Settings
                     </li>
                     {mounted && (
                        <li
                           role="menuitem"
                           onClick={() => {
                              toggleTheme();
                              setProfileDropdown(false);
                           }}
                           className="hover:bg-[var(--surface-low)] transition rounded-md text-xs text-[var(--text-primary)] px-3 py-2 cursor-pointer flex items-center gap-2"
                        >
                           {isDark ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                                 <circle cx="12" cy="12" r="5" />
                                 <line x1="12" y1="1" x2="12" y2="3" />
                                 <line x1="12" y1="21" x2="12" y2="23" />
                                 <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                 <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                 <line x1="1" y1="12" x2="3" y2="12" />
                                 <line x1="21" y1="12" x2="23" y2="12" />
                                 <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                 <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                              </svg>
                           ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                                 <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                              </svg>
                           )}
                           {isDark ? 'Light Mode' : 'Dark Mode'}
                        </li>
                     )}
                     <li
                        role="menuitem"
                        onClick={handleLogout}
                        className="hover:bg-[var(--surface-low)] transition rounded-md text-xs text-[var(--text-primary)] px-3 py-2 capitalize cursor-pointer flex items-center gap-2"
                     >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                           <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                           <polyline points="16 17 21 12 16 7"/>
                           <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Logout
                     </li>
                  </ul>
               )}
            </div>
         </div>
      </div>
   );
};

export default AdminTopBar;
