import { authActions } from '@/actions';
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

const AdminHeader = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { userDetails } = useSelector((s: RootState) => s.user);

  const getPageNames = (link: string) => {
    switch (link) {
      case '/admin/dashboard':
        return 'dashboard';
      case '/admin/requests':
        return 'requests';
      case '/admin/items':
        return 'items';
      case '/admin/store':
        return 'store';
      case '/admin/departments':
        return 'departments';
      case '/admin/maintenance-log':
        return 'maintenance log';
      case '/admin/generator-log':
        return 'generator log';
      case '/admin/reports':
        return 'reports';
      default:
        return '';
    }
  };

  const handleLogout = () => {
    router.push('/admin/login');
    dispatch(authActions.logout() as unknown as UnknownAction);
  };

  return (
    <div className="bg-white h-[4.8rem] sticky top-0 z-50 px-8 flex items-center justify-between border-l-[0.5px] border-[#E1E3E7] text-[#0F2552] shadow-[0px_16px_32px_0px_rgba(189,189,189,0.25)]">
      <h1 className="capitalize font-semibold">
        {getPageNames(router.pathname)}
      </h1>
      <div className="flex items-center gap-x-6">
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
    </div>
  );
};

export default AdminHeader;
