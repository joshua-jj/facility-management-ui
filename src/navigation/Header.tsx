import { appActions, authActions } from '@/actions';
import { CaretIcon } from '@/components/Icons';
import LetteredAvatar from '@/components/LetteredAvatar';
import AddDepartment from '@/components/Modals/AddDepartment';
import AddItem from '@/components/Modals/AddItem';
import AddStore from '@/components/Modals/AddStore';
import { RootState } from '@/redux/reducers';
import { useRouter } from 'next/router';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';

import EgfmLogo from '../../public/assets/logos/logo.svg';
import Link from 'next/link';
import Report from '@/components/Modals/Report';
import { useIsAuthRoute } from '@/hooks';
import { getPageNames } from './pageRoutes';
import Snack from '@/components/Snack';

const Header = () => {
  const router = useRouter();
  const pathname = router.pathname;
  const dispatch = useDispatch();
  const authRoutes = useIsAuthRoute();
  const { userDetails } = useSelector((s: RootState) => s.user);
  const { message } = useSelector((s: RootState) => s.snackbar);

  const handleLogout = () => {
    router.push('/login');
    dispatch(authActions.logout() as unknown as UnknownAction);
  };

  const clearSnackBar = () => {
    dispatch(appActions.clearSnackBar() as unknown as UnknownAction);

    // const clearSnackBarAction: clearAction = {
    //   type: appConstants.CLEAR_SNACKBAR,
    // };
    // dispatch(clearSnackBarAction as unknown as UnknownAction);
  };
  console.log('message', message);

  return (
    <>
      {authRoutes || pathname.startsWith('/request') ? (
        <header className="flex items-center justify-between px-[35px] h-[4.5rem] border border-[#e1e3e7] bg-white shadow-[0_16px_32px_0_rgba(189,189,189,0.25)] cursor-pointer relative">
          <Link href="/" passHref className="flex items-center">
            <EgfmLogo />
            <span className="ml-2 text-[#32323d] text-[20px] font-bold leading-[21px] text-left">
              Logistics
            </span>
          </Link>
          {message.message !== '' && (
            <Snack
              onClose={clearSnackBar}
              variant={message.variant as 'success' | 'error'}
              message={<span id="message-id">{message.message}</span>}
            />
          )}
          {(router.pathname === '/' ||
            router.pathname === '/landing' ||
            pathname.startsWith('/request')) && (
            <Report className="bg-[#b28309] text-white cursor-pointer rounded-[3px] py-3 px-4 text-[13px] font-semibold mx-2 transition duration-300">
              Report an Issue
            </Report>
          )}
        </header>
      ) : (
        <header className="bg-white h-[4.8rem] sticky top-0 z-[5001] px-8 flex items-center justify-between border-l-[0.5px] border-[#E1E3E7] text-[#0F2552] shadow-[0px_16px_32px_0px_rgba(189,189,189,0.25)]">
          <h1 className="capitalize font-semibold">
            {getPageNames(router.pathname)}
          </h1>
          <div className="flex items-center gap-x-6">
            {message.message !== '' && (
              <Snack
                onClose={clearSnackBar}
                variant={message.variant as 'success' | 'error'}
                message={<span id="message-id">{message.message}</span>}
              />
            )}
            <div className="group relative inline-block">
              <button className="flex items-center text-xs gap-x-2 px-3 py-3 text-white bg-[#B28309] hover:bg-[#B2830998] transition rounded cursor-pointer capitalize">
                add item
                <CaretIcon className="rotate-90" />
              </button>
              <ul className="absolute right-0 mt-[0.1rem] p-1 min-w-[10rem] bg-white shadow-[16px_0px_32px_0px_rgba(150,150,150,0.15)] border-[0.5px] border-[rgba(15,37,82,0.15)] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                <li className="bg-transparent hover:bg-[#E5E8EC] transition rounded text-xs">
                  <AddItem className="text-start w-full px-3 py-[0.4rem] capitalize cursor-pointer">
                    add item
                  </AddItem>
                </li>
                {/* <li className="bg-transparent hover:bg-[#E5E8EC] transition rounded text-xs px-3 py-[0.4rem] capitalize cursor-pointer">
                  add generator
                </li> */}
                <li className="bg-transparent hover:bg-[#E5E8EC] transition rounded text-xs">
                  <AddStore className="text-start w-full px-3 py-[0.4rem] capitalize cursor-pointer">
                    create store
                  </AddStore>
                </li>
                <li className="bg-transparent hover:bg-[#E5E8EC] transition rounded text-xs">
                  <AddDepartment className="text-start w-full px-3 py-[0.4rem] capitalize cursor-pointer">
                    create department
                  </AddDepartment>
                </li>
                <li className="bg-transparent hover:bg-[#E5E8EC] transition rounded text-xs px-3 py-[0.4rem] capitalize cursor-pointer">
                  maintenance log
                </li>
                <li className="bg-transparent hover:bg-[#E5E8EC] transition rounded text-xs px-3 py-[0.4rem] capitalize cursor-pointer">
                  generator log
                </li>
              </ul>
            </div>
            <div className="relative group">
              <LetteredAvatar
                name={userDetails?.firstName}
                size={34}
                className="cursor-pointer"
              />
              <ul className="absolute right-0 mt-[0.1rem] p-1 min-w-[7rem] bg-white shadow-[16px_0px_32px_0px_rgba(150,150,150,0.15)] border-[0.5px] border-[rgba(15,37,82,0.15)] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                <li
                  onClick={handleLogout}
                  className="bg-transparent hover:bg-[#E5E8EC] transition rounded text-xs px-3 py-[0.4rem] capitalize cursor-pointer"
                >
                  Logout
                </li>
              </ul>
            </div>
          </div>
        </header>
      )}
    </>
  );
};

export default Header;
