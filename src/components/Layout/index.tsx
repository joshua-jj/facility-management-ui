import React, { ReactNode } from 'react';
import Header from '@/navigation/Header';
import Sidebar from '@/navigation/Sidebar';
import { useIsAuthRoute } from '@/hooks';
import { useRouter } from 'next/router';
import Head from 'next/head';

type LayoutProps = {
   children: ReactNode;
   className?: string;
   query?: string;
   title?: string;
};

const Layout: React.FC<LayoutProps> = ({ children, className, title }) => {
   const router = useRouter();
   const pathname = router.pathname;
   const authRoutes = useIsAuthRoute();

   return (
      <>
         {authRoutes || pathname.startsWith('/request') ? (
            <div className="h-screen overflow-y-scroll overflow-x-hidden scrollbar scrollbar-thin scrollbar-thumb-[#707070] bg-gray-50 dark:bg-[#0e0e1a] scrollbar-track-transparent transition-colors duration-300">
               <Header />
               <main className="animate-page-enter">{children}</main>
            </div>
         ) : (
            <div className="h-screen overflow-hidden bg-gray-50 dark:bg-[#0e0e1a] flex transition-colors duration-300">
               <Head>
                  <title>
                     {title
                        ? `${title} | EGFM - Facility Management Admin System`
                        : 'EGFM - Facility Management Admin System'}
                  </title>
                  <meta charSet="UTF-8" />
                  <meta name="description" content="EGFM - Facility Management System" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <link rel="icon" href="/favicon.ico" />
               </Head>
               <Sidebar />
               <div className="flex-1 overflow-y-auto min-w-0">
                  <Header />
                  <main
                     className={`text-[#0F2552] dark:text-white/90 p-2 md:p-4 lg:p-8 pb-20 animate-page-enter transition-colors duration-300 ${className}`}
                  >
                     {children}
                  </main>
               </div>
            </div>
         )}
      </>
   );
};

export default Layout;
