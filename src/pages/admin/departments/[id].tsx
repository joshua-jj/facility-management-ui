import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { departmentConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React from 'react';
import { formatReadableDate } from '@/utilities/helpers';
import { formatPhoneDisplay } from '@/components/FormatValue';
import { DetailRow, DetailSection } from '@/components/DetailField';
import PageHeader from '@/components/PageHeader';

interface DepartmentDetail {
   id: number;
   name: string;
   hodName: string;
   hodEmail: string;
   hodPhone: string;
   itemCount: number;
   createdBy: string;
   createdAt: string;
}

interface DepartmentDetailProps {
   department: DepartmentDetail | null;
}

export const getServerSideProps: GetServerSideProps<DepartmentDetailProps> = async (ctx) => {
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
      const resp = await axios.get(`${departmentConstants.DEPARTMENT_URI}/detail/${id}`, {
         headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      });
      if (resp?.status !== 200) return { notFound: true };
      return { props: { department: resp.data?.data ?? null } };
   } catch {
      return { props: { department: null } };
   }
};

const DepartmentDetailPage: NextPage<DepartmentDetailProps> = ({ department }) => {
   if (!department) {
      return (
         <Layout title="Department Details">
            <div className="flex items-center justify-center h-64">
               <p className="text-sm text-gray-400 dark:text-white/40">Department not found.</p>
            </div>
         </Layout>
      );
   }

   return (
      <Layout title="Department Details">
         <div className="max-w-4xl mx-auto space-y-5">
            <PageHeader title="Department Details" />

            {/* Header card */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/8 shadow-sm p-5 sm:p-6">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                     <div className="flex items-center gap-3 mb-1.5">
                        <h1 className="text-xl font-bold text-[#0F2552] dark:text-white/90">
                           {department.name}
                        </h1>
                     </div>
                     <p className="text-xs text-gray-400 dark:text-white/40">
                        HOD: {department.hodName} &middot; Created by {department.createdBy}
                     </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/15">
                     <span className="text-[0.65rem] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        {department.itemCount ?? 0} Items
                     </span>
                  </div>
               </div>
            </div>

            {/* Department Information */}
            <DetailSection title="Department Information">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="Department Name" value={department.name} />
                  <DetailRow label="Item Count" value={String(department.itemCount ?? 0)} />
               </div>
            </DetailSection>

            {/* HOD Information */}
            <DetailSection title="HOD Information">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="HOD Name" value={department.hodName} />
                  <DetailRow label="HOD Email" value={department.hodEmail} />
                  <DetailRow label="HOD Phone" value={formatPhoneDisplay(department.hodPhone)} />
               </div>
            </DetailSection>

            {/* Audit Trail */}
            <DetailSection title="Audit Trail">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="Created By" value={department.createdBy} />
                  <DetailRow label="Created At" value={formatReadableDate(department.createdAt)} />
               </div>
            </DetailSection>
         </div>
      </Layout>
   );
};

export default DepartmentDetailPage;
