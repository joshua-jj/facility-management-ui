import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { meetingConstants } from '@/constants/meeting.constant';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React from 'react';
import { useRouter } from 'next/router';
import { formatReadableDate } from '@/utilities/helpers';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import StatusChip from '@/components/StatusChip';

interface MeetingDetail {
   id: number;
   name: string;
   status?: string;
   createdAt: string;
   createdBy: string;
   updatedAt?: string;
   updatedBy?: string;
   location: {
      id: number;
      name: string;
   };
}

interface Props {
   meeting: MeetingDetail | null;
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
   const { id } = ctx.params || {};
   if (!id || Array.isArray(id) || isNaN(Number(id))) return { notFound: true };

   const cookies = parseCookies(ctx);
   const authToken = cookies?.authToken;
   if (!authToken) return { redirect: { destination: '/login', permanent: false } };

   try {
      const resp = await axios.get(`${meetingConstants.MEETING_URI}/${id}`, {
         headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      });
      if (resp?.status !== 200) return { notFound: true };
      return { props: { meeting: resp.data?.data ?? null } };
   } catch {
      return { props: { meeting: null } };
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

const Field: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
   <div className="py-2.5">
      <div
         className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1"
         style={{ color: 'var(--text-hint)' }}
      >
         {label}
      </div>
      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
         {value != null && value !== '' ? (
            value
         ) : (
            <span style={{ color: 'var(--text-hint)' }}>—</span>
         )}
      </div>
   </div>
);

const initials = (name: string) =>
   (name || '')
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

const CalendarIcon = (
   <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
   </svg>
);

const MeetingDetailPage: NextPage<Props> = ({ meeting }) => {
   const router = useRouter();

   if (!meeting) {
      return (
         <Layout title="Meeting">
            <div className="flex items-center justify-center h-64">
               <p className="text-sm" style={{ color: 'var(--text-hint)' }}>
                  Meeting not found.
               </p>
            </div>
         </Layout>
      );
   }

   return (
      <Layout title="Meeting">
         <div className="max-w-6xl mx-auto space-y-5">
            <PageHeader
               action={
                  <ActionButton variant="outline" onClick={() => router.back()}>
                     Back
                  </ActionButton>
               }
            />

            {/* ── Hero card ── */}
            <div className="rounded-2xl p-6 md:p-7" style={CARD_STYLE}>
               <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="flex items-center gap-4 min-w-0">
                     <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                        style={{
                           background: 'rgba(31,111,178,0.14)',
                           border: '1px solid rgba(31,111,178,0.33)',
                           color: '#1F6FB2',
                        }}
                     >
                        {CalendarIcon}
                     </div>
                     <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                           <SectionLabel>Meeting · #{meeting.id}</SectionLabel>
                           {meeting.status && (
                              <StatusChip status={String(meeting.status)} size="md" />
                           )}
                        </div>
                        <h1
                           className="text-2xl md:text-3xl font-bold tracking-tight truncate"
                           style={{ color: 'var(--text-primary)' }}
                        >
                           {meeting.name}
                        </h1>
                        <p
                           className="text-xs md:text-sm mt-1"
                           style={{ color: 'var(--text-hint)' }}
                        >
                           Held at{' '}
                           <span
                              className="font-semibold"
                              style={{ color: 'var(--text-secondary)' }}
                           >
                              {meeting.location?.name ?? '—'}
                           </span>
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* ── Two-column body ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
               <div className="lg:col-span-2 space-y-5">
                  {/* Meeting info */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel accent="#1F6FB2">Meeting Details</SectionLabel>
                     <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        <Field label="Meeting Name" value={meeting.name} />
                        <Field
                           label="Location"
                           value={
                              meeting.location?.id ? (
                                 <button
                                    type="button"
                                    onClick={() =>
                                       router.push(
                                          `/admin/meeting-locations/${meeting.location.id}`,
                                       )
                                    }
                                    className="text-left hover:underline transition-colors cursor-pointer"
                                    style={{ color: 'var(--color-secondary)' }}
                                 >
                                    {meeting.location.name}
                                 </button>
                              ) : undefined
                           }
                        />
                     </div>
                  </div>
               </div>

               {/* Audit sidebar */}
               <div className="lg:col-span-1 space-y-5">
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Audit Trail</SectionLabel>
                     <div className="mt-5 flex items-start gap-3">
                        <div
                           className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold tracking-wider shrink-0"
                           style={{
                              background:
                                 'linear-gradient(135deg, #1F6FB2 0%, #0F2552 100%)',
                              color: '#ffffff',
                           }}
                        >
                           {initials(meeting.createdBy) || '—'}
                        </div>
                        <div className="min-w-0 flex-1">
                           <p
                              className="text-sm font-semibold truncate"
                              style={{ color: 'var(--text-primary)' }}
                           >
                              {meeting.createdBy || '—'}
                           </p>
                           <p
                              className="text-[0.65rem] uppercase tracking-widest mt-0.5"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              Created the meeting
                           </p>
                        </div>
                     </div>
                     <dl className="mt-4 space-y-3 text-sm">
                        <div>
                           <dt
                              className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              Created At
                           </dt>
                           <dd style={{ color: 'var(--text-primary)' }}>
                              {meeting.createdAt
                                 ? formatReadableDate(meeting.createdAt)
                                 : '—'}
                           </dd>
                        </div>
                        {meeting.updatedBy && (
                           <div>
                              <dt
                                 className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 Last Updated By
                              </dt>
                              <dd style={{ color: 'var(--text-primary)' }}>
                                 {meeting.updatedBy}
                              </dd>
                           </div>
                        )}
                        {meeting.updatedAt && (
                           <div>
                              <dt
                                 className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 Last Updated At
                              </dt>
                              <dd style={{ color: 'var(--text-primary)' }}>
                                 {formatReadableDate(meeting.updatedAt)}
                              </dd>
                           </div>
                        )}
                     </dl>
                  </div>
               </div>
            </div>
         </div>
      </Layout>
   );
};

export default MeetingDetailPage;
