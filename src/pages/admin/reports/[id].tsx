import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { reportConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React from 'react';
import { formatReadableDate } from '@/utilities/helpers';
import { formatPhoneDisplay } from '@/components/FormatValue';
import StatusChip from '@/components/StatusChip';
import { DetailRow, DetailSection } from '@/components/DetailField';
import PageHeader from '@/components/PageHeader';

interface ComplaintDetail {
   id: number;
   complainerName: string;
   complainerPhone: string;
   complainerEmail: string;
   complaintSubject: string;
   complaintDescription: string;
   complaintDate: string;
   createdAt: string;
   createdBy: string;
   status: string;
   summary?: {
      id: number;
      complaintStatus: string;
      attendedTo: boolean;
      dateResolved: string;
      resolvedBy: string;
   };
}

interface ReportDetailProps {
   report: ComplaintDetail | null;
}

export const getServerSideProps: GetServerSideProps<ReportDetailProps> = async (ctx) => {
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
      const resp = await axios.get(`${reportConstants.REPORT_URI}/detail/${id}`, {
         headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      });
      if (resp?.status !== 200) return { notFound: true };
      return { props: { report: resp.data?.data ?? null } };
   } catch {
      return { props: { report: null } };
   }
};

const ReportDetailPage: NextPage<ReportDetailProps> = ({ report }) => {
   if (!report) {
      return (
         <Layout title="Report Details">
            <div className="flex items-center justify-center h-64">
               <p className="text-sm text-gray-400 dark:text-white/40">Report not found.</p>
            </div>
         </Layout>
      );
   }

   const complaintStatus = report.summary?.complaintStatus ?? 'Pending';
   const isResolved = complaintStatus === 'Resolved' || complaintStatus === 'Closed';

   return (
      <Layout title="Report Details">
         <div className="max-w-4xl mx-auto space-y-5">
            <PageHeader title="Report Details" />

            {/* Header card */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/8 shadow-sm p-5 sm:p-6">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                     <div className="flex items-center gap-3 mb-1.5">
                        <h1 className="text-xl font-bold text-[#0F2552] dark:text-white/90">
                           {report.complaintSubject}
                        </h1>
                        <StatusChip status={complaintStatus} size="md" pulse={!isResolved} />
                     </div>
                     <p className="text-xs text-gray-400 dark:text-white/40">
                        Reported by {report.complainerName} &middot; {formatReadableDate(report.complaintDate || report.createdAt)}
                     </p>
                  </div>
                  {report.summary?.attendedTo && (
                     <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/15">
                        <span className="text-[0.65rem] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Attended To</span>
                     </div>
                  )}
               </div>
            </div>

            {/* Complaint Information */}
            <DetailSection title="Complaint Information">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="Subject" value={report.complaintSubject} />
                  <DetailRow label="Status" value={<StatusChip status={complaintStatus} />} />
                  <DetailRow label="Complainer Name" value={report.complainerName} />
                  <DetailRow label="Email" value={report.complainerEmail} />
                  <DetailRow label="Phone" value={formatPhoneDisplay(report.complainerPhone)} />
                  <DetailRow label="Date Reported" value={formatReadableDate(report.complaintDate || report.createdAt)} />
               </div>
               <DetailRow label="Description" value={report.complaintDescription} />
            </DetailSection>

            {/* Resolution (if summary exists) */}
            {report.summary && (
               <DetailSection title="Resolution Details">
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                     <DetailRow label="Resolution Status" value={<StatusChip status={report.summary.complaintStatus} />} />
                     <DetailRow label="Attended To" value={<StatusChip status={report.summary.attendedTo ? 'yes' : 'no'} />} />
                     <DetailRow label="Resolved By" value={report.summary.resolvedBy} />
                     <DetailRow label="Date Resolved" value={report.summary.dateResolved ? formatReadableDate(report.summary.dateResolved) : undefined} />
                  </div>
               </DetailSection>
            )}

            {/* Metadata */}
            <DetailSection title="Audit Trail">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="Created By" value={report.createdBy} />
                  <DetailRow label="Created At" value={formatReadableDate(report.createdAt)} />
               </div>
            </DetailSection>
         </div>
      </Layout>
   );
};

export default ReportDetailPage;
