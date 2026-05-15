import { useRouter } from 'next/router';
import React from 'react';

import EgfmLogo from '../../public/assets/logos/logo.svg';
import Link from 'next/link';
import Report from '@/components/Modals/Report';
import { useIsAuthRoute } from '@/hooks';

import ThemeToggle from '@/components/ThemeToggle';

const Header = () => {
   const router = useRouter();
   const pathname = router.pathname;
   const authRoutes = useIsAuthRoute();

   if (!(authRoutes || pathname.startsWith('/request'))) {
      return null;
   }

   return (
      <header className="md:px-[35px] px-[10px] h-[4.5rem] border border-[#e1e3e7] dark:border-white/10 bg-white dark:bg-[#1a1a2e] shadow-[0_16px_32px_0_rgba(189,189,189,0.25)] dark:shadow-none cursor-pointer relative transition-colors duration-300">
         <div className="md:container mx-auto flex items-center justify-between h-full ">
            <Link href="/" passHref className="flex items-center">
               <EgfmLogo />
               <span className="ml-2 hidden md:block text-[#32323d] dark:text-white/90 text-[20px] font-bold leading-[21px] text-left transition-colors">
                  Facility Portal
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
   );
};

export default Header;
