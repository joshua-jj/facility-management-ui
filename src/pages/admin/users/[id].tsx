import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { userConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React from 'react';
import { formatReadableDate } from '@/utilities/helpers';
import { formatPhoneDisplay } from '@/components/FormatValue';
import StatusChip from '@/components/StatusChip';
import { DetailRow, DetailSection } from '@/components/DetailField';
import PageHeader from '@/components/PageHeader';

interface UserDetail {
   id: number;
   firstName: string;
   lastName: string;
   email: string;
   phoneNumber: string;
   gender: string;
   role: {
      id: number;
      name: string;
   };
   department: {
      id: number;
      name: string;
   };
   isVerified: boolean;
   status: string;
   createdAt: string;
}

interface UserDetailProps {
   user: UserDetail | null;
}

export const getServerSideProps: GetServerSideProps<UserDetailProps> = async (ctx) => {
   const { id } = ctx.params || {};
   if (!id || Array.isArray(id) || isNaN(Number(id))) {
      return { notFound: true };
   }

   const cookies = parseCookies(ctx);
   const authToken = cookies?.authToken;

   if (!authToken) {
      return { redirect: { destination: '/login', permanent: false } };
   }

   try {
      const resp = await axios.get(`${userConstants.USER_URI}/detail/${id}`, {
         headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      });
      if (resp?.status !== 200) return { notFound: true };
      return { props: { user: resp.data?.data ?? null } };
   } catch {
      return { props: { user: null } };
   }
};

const UserDetailPage: NextPage<UserDetailProps> = ({ user }) => {
   if (!user) {
      return (
         <Layout title="User Details">
            <div className="flex items-center justify-center h-64">
               <p className="text-sm text-gray-400 dark:text-white/40">User not found.</p>
            </div>
         </Layout>
      );
   }

   const isActive = user.status === 'A' || user.status === 'ACTIVE';

   return (
      <Layout title="User Details">
         <div className="max-w-4xl mx-auto space-y-5">
            <PageHeader />

            {/* Header card */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/8 shadow-sm p-5 sm:p-6">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                     <div className="flex items-center gap-3 mb-1.5">
                        <h1 className="text-xl font-bold text-[#0F2552] dark:text-white/90">
                           {user.firstName} {user.lastName}
                        </h1>
                        <StatusChip status={isActive ? 'active' : 'inactive'} size="md" pulse={isActive} />
                     </div>
                     <p className="text-xs text-gray-400 dark:text-white/40">
                        {user.email} &middot; {user.role?.name ?? 'No Role'}
                     </p>
                  </div>
                  <div className="flex items-center gap-2">
                     <StatusChip status={user.isVerified ? 'verified' : 'unverified'} size="md" />
                  </div>
               </div>
            </div>

            {/* Personal Information */}
            <DetailSection title="Personal Information">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="First Name" value={user.firstName} />
                  <DetailRow label="Last Name" value={user.lastName} />
                  <DetailRow label="Email" value={user.email} />
                  <DetailRow label="Phone" value={formatPhoneDisplay(user.phoneNumber)} />
                  <DetailRow label="Gender" value={user.gender} />
               </div>
            </DetailSection>

            {/* Role & Department */}
            <DetailSection title="Role & Department">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="Role" value={<StatusChip status={user.role?.name?.toLowerCase() ?? 'default'} />} />
                  <DetailRow label="Department" value={user.department?.name} />
                  <DetailRow label="Verified" value={<StatusChip status={user.isVerified ? 'verified' : 'unverified'} />} />
                  <DetailRow label="Status" value={<StatusChip status={isActive ? 'active' : 'inactive'} />} />
               </div>
            </DetailSection>

            {/* Audit Trail */}
            <DetailSection title="Audit Trail">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="Created At" value={formatReadableDate(user.createdAt)} />
               </div>
            </DetailSection>
         </div>
      </Layout>
   );
};

export default UserDetailPage;
