import React, { ReactNode } from 'react';
import AdminHeader from '@/navigation/AdminHeader';
import AdminSidebar from '@/navigation/AdminSidebar';

type AdminLayoutProps = {
  children: ReactNode;
  className?: string;
  query?: string;
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, className }) => {
  return (
    <div className="h-screen overflow-hidden w-full bg-gray-50 grid grid-cols-1 sm:grid-cols-[1fr_5.4fr]">
      <AdminSidebar />
      <div className="overflow-y-auto">
        <AdminHeader />
        <main className={`text-[#0F2552] p-8 ${className}`}>{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
