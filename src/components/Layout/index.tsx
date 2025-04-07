import React, { ReactNode } from 'react';
import Header from '@/navigation/Header';

type LayoutProps = {
  children: ReactNode;
  query?: string;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-screen overflow-y-scroll overflow-x-hidden scrollbar scrollbar-thin scrollbar-thumb-[#707070] bg-gray-50 scrollbar-track-transparent">
      <Header />
      <main>{children}</main>
    </div>
  );
};

export default Layout;
