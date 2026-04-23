import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { incidenceLogConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React from 'react';
import { useRouter } from 'next/router';
import { formatReadableDate } from '@/utilities/helpers';
import StatusChip from '@/components/StatusChip';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import type { IncidenceLog } from '@/types/incidenceLog';

interface Props {
   log: IncidenceLog | null;
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
   const { id } = ctx.params || {};
   if (!id || Array.isArray(id) || isNaN(Number(id))) return { notFound: true };

   const cookies = parseCookies(ctx);
   const authToken = cookies?.authToken;
   if (!authToken) return { redirect: { destination: '/login', permanent: false } };

   try {
      const resp = await axios.get(
         `${incidenceLogConstants.INCIDENCE_LOG_URI}/detail/${id}`,
         { headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` } },
      );
      if (resp?.status !== 200) return { notFound: true };
      return { props: { log: resp.data?.data ?? null } };
   } catch {
      return { props: { log: null } };
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

const DOWNLOAD_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
   </svg>
);

const NumberedList: React.FC<{ items: string[] }> = ({ items }) => {
   if (!items || items.length === 0) {
      return <p className="text-sm" style={{ color: 'var(--text-hint)' }}>—</p>;
   }
   return (
      <ol className="space-y-2">
         {items.map((txt, i) => (
            <li key={i} className="flex items-start gap-3">
               <span
                  className="shrink-0 tabular-nums text-xs font-semibold w-5 text-right"
                  style={{ color: 'var(--text-hint)' }}
               >
                  {i + 1}.
               </span>
               <span
                  className="text-sm whitespace-pre-wrap"
                  style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}
               >
                  {txt}
               </span>
            </li>
         ))}
      </ol>
   );
};

const IncidenceLogDetailPage: NextPage<Props> = ({ log }) => {
   const router = useRouter();

   if (!log) {
      return (
         <Layout title="Incidence Log Details">
            <div className="flex items-center justify-center h-64">
               <p className="text-sm" style={{ color: 'var(--text-hint)' }}>
                  Incidence log not found.
               </p>
            </div>
         </Layout>
      );
   }

   const openPrintView = () => {
      // Dedicated print layout — auto-triggers browser print dialog where the
      // user can "Save as PDF". Keeps us zero-dependency.
      window.open(`/admin/incidence-log/${log.id}/print`, '_blank');
   };

   return (
      <Layout title="Incidence Log Details">
         <div className="max-w-5xl mx-auto space-y-5">
            <PageHeader
               title="Incidence Log Details"
               subtitle={`Report #${log.id}`}
               action={
                  <div className="flex gap-2">
                     <ActionButton
                        variant="outline"
                        onClick={() => router.push('/admin/incidence-log')}
                     >
                        Back
                     </ActionButton>
                     <ActionButton variant="primary" onClick={openPrintView}>
                        <span className="flex items-center gap-1.5">
                           {DOWNLOAD_ICON} Generate PDF
                        </span>
                     </ActionButton>
                  </div>
               }
            />

            {/* Hero card */}
            <div className="rounded-2xl p-6 md:p-7" style={CARD_STYLE}>
               <div className="flex flex-wrap items-center gap-2 mb-2">
                  <SectionLabel>Incidence Report · #{log.id}</SectionLabel>
                  <StatusChip status={String(log.status ?? 'A')} size="md" />
               </div>
               <h1
                  className="text-2xl md:text-3xl font-bold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
               >
                  {log.department?.name ?? 'Incidence Report'}
               </h1>
               <p
                  className="text-xs md:text-sm mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1"
                  style={{ color: 'var(--text-hint)' }}
               >
                  <span>Occurred on</span>
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                     {log.incidenceDate ? formatReadableDate(log.incidenceDate) : '—'}
                  </span>
                  <span>·</span>
                  <span>{log.location?.name ?? '—'}</span>
                  <span>·</span>
                  <span>Reported by {log.reportedBy ?? '—'}</span>
               </p>
            </div>

            {/* Sections */}
            <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
               <SectionLabel accent="#1F6FB2">Incident Points</SectionLabel>
               <div className="mt-4">
                  <NumberedList items={log.incidents ?? []} />
               </div>
            </div>

            <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
               <SectionLabel accent="#1F6FB2">Conclusions</SectionLabel>
               <div className="mt-4">
                  <NumberedList items={log.conclusions ?? []} />
               </div>
            </div>

            <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
               <SectionLabel accent="#1F6FB2">Actions Taken</SectionLabel>
               <div className="mt-4">
                  <NumberedList items={log.actionsTaken ?? []} />
               </div>
            </div>

            {/* Audit */}
            <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
               <SectionLabel>Audit Trail</SectionLabel>
               <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
                  <div>
                     <div className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-hint)' }}>
                        Reported By
                     </div>
                     <div style={{ color: 'var(--text-primary)' }}>{log.reportedBy ?? '—'}</div>
                  </div>
                  <div>
                     <div className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-hint)' }}>
                        Date of Report
                     </div>
                     <div style={{ color: 'var(--text-primary)' }}>
                        {log.createdAt ? formatReadableDate(log.createdAt) : '—'}
                     </div>
                  </div>
                  <div>
                     <div className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-hint)' }}>
                        Created By
                     </div>
                     <div style={{ color: 'var(--text-primary)' }}>{log.createdBy ?? '—'}</div>
                  </div>
                  {log.updatedAt && (
                     <div>
                        <div className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-hint)' }}>
                           Last Updated
                        </div>
                        <div style={{ color: 'var(--text-primary)' }}>
                           {formatReadableDate(log.updatedAt)}
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </Layout>
   );
};

export default IncidenceLogDetailPage;
