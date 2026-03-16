import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { maintenanceConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React from 'react';
import { formatReadableDate } from '@/utilities/helpers';
import { formatCurrency, formatPhoneDisplay } from '@/components/FormatValue';
import StatusChip from '@/components/StatusChip';
import { DetailRow, DetailSection } from '@/components/DetailField';
import PageHeader from '@/components/PageHeader';

interface MaintenanceLogDetail {
   id: number;
   serviceItemName: string;
   costOfMaintenance: number;
   artisanName: string;
   artisanPhone: string;
   maintenanceDate: string;
   description: string;
   signature: string;
   createdBy: string;
   createdAt: string;
   status: string;
}

interface MaintenanceLogDetailProps {
   log: MaintenanceLogDetail | null;
}

export const getServerSideProps: GetServerSideProps<MaintenanceLogDetailProps> = async (ctx) => {
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
      const resp = await axios.get(`${maintenanceConstants.MAINTENANCE_URI}/detail/${id}`, {
         headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      });
      if (resp?.status !== 200) return { notFound: true };
      return { props: { log: resp.data?.data ?? null } };
   } catch {
      return { props: { log: null } };
   }
};

const MaintenanceLogDetailPage: NextPage<MaintenanceLogDetailProps> = ({ log }) => {
   if (!log) {
      return (
         <Layout title="Maintenance Log Details">
            <div className="flex items-center justify-center h-64">
               <p className="text-sm text-gray-400 dark:text-white/40">Maintenance log not found.</p>
            </div>
         </Layout>
      );
   }

   return (
      <Layout title="Maintenance Log Details">
         <div className="max-w-4xl mx-auto space-y-5">
            <PageHeader title="Maintenance Log Details" />

            {/* Header card */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/8 shadow-sm p-5 sm:p-6">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                     <div className="flex items-center gap-3 mb-1.5">
                        <h1 className="text-xl font-bold text-[#0F2552] dark:text-white/90">
                           {log.serviceItemName || 'Maintenance Log'}
                        </h1>
                        <StatusChip status={String(log.status ?? 'A')} size="md" />
                     </div>
                     <p className="text-xs text-gray-400 dark:text-white/40">
                        Logged by {log.createdBy} &middot; {formatReadableDate(log.maintenanceDate || log.createdAt)}
                     </p>
                  </div>
               </div>
            </div>

            {/* Maintenance Information */}
            <DetailSection title="Maintenance Information">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="Serviced Item" value={log.serviceItemName} />
                  <DetailRow label="Cost" value={formatCurrency(log.costOfMaintenance)} />
                  <DetailRow label="Artisan Name" value={log.artisanName} />
                  <DetailRow label="Artisan Phone" value={formatPhoneDisplay(log.artisanPhone)} />
                  <DetailRow label="Maintenance Date" value={log.maintenanceDate ? formatReadableDate(log.maintenanceDate) : undefined} />
                  <DetailRow label="Status" value={<StatusChip status={String(log.status ?? 'A')} />} />
               </div>
               <DetailRow label="Description" value={log.description} />
               <DetailRow label="Signature" value={log.signature} />
            </DetailSection>

            {/* Audit Trail */}
            <DetailSection title="Audit Trail">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="Created By" value={log.createdBy} />
                  <DetailRow label="Created At" value={formatReadableDate(log.createdAt)} />
               </div>
            </DetailSection>
         </div>
      </Layout>
   );
};

export default MaintenanceLogDetailPage;
