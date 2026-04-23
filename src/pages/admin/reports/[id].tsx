import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { reportConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React from 'react';
import { formatReadableDate } from '@/utilities/helpers';
import { formatPhoneDisplay } from '@/components/FormatValue';
import StatusChip from '@/components/StatusChip';
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
   updatedAt?: string;
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

const CARD_STYLE: React.CSSProperties = {
   background: 'var(--surface-low, rgba(255,255,255,0.02))',
   border: '1px solid var(--border-default)',
};

const SectionLabel: React.FC<{ children: React.ReactNode; accent?: string }> = ({
   children,
   accent,
}) => (
   <span
      className="inline-flex items-center gap-1.5 text-[0.55rem] uppercase tracking-widest font-semibold px-2 py-1 rounded-md"
      style={{
         background: accent ? `${accent}14` : 'var(--surface-medium)',
         color: accent ?? 'var(--text-hint)',
         border: `1px solid ${accent ? `${accent}33` : 'var(--border-default)'}`,
      }}
   >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent ?? 'var(--text-hint)' }} />
      {children}
   </span>
);

const Field: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
   <div className="py-2.5">
      <div
         className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1"
         style={{ color: 'var(--text-hint)' }}
      >
         {label}
      </div>
      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
         {value != null && value !== '' ? value : <span style={{ color: 'var(--text-hint)' }}>—</span>}
      </div>
   </div>
);

const initials = (name: string) =>
   name
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

const ReportDetailPage: NextPage<ReportDetailProps> = ({ report }) => {
   if (!report) {
      return (
         <Layout title="Complaint Details">
            <div className="flex items-center justify-center h-64">
               <p className="text-sm" style={{ color: 'var(--text-hint)' }}>
                  Complaint not found.
               </p>
            </div>
         </Layout>
      );
   }

   const complaintStatus = report.summary?.complaintStatus ?? 'Pending';
   const isResolved = complaintStatus === 'Resolved' || complaintStatus === 'Closed';
   const isAttended = !!report.summary?.attendedTo;

   const statusAccent = isResolved
      ? '#10B981'
      : complaintStatus === 'In Progress'
        ? '#F59E0B'
        : '#EF4444';

   return (
      <Layout title="Complaint Details">
         <div className="max-w-6xl mx-auto space-y-5">
            <PageHeader title="Complaint Details" subtitle={`Complaint #${report.id}`} />

            {/* ── Hero card ── */}
            <div className="rounded-2xl p-6 md:p-7" style={CARD_STYLE}>
               <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="min-w-0 flex-1">
                     <div className="flex flex-wrap items-center gap-2 mb-2">
                        <SectionLabel>Complaint · #{report.id}</SectionLabel>
                        <SectionLabel accent={statusAccent}>{complaintStatus}</SectionLabel>
                        {isAttended && <SectionLabel accent="#10B981">Attended</SectionLabel>}
                     </div>
                     <h1
                        className="text-2xl md:text-3xl font-bold tracking-tight"
                        style={{ color: 'var(--text-primary)' }}
                     >
                        {report.complaintSubject || 'Report'}
                     </h1>
                     <p
                        className="text-xs md:text-sm mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        <span>Submitted</span>
                        <span
                           className="font-semibold"
                           style={{ color: 'var(--text-secondary)' }}
                        >
                           {formatReadableDate(report.complaintDate || report.createdAt)}
                        </span>
                        <span>·</span>
                        <span>by {report.complainerName || '—'}</span>
                     </p>
                  </div>
               </div>
            </div>

            {/* ── 2-column body ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
               {/* Left: Description + Resolution */}
               <div className="lg:col-span-3 space-y-5">
                  {/* Complaint */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Complaint</SectionLabel>
                     <h3
                        className="mt-4 font-semibold text-base"
                        style={{ color: 'var(--text-primary)' }}
                     >
                        {report.complaintSubject}
                     </h3>
                     <p
                        className="mt-3 text-sm whitespace-pre-wrap"
                        style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
                     >
                        {report.complaintDescription || '—'}
                     </p>
                  </div>

                  {/* Resolution */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <div className="flex items-center justify-between">
                        <SectionLabel accent={statusAccent}>Resolution</SectionLabel>
                     </div>
                     <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        <Field
                           label="Status"
                           value={<StatusChip status={complaintStatus} pulse={!isResolved} />}
                        />
                        <Field
                           label="Attended"
                           value={<StatusChip status={isAttended ? 'yes' : 'no'} />}
                        />
                        <Field
                           label="Resolved By"
                           value={report.summary?.resolvedBy}
                        />
                        <Field
                           label="Date Resolved"
                           value={
                              report.summary?.dateResolved
                                 ? formatReadableDate(report.summary.dateResolved)
                                 : undefined
                           }
                        />
                     </div>
                  </div>
               </div>

               {/* Right: Complainer profile + Audit */}
               <div className="lg:col-span-2 space-y-5">
                  {/* Complainer */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Complainer</SectionLabel>
                     <div className="mt-5 flex items-start gap-3">
                        <div
                           className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold tracking-wider shrink-0"
                           style={{
                              background: 'var(--surface-medium)',
                              border: '1px solid var(--border-default)',
                              color: 'var(--text-primary)',
                           }}
                        >
                           {report.complainerName ? initials(report.complainerName) : '—'}
                        </div>
                        <div className="min-w-0 flex-1">
                           <p
                              className="text-sm font-semibold truncate"
                              style={{ color: 'var(--text-primary)' }}
                           >
                              {report.complainerName || '—'}
                           </p>
                           {report.complainerEmail && (
                              <a
                                 href={`mailto:${report.complainerEmail}`}
                                 className="text-xs mt-1 block truncate hover:underline"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 {report.complainerEmail}
                              </a>
                           )}
                           {report.complainerPhone && (
                              <a
                                 href={`tel:${report.complainerPhone}`}
                                 className="text-xs mt-1 block hover:underline"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 {formatPhoneDisplay(report.complainerPhone)}
                              </a>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Audit */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Audit Trail</SectionLabel>
                     <div className="mt-4 space-y-2">
                        <Field label="Created At" value={formatReadableDate(report.createdAt)} />
                        {report.updatedAt && (
                           <Field label="Last Updated" value={formatReadableDate(report.updatedAt)} />
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </Layout>
   );
};

export default ReportDetailPage;
