import React, { ReactNode } from 'react';
import Header from '@/navigation/Header';
import Sidebar from '@/navigation/Sidebar';
import { useIsAuthRoute } from '@/hooks';
import { useRouter } from 'next/router';

type LayoutProps = {
  children: ReactNode;
  className?: string;
  query?: string;
};

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  const router = useRouter();
  const pathname = router.pathname;
  const authRoutes = useIsAuthRoute();

  return (
    <>
      {authRoutes || pathname.startsWith('/request') ? (
        <div className="h-screen overflow-y-scroll overflow-x-hidden scrollbar scrollbar-thin scrollbar-thumb-[#707070] bg-gray-50 scrollbar-track-transparent">
          <Header />
          <main>{children}</main>
        </div>
      ) : (
      <div className="h-screen overflow-hidden w-full bg-gray-50 grid grid-cols-1 sm:grid-cols-[1fr_5.4fr]">
        <Sidebar />
        <div className="overflow-y-auto">
          <Header />
          <main className={`text-[#0F2552] p-8 pb-20 ${className}`}>
            {children}
          </main>
        </div>
      </div>
    )}
    </>
  );
};

export default Layout;
