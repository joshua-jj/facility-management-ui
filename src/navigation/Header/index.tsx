import React from 'react';
import Link from 'next/link';
import Report from '../../components/Modals/Report';
import EgfmLogo from '../../../public/assets/logos/logo.svg';
import { useRouter } from 'next/router';

const Header: React.FC = () => {
  const router = useRouter();
  const routes = [
    '/admin/login',
    '/verify-user/[email]',
    '/admin/change-password',
  ];

  return (
    <>
      <header className="flex items-center justify-between px-[35px] h-[4.5rem] border border-[#e1e3e7] bg-white shadow-[0_16px_32px_0_rgba(189,189,189,0.25)] cursor-pointer relative">
        <Link href="/" passHref className="flex items-center">
          <EgfmLogo />
          <span className="ml-2 text-[#32323d] text-[20px] font-bold leading-[21px] text-left">
            Logistics
          </span>
        </Link>
        {!routes.includes(router.pathname) && (
          <Report className="bg-[#b28309] text-white cursor-pointer rounded-[3px] py-3 px-4 text-[13px] font-semibold mx-2 transition duration-300">
            Report an Issue
          </Report>
        )}
      </header>
    </>
  );
};

export default Header;
