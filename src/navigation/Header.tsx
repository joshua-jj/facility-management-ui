import { authActions } from '@/actions';
import { BurgerMenuIcon, CaretIcon } from '@/components/Icons';
import LetteredAvatar from '@/components/LetteredAvatar';
import AddDepartment from '@/components/Modals/AddDepartment';
import AddItem from '@/components/Modals/AddItem';
import AddStore from '@/components/Modals/AddStore';
import { RootState } from '@/redux/reducers';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
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

const Header = () => {
  const router = useRouter();
  const pathname = router.pathname;
  const dispatch = useDispatch();
  const authRoutes = useIsAuthRoute();
  const { userDetails } = useSelector((s: RootState) => s.user);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [dropdown, setDropdown] = useState(false);

  const handleLogout = () => {
    router.push('/login');
    dispatch(authActions.logout() as unknown as UnknownAction);
  };

  const isAdminRole = ADMIN_ROLES.includes(userDetails?.roleId as RoleIdValue);

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
        <header className="animate-header-enter bg-white dark:bg-[#1a1a2e] h-[3.8rem] md:h-[4.8rem] sticky top-0 z-[5001] px-4 md:px-8 py-3 md:py-4 border-l-[0.5px] border-[#E1E3E7] dark:border-white/10 text-[#0F2552] dark:text-white/90 shadow-[0px_16px_32px_0px_rgba(189,189,189,0.25)] dark:shadow-none transition-colors duration-300">
          <div className="md:container mx-auto flex items-center justify-end">
            <div className="flex items-center gap-x-3 md:gap-x-6">
              <div className="relative inline-block">
                <button
                  onClick={() => setDropdown((prev) => !prev)}
                  aria-expanded={dropdown}
                  aria-haspopup="true"
                  className="hidden md:flex items-center text-xs gap-x-2 px-3 py-3 text-white bg-[#B28309] hover:bg-[#B2830998] transition rounded cursor-pointer capitalize press-effect"
                >
                  add item
                  <CaretIcon className="rotate-90" />
                </button>
                <button
                  onClick={() => setDropdown((prev) => !prev)}
                  aria-expanded={dropdown}
                  aria-haspopup="true"
                  className="flex md:hidden items-center text-xs px-1 py-1 text-white border-[#B28309] hover:bg-[#B2830998] transition rounded cursor-pointer capitalize"
                >
                  <BurgerMenuIcon className="text-[#0F2552] dark:text-white" />
                </button>
                {dropdown && (
                  <ul
                    role="menu"
                    className="absolute right-0 mt-[0.1rem] p-1 min-w-[10rem] bg-white dark:bg-[#1a1a2e] shadow-[16px_0px_32px_0px_rgba(150,150,150,0.15)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] border-[0.5px] border-[rgba(15,37,82,0.15)] dark:border-white/10 rounded animate-dropdown-enter"
                  >
                    <li role="menuitem" className="bg-transparent hover:bg-[#E5E8EC] dark:hover:bg-white/10 transition rounded text-xs">
                      <AddItem className="text-start w-full px-3 py-[0.4rem] capitalize cursor-pointer">
                        add item
                      </AddItem>
                    </li>
                    {isAdminRole && (
                      <li role="menuitem" className="bg-transparent hover:bg-[#E5E8EC] dark:hover:bg-white/10 transition rounded text-xs">
                        <AddStore className="text-start w-full px-3 py-[0.4rem] capitalize cursor-pointer">
                          create store
                        </AddStore>
                      </li>
                    )}
                    {isAdminRole && (
                      <li role="menuitem" className="bg-transparent hover:bg-[#E5E8EC] dark:hover:bg-white/10 transition rounded text-xs">
                        <AddDepartment className="text-start w-full px-3 py-[0.4rem] capitalize cursor-pointer">
                          create department
                        </AddDepartment>
                      </li>
                    )}
                    {isAdminRole && (
                      <li role="menuitem" className="bg-transparent hover:bg-[#E5E8EC] dark:hover:bg-white/10 transition rounded text-xs">
                        <AddMaintenanceLog className="text-start w-full px-3 py-[0.4rem] capitalize cursor-pointer">
                          maintenance log
                        </AddMaintenanceLog>
                      </li>
                    )}
                    {isAdminRole && (
                      <li role="menuitem" className="bg-transparent hover:bg-[#E5E8EC] dark:hover:bg-white/10 transition rounded text-xs">
                        <AddGeneratorLog className="text-start w-full px-3 py-[0.4rem] capitalize cursor-pointer">
                          generator log
                        </AddGeneratorLog>
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <ThemeToggle />
              <div className="relative">
                <div
                  onClick={() => setProfileDropdown((prev) => !prev)}
                >
                  <LetteredAvatar
                    name={userDetails?.firstName}
                    size={34}
                    className="cursor-pointer"
                  />
                </div>
                {profileDropdown && (
                  <ul
                    role="menu"
                    className="absolute right-0 mt-[0.1rem] p-1 min-w-[9rem] bg-white dark:bg-[#1a1a2e] shadow-[16px_0px_32px_0px_rgba(150,150,150,0.15)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] border-[0.5px] border-[rgba(15,37,82,0.15)] dark:border-white/10 rounded animate-dropdown-enter"
                  >
                    <li
                      role="menuitem"
                      onClick={() => {
                        setProfileDropdown(false);
                        router.push('/admin/account-settings');
                      }}
                      className="bg-transparent hover:bg-[#E5E8EC] dark:hover:bg-white/10 transition rounded text-xs px-3 py-[0.4rem] cursor-pointer"
                    >
                      Account Settings
                    </li>
                    <li
                      role="menuitem"
                      onClick={handleLogout}
                      className="bg-transparent hover:bg-[#E5E8EC] dark:hover:bg-white/10 transition rounded text-xs px-3 py-[0.4rem] capitalize cursor-pointer"
                    >
                      Logout
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </header>
      )}
    </>
  );
};

export default Header;
