import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { generatorConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React from 'react';
import { formatReadableDate } from '@/utilities/helpers';
import StatusChip from '@/components/StatusChip';
import { DetailRow, DetailSection } from '@/components/DetailField';
import PageHeader from '@/components/PageHeader';

interface GeneratorLogDetail {
   id: number;
   nameOfMeeting: string;
   generatorType: string;
   meetingLocation: string;
   onTime: string;
   offTime: string;
   engineStartHours: number;
   engineOffHours: number;
   dieselLevelOn: number;
   dieselLevelOff: number;
   dueForService: boolean;
   faultDetected: boolean;
   faultDescription: string;
   remark: string;
   createdBy: string;
   createdAt: string;
   status: string;
}

interface GeneratorLogDetailProps {
   log: GeneratorLogDetail | null;
}

export const getServerSideProps: GetServerSideProps<GeneratorLogDetailProps> = async (ctx) => {
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
      const resp = await axios.get(`${generatorConstants.GENERATOR_URI}/detail/${id}`, {
         headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      });
      if (resp?.status !== 200) return { notFound: true };
      return { props: { log: resp.data?.data ?? null } };
   } catch {
      return { props: { log: null } };
   }
};

const GeneratorLogDetailPage: NextPage<GeneratorLogDetailProps> = ({ log }) => {
   if (!log) {
      return (
         <Layout title="Generator Log Details">
            <div className="flex items-center justify-center h-64">
               <p className="text-sm text-gray-400 dark:text-white/40">Generator log not found.</p>
            </div>
         </Layout>
      );
   }

   const calculateHoursUsed = (): string => {
      if (!log.onTime || !log.offTime) return '--';
      try {
         const on = new Date(log.onTime);
         const off = new Date(log.offTime);
         const diffMs = off.getTime() - on.getTime();
         if (diffMs < 0) return '--';
         const hours = Math.floor(diffMs / (1000 * 60 * 60));
         const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
         return `${hours}h ${minutes}m`;
      } catch {
         return '--';
      }
   };

   return (
      <Layout title="Generator Log Details">
         <div className="max-w-4xl mx-auto space-y-5">
            <PageHeader title="Generator Log Details" />

            {/* Header card */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/8 shadow-sm p-5 sm:p-6">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                     <div className="flex items-center gap-3 mb-1.5">
                        <h1 className="text-xl font-bold text-[#0F2552] dark:text-white/90">
                           {log.nameOfMeeting || 'Generator Log'}
                        </h1>
                        <StatusChip status={String(log.status ?? 'A')} size="md" />
                     </div>
                     <p className="text-xs text-gray-400 dark:text-white/40">
                        {log.generatorType} &middot; {log.meetingLocation} &middot; Logged by {log.createdBy}
                     </p>
                  </div>
                  {log.dueForService && (
                     <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/15">
                        <span className="text-[0.65rem] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Due For Service</span>
                     </div>
                  )}
               </div>
            </div>

            {/* Generator Information */}
            <DetailSection title="Generator Information">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="Meeting Name" value={log.nameOfMeeting} />
                  <DetailRow label="Generator Type" value={log.generatorType} />
                  <DetailRow label="Location" value={log.meetingLocation} />
                  <DetailRow label="Hours Used" value={calculateHoursUsed()} />
               </div>
            </DetailSection>

            {/* Timing Details */}
            <DetailSection title="Timing Details">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="On Time" value={log.onTime ? formatReadableDate(log.onTime) : undefined} />
                  <DetailRow label="Off Time" value={log.offTime ? formatReadableDate(log.offTime) : undefined} />
                  <DetailRow label="Engine Start Hours" value={log.engineStartHours != null ? String(log.engineStartHours) : undefined} />
                  <DetailRow label="Engine Off Hours" value={log.engineOffHours != null ? String(log.engineOffHours) : undefined} />
                  <DetailRow label="Diesel Level On" value={log.dieselLevelOn != null ? String(log.dieselLevelOn) : undefined} />
                  <DetailRow label="Diesel Level Off" value={log.dieselLevelOff != null ? String(log.dieselLevelOff) : undefined} />
               </div>
            </DetailSection>

            {/* Service & Faults */}
            <DetailSection title="Service & Faults">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="Due For Service" value={<StatusChip status={log.dueForService ? 'yes' : 'no'} />} />
                  <DetailRow label="Fault Detected" value={<StatusChip status={log.faultDetected ? 'yes' : 'no'} />} />
               </div>
               <DetailRow label="Fault Description" value={log.faultDescription} />
               <DetailRow label="Remark" value={log.remark} />
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

export default GeneratorLogDetailPage;
