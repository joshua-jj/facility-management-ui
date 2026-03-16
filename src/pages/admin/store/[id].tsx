import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { storeConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React from 'react';
import { formatReadableDate } from '@/utilities/helpers';
import StatusChip from '@/components/StatusChip';
import { DetailRow, DetailSection } from '@/components/DetailField';
import PageHeader from '@/components/PageHeader';

interface StoreDetail {
   id: number;
   name: string;
   status: string;
   createdBy: string;
   createdAt: string;
}

interface StoreDetailProps {
   store: StoreDetail | null;
}

export const getServerSideProps: GetServerSideProps<StoreDetailProps> = async (ctx) => {
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
      const resp = await axios.get(`${storeConstants.STORE_URI}/detail/${id}`, {
         headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      });
      if (resp?.status !== 200) return { notFound: true };
      return { props: { store: resp.data?.data ?? null } };
   } catch {
      return { props: { store: null } };
   }
};

const StoreDetailPage: NextPage<StoreDetailProps> = ({ store }) => {
   if (!store) {
      return (
         <Layout title="Store Details">
            <div className="flex items-center justify-center h-64">
               <p className="text-sm text-gray-400 dark:text-white/40">Store not found.</p>
            </div>
         </Layout>
      );
   }

   const isActive = store.status === 'A' || store.status === 'ACTIVE' || store.status === 'Active' || store.status === '1';

   return (
      <Layout title="Store Details">
         <div className="max-w-4xl mx-auto space-y-5">
            <PageHeader title="Store Details" />

            {/* Header card */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/8 shadow-sm p-5 sm:p-6">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                     <div className="flex items-center gap-3 mb-1.5">
                        <h1 className="text-xl font-bold text-[#0F2552] dark:text-white/90">
                           {store.name}
                        </h1>
                        <StatusChip status={isActive ? 'active' : 'inactive'} size="md" pulse={isActive} />
                     </div>
                     <p className="text-xs text-gray-400 dark:text-white/40">
                        Created by {store.createdBy} &middot; {formatReadableDate(store.createdAt)}
                     </p>
                  </div>
               </div>
            </div>

            {/* Store Information */}
            <DetailSection title="Store Information">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="Store Name" value={store.name} />
                  <DetailRow label="Status" value={<StatusChip status={isActive ? 'active' : 'inactive'} />} />
               </div>
            </DetailSection>

            {/* Audit Trail */}
            <DetailSection title="Audit Trail">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="Created By" value={store.createdBy} />
                  <DetailRow label="Created At" value={formatReadableDate(store.createdAt)} />
               </div>
            </DetailSection>
         </div>
      </Layout>
   );
};

export default StoreDetailPage;
