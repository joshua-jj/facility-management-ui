import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { maintenanceConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React from 'react';
import { formatReadableDate } from '@/utilities/helpers';
import { formatCurrency, formatPhoneDisplay } from '@/components/FormatValue';
import StatusChip from '@/components/StatusChip';
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
      <span
         className="w-1.5 h-1.5 rounded-full"
         style={{ background: accent ?? 'var(--text-hint)' }}
      />
      {children}
   </span>
);

const Field: React.FC<{ label: string; value?: React.ReactNode; mono?: boolean }> = ({
   label,
   value,
   mono,
}) => (
   <div className="py-2.5">
      <div
         className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1"
         style={{ color: 'var(--text-hint)' }}
      >
         {label}
      </div>
      <div
         className={`text-sm ${mono ? 'tabular-nums' : ''}`}
         style={{ color: 'var(--text-primary)' }}
      >
         {value != null && value !== '' ? (
            value
         ) : (
            <span style={{ color: 'var(--text-hint)' }}>—</span>
         )}
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

const MaintenanceLogDetailPage: NextPage<MaintenanceLogDetailProps> = ({ log }) => {
   if (!log) {
      return (
         <Layout title="Maintenance Log Details">
            <div className="flex items-center justify-center h-64">
               <p className="text-sm" style={{ color: 'var(--text-hint)' }}>
                  Maintenance log not found.
               </p>
            </div>
         </Layout>
      );
   }

   return (
      <Layout title="Maintenance Log Details">
         <div className="max-w-6xl mx-auto space-y-5">
            <PageHeader title="Maintenance Log Details" subtitle={`Log #${log.id}`} />

            {/* Hero card with cost as prominent metric */}
            <div className="rounded-2xl p-6 md:p-7" style={CARD_STYLE}>
               <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="min-w-0 flex-1">
                     <div className="flex items-center gap-2 mb-2">
                        <SectionLabel>Maintenance · #{log.id}</SectionLabel>
                        <StatusChip status={String(log.status ?? 'A')} size="md" />
                     </div>
                     <h1
                        className="text-2xl md:text-3xl font-bold tracking-tight"
                        style={{ color: 'var(--text-primary)' }}
                     >
                        {log.serviceItemName || 'Maintenance Log'}
                     </h1>
                     <p
                        className="text-xs md:text-sm mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        <span>
                           Serviced on{' '}
                           <span
                              className="font-semibold"
                              style={{ color: 'var(--text-secondary)' }}
                           >
                              {log.maintenanceDate
                                 ? formatReadableDate(log.maintenanceDate)
                                 : '—'}
                           </span>
                        </span>
                        <span>·</span>
                        <span>Logged by {log.createdBy}</span>
                     </p>
                  </div>

                  {/* Cost hero */}
                  <div
                     className="rounded-xl p-4 md:p-5 lg:min-w-[240px] shrink-0"
                     style={{
                        background: 'var(--surface-medium)',
                        border: '1px solid var(--border-default)',
                     }}
                  >
                     <div
                        className="text-[0.6rem] uppercase tracking-wider font-semibold"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        Total Cost
                     </div>
                     <div
                        className="text-3xl md:text-4xl font-bold tabular-nums tracking-tight mt-1.5"
                        style={{ color: 'var(--text-primary)' }}
                     >
                        {formatCurrency(log.costOfMaintenance ?? 0)}
                     </div>
                     <div
                        className="text-[0.65rem] mt-1"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        Paid to {log.artisanName || '—'}
                     </div>
                  </div>
               </div>
            </div>

            {/* 2-column body */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
               {/* Left: Description + Artisan */}
               <div className="lg:col-span-3 space-y-5">
                  {/* Maintenance Overview */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Maintenance Overview</SectionLabel>
                     <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        <Field label="Serviced Item" value={log.serviceItemName} />
                        <Field
                           label="Maintenance Date"
                           value={
                              log.maintenanceDate
                                 ? formatReadableDate(log.maintenanceDate)
                                 : undefined
                           }
                        />
                        <Field
                           label="Cost"
                           value={formatCurrency(log.costOfMaintenance ?? 0)}
                           mono
                        />
                        <Field
                           label="Status"
                           value={<StatusChip status={String(log.status ?? 'A')} />}
                        />
                     </div>
                     <div
                        className="mt-4 pt-4"
                        style={{ borderTop: '1px solid var(--border-default)' }}
                     >
                        <Field label="Description" value={log.description} />
                     </div>
                  </div>

                  {/* Signature */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Signature</SectionLabel>
                     <div
                        className="mt-4 rounded-xl p-5 text-center"
                        style={{
                           background: 'var(--surface-medium)',
                           border: '1px dashed var(--border-strong)',
                        }}
                     >
                        {log.signature ? (
                           <span
                              className="text-lg md:text-xl italic font-medium"
                              style={{
                                 fontFamily: '"Brush Script MT", "Segoe Script", cursive',
                                 color: 'var(--text-primary)',
                              }}
                           >
                              {log.signature}
                           </span>
                        ) : (
                           <span className="text-sm" style={{ color: 'var(--text-hint)' }}>
                              No signature recorded
                           </span>
                        )}
                     </div>
                  </div>
               </div>

               {/* Right: Artisan card + Audit */}
               <div className="lg:col-span-2 space-y-5">
                  {/* Artisan profile */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Artisan</SectionLabel>
                     <div className="mt-5 flex items-start gap-3">
                        <div
                           className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold tracking-wider shrink-0"
                           style={{
                              background: 'var(--surface-medium)',
                              border: '1px solid var(--border-default)',
                              color: 'var(--text-primary)',
                           }}
                        >
                           {log.artisanName ? initials(log.artisanName) : '—'}
                        </div>
                        <div className="min-w-0 flex-1">
                           <p
                              className="text-sm font-semibold truncate"
                              style={{ color: 'var(--text-primary)' }}
                           >
                              {log.artisanName || '—'}
                           </p>
                           {log.artisanPhone && (
                              <a
                                 href={`tel:${log.artisanPhone}`}
                                 className="text-xs mt-1 block hover:underline"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 {formatPhoneDisplay(log.artisanPhone)}
                              </a>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Audit */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Audit Trail</SectionLabel>
                     <div className="mt-4 space-y-2">
                        <Field label="Created By" value={log.createdBy} />
                        <Field label="Created At" value={formatReadableDate(log.createdAt)} />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </Layout>
   );
};

export default MaintenanceLogDetailPage;
