// import { EGFMLogoIcon } from '@/components/Icons';
import Link from 'next/link';
import React, { useCallback } from 'react';
import { pageRoutes } from './pageRoutes';
import { useRouter } from 'next/router';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';

const Sidebar = () => {
  const router = useRouter();
  const { userDetails } = useSelector((s: RootState) => s.user);

  const activeRoute = useCallback(
    (link: string) => {
      return router?.pathname === link;
    },
    [router?.pathname]
  );

  const filteredRoutes = pageRoutes.filter((route) =>
    route.allowedRoles ? route.allowedRoles.includes(userDetails?.roleId) : true
  );

  return (
    <div className="bg-white px-4 md:px-[1.8rem] py-[0.93rem] text-[#0F2552] border-[0.5px] border-r-[#E1E3E7] shadow-[0px_16px_32px_0px_rgba(189,189,189,0.25)]">
      <Link href="/" passHref className="">
        <div className="inline-flex items-center">
          {/* <EGFMLogoIcon className="" /> */}
          <span className="hidden xl:block ml-2 text-[#32323d] text-[16px] font-bold leading-[21px] text-left">
            Logistics
          </span>
        </div>
      </Link>
      <ul className="pt-6">
        {filteredRoutes?.map((pageRoute, index) => (
          <li
            key={index}
            className={classNames(
              'my-5 capitalize text-[0.8rem] text-[#0F2552] hover:text-[#B28309] transition',
              { 'text-[#B28309]': activeRoute(pageRoute?.link) }
            )}
          >
            <Link href={pageRoute?.link} className="flex items-center gap-x-4">
              <div className="scale-[90%]">{pageRoute?.icon}</div>
              <span className="hidden xl:block font-medium text-nowrap">
                {pageRoute?.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
