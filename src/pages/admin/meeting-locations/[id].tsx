import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { meetingConstants } from '@/constants/meeting.constant';
import { meetingLocationConstants } from '@/constants/meetingLocation.constant';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React from 'react';
import { useRouter } from 'next/router';
import { formatReadableDate } from '@/utilities/helpers';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import StatusChip from '@/components/StatusChip';

interface LocationDetail {
   id: number;
   name: string;
   status?: string;
   createdAt: string;
   createdBy: string;
   updatedAt?: string;
   updatedBy?: string;
}

interface MeetingAtLocation {
   id: number;
   name: string;
}

interface Props {
   location: LocationDetail | null;
   meetings: MeetingAtLocation[];
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
   const { id } = ctx.params || {};
   if (!id || Array.isArray(id) || isNaN(Number(id)))
      return { notFound: true };

   const cookies = parseCookies(ctx);
   const authToken = cookies?.authToken;
   if (!authToken) return { redirect: { destination: '/login', permanent: false } };

   const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
   };

   try {
      const locationResp = await axios.get(
         `${meetingLocationConstants.MEETING_LOCATION_URI}/${id}`,
         { headers },
      );
      if (locationResp?.status !== 200) return { notFound: true };

      const location = (locationResp.data?.data ?? null) as LocationDetail | null;

      // Fetch meetings held at this location (best-effort — don't fail the
      // whole page if the meetings endpoint hiccups).
      let meetings: MeetingAtLocation[] = [];
      try {
         const meetingsResp = await axios.get(
            `${meetingConstants.MEETING_URI}?locationId=${id}&limit=100`,
            { headers },
         );
         const items =
            meetingsResp?.data?.data?.items ?? meetingsResp?.data?.data ?? [];
         meetings = (items as MeetingAtLocation[]).map((m) => ({
            id: m.id,
            name: m.name,
         }));
      } catch {
         meetings = [];
      }

      return { props: { location, meetings } };
   } catch {
      return { props: { location: null, meetings: [] } };
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

const initials = (name: string) =>
   (name || '')
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

const PinIcon = (
   <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
   </svg>
);

const MeetingLocationDetailPage: NextPage<Props> = ({ location, meetings }) => {
   const router = useRouter();

   if (!location) {
      return (
         <Layout title="Meeting Location">
            <div className="flex items-center justify-center h-64">
               <p className="text-sm" style={{ color: 'var(--text-hint)' }}>
                  Meeting location not found.
               </p>
            </div>
         </Layout>
      );
   }

   return (
      <Layout title="Meeting Location">
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
                           background: 'rgba(16,185,129,0.14)',
                           border: '1px solid rgba(16,185,129,0.33)',
                           color: '#10B981',
                        }}
                     >
                        {PinIcon}
                     </div>
                     <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                           <SectionLabel>Meeting Location · #{location.id}</SectionLabel>
                           {location.status && (
                              <StatusChip status={String(location.status)} size="md" />
                           )}
                        </div>
                        <h1
                           className="text-2xl md:text-3xl font-bold tracking-tight truncate"
                           style={{ color: 'var(--text-primary)' }}
                        >
                           {location.name}
                        </h1>
                        <p
                           className="text-xs md:text-sm mt-1"
                           style={{ color: 'var(--text-hint)' }}
                        >
                           {meetings.length === 0
                              ? 'No meetings currently held here'
                              : `Hosts ${meetings.length} meeting${
                                   meetings.length === 1 ? '' : 's'
                                }`}
                        </p>
                     </div>
                  </div>

                  {/* Meeting count badge */}
                  <div
                     className="flex items-center gap-3 px-4 py-3 rounded-xl shrink-0"
                     style={{
                        background:
                           'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.08) 100%)',
                        border: '1px solid rgba(16,185,129,0.25)',
                     }}
                  >
                     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                     </svg>
                     <div>
                        <div
                           className="text-xl font-bold tabular-nums leading-none"
                           style={{ color: 'var(--text-primary)' }}
                        >
                           {meetings.length}
                        </div>
                        <div
                           className="text-[0.6rem] uppercase tracking-widest font-semibold mt-1"
                           style={{ color: 'var(--text-hint)' }}
                        >
                           {meetings.length === 1 ? 'Meeting' : 'Meetings'}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* ── Two-column body ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
               <div className="lg:col-span-2 space-y-5">
                  {/* Meetings at this location */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel accent="#10B981">Meetings at this Location</SectionLabel>
                     {meetings.length === 0 ? (
                        <p
                           className="text-sm mt-4"
                           style={{ color: 'var(--text-hint)', fontStyle: 'italic' }}
                        >
                           No meetings are currently scheduled at this location.
                        </p>
                     ) : (
                        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                           {meetings.map((m) => (
                              <li key={m.id}>
                                 <button
                                    type="button"
                                    onClick={() => router.push(`/admin/meetings/${m.id}`)}
                                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/5 cursor-pointer"
                                    style={{
                                       background: 'var(--surface-medium)',
                                       border: '1px solid var(--border-default)',
                                    }}
                                 >
                                    <span
                                       className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[0.65rem] font-bold"
                                       style={{
                                          background: 'rgba(31,111,178,0.12)',
                                          color: '#1F6FB2',
                                          border: '1px solid rgba(31,111,178,0.25)',
                                       }}
                                    >
                                       #{m.id}
                                    </span>
                                    <span
                                       className="text-sm font-semibold truncate"
                                       style={{ color: 'var(--text-primary)' }}
                                    >
                                       {m.name}
                                    </span>
                                 </button>
                              </li>
                           ))}
                        </ul>
                     )}
                  </div>

                  {/* Location info */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Location Information</SectionLabel>
                     <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div>
                           <div
                              className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              Name
                           </div>
                           <div style={{ color: 'var(--text-primary)' }}>
                              {location.name}
                           </div>
                        </div>
                        <div>
                           <div
                              className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              Meeting Count
                           </div>
                           <div
                              style={{ color: 'var(--text-primary)' }}
                              className="tabular-nums font-semibold"
                           >
                              {meetings.length.toLocaleString()}
                           </div>
                        </div>
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
                                 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                              color: '#ffffff',
                           }}
                        >
                           {initials(location.createdBy) || '—'}
                        </div>
                        <div className="min-w-0 flex-1">
                           <p
                              className="text-sm font-semibold truncate"
                              style={{ color: 'var(--text-primary)' }}
                           >
                              {location.createdBy || '—'}
                           </p>
                           <p
                              className="text-[0.65rem] uppercase tracking-widest mt-0.5"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              Added the location
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
                              {location.createdAt
                                 ? formatReadableDate(location.createdAt)
                                 : '—'}
                           </dd>
                        </div>
                        {location.updatedBy && (
                           <div>
                              <dt
                                 className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 Last Updated By
                              </dt>
                              <dd style={{ color: 'var(--text-primary)' }}>
                                 {location.updatedBy}
                              </dd>
                           </div>
                        )}
                        {location.updatedAt && (
                           <div>
                              <dt
                                 className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 Last Updated At
                              </dt>
                              <dd style={{ color: 'var(--text-primary)' }}>
                                 {formatReadableDate(location.updatedAt)}
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

export default MeetingLocationDetailPage;
