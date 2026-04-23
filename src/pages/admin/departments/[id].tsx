import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { departmentConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React from 'react';
import { useRouter } from 'next/router';
import { formatReadableDate } from '@/utilities/helpers';
import { formatPhoneDisplay } from '@/components/FormatValue';
import PageHeader, { ActionButton } from '@/components/PageHeader';

interface DepartmentDetail {
   id: number;
   name: string;
   hodName: string;
   hodEmail: string;
   hodPhone: string;
   itemCount: number;
   createdBy: string;
   createdAt: string;
   updatedAt?: string;
   updatedBy?: string;
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
   (name || '')
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

const MailIcon = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
   </svg>
);

const PhoneIcon = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92V21a1 1 0 0 1-1.11 1 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 3.18 4.11 1 1 0 0 1 4.18 3h4.09a1 1 0 0 1 1 .75 12.05 12.05 0 0 0 .66 2.64 1 1 0 0 1-.23 1l-1.7 1.7a16 16 0 0 0 6 6l1.7-1.7a1 1 0 0 1 1-.23 12.05 12.05 0 0 0 2.64.66 1 1 0 0 1 .75 1z" />
   </svg>
);

const BoxIcon = (
   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
   </svg>
);

const DepartmentDetailPage: NextPage<DepartmentDetailProps> = ({ department }) => {
   const router = useRouter();

   if (!department) {
      return (
         <Layout title="Department Details">
            <div className="flex items-center justify-center h-64">
               <p className="text-sm" style={{ color: 'var(--text-hint)' }}>
                  Department not found.
               </p>
            </div>
         </Layout>
      );
   }

   const itemCount = department.itemCount ?? 0;

   return (
      <Layout title="Department Details">
         <div className="max-w-6xl mx-auto space-y-5">
            <PageHeader
               title="Department Details"
               subtitle={`Department #${department.id}`}
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
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-bold tracking-wider shrink-0"
                        style={{
                           background: 'linear-gradient(135deg, #1F6FB2 0%, #0F2552 100%)',
                           color: '#ffffff',
                        }}
                     >
                        {initials(department.name) || 'D'}
                     </div>
                     <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                           <SectionLabel>Department · #{department.id}</SectionLabel>
                        </div>
                        <h1
                           className="text-2xl md:text-3xl font-bold tracking-tight truncate"
                           style={{ color: 'var(--text-primary)' }}
                        >
                           {department.name}
                        </h1>
                        <p
                           className="text-xs md:text-sm mt-1 flex flex-wrap items-center gap-x-2 gap-y-1"
                           style={{ color: 'var(--text-hint)' }}
                        >
                           <span>Head of Department</span>
                           <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                              {department.hodName || '—'}
                           </span>
                           <span>·</span>
                           <span>Created by {department.createdBy || '—'}</span>
                        </p>
                     </div>
                  </div>

                  {/* Item count pill */}
                  <div
                     className="flex items-center gap-3 px-4 py-3 rounded-xl shrink-0"
                     style={{
                        background:
                           'linear-gradient(135deg, rgba(31,111,178,0.12) 0%, rgba(15,37,82,0.08) 100%)',
                        border: '1px solid rgba(31,111,178,0.25)',
                     }}
                  >
                     <span style={{ color: '#1F6FB2' }}>{BoxIcon}</span>
                     <div>
                        <div
                           className="text-xl font-bold tabular-nums leading-none"
                           style={{ color: 'var(--text-primary)' }}
                        >
                           {itemCount}
                        </div>
                        <div
                           className="text-[0.6rem] uppercase tracking-widest font-semibold mt-1"
                           style={{ color: 'var(--text-hint)' }}
                        >
                           {itemCount === 1 ? 'Item' : 'Items'} on record
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* ── 2-column body ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
               {/* Left: HOD contact card */}
               <div className="lg:col-span-3 space-y-5">
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <div className="flex items-center justify-between">
                        <SectionLabel accent="#1F6FB2">Head of Department</SectionLabel>
                     </div>

                     <div className="mt-5 flex items-start gap-4">
                        <div
                           className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold tracking-wider shrink-0"
                           style={{
                              background: 'var(--surface-medium)',
                              border: '1px solid var(--border-default)',
                              color: 'var(--text-primary)',
                           }}
                        >
                           {initials(department.hodName) || '—'}
                        </div>
                        <div className="min-w-0 flex-1">
                           <p
                              className="text-base font-semibold truncate"
                              style={{ color: 'var(--text-primary)' }}
                           >
                              {department.hodName || '—'}
                           </p>
                           <p
                              className="text-xs mt-0.5"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              Department Lead
                           </p>

                           <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {department.hodEmail ? (
                                 <a
                                    href={`mailto:${department.hodEmail}`}
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-colors hover:bg-white/5"
                                    style={{
                                       background: 'var(--surface-medium)',
                                       border: '1px solid var(--border-default)',
                                       color: 'var(--text-primary)',
                                    }}
                                 >
                                    <span style={{ color: 'var(--text-hint)' }}>{MailIcon}</span>
                                    <span className="truncate">{department.hodEmail}</span>
                                 </a>
                              ) : (
                                 <div
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs"
                                    style={{
                                       background: 'var(--surface-medium)',
                                       border: '1px solid var(--border-default)',
                                       color: 'var(--text-hint)',
                                    }}
                                 >
                                    <span>{MailIcon}</span>
                                    <span>No email on file</span>
                                 </div>
                              )}

                              {department.hodPhone ? (
                                 <a
                                    href={`tel:${department.hodPhone}`}
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-colors hover:bg-white/5"
                                    style={{
                                       background: 'var(--surface-medium)',
                                       border: '1px solid var(--border-default)',
                                       color: 'var(--text-primary)',
                                    }}
                                 >
                                    <span style={{ color: 'var(--text-hint)' }}>{PhoneIcon}</span>
                                    <span>{formatPhoneDisplay(department.hodPhone)}</span>
                                 </a>
                              ) : (
                                 <div
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs"
                                    style={{
                                       background: 'var(--surface-medium)',
                                       border: '1px solid var(--border-default)',
                                       color: 'var(--text-hint)',
                                    }}
                                 >
                                    <span>{PhoneIcon}</span>
                                    <span>No phone on file</span>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Department info */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Department Information</SectionLabel>
                     <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        <Field label="Department Name" value={department.name} />
                        <Field
                           label="Item Count"
                           value={
                              <span className="tabular-nums font-semibold">
                                 {itemCount.toLocaleString()}
                              </span>
                           }
                        />
                     </div>
                  </div>
               </div>

               {/* Right: Audit trail */}
               <div className="lg:col-span-2 space-y-5">
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Audit Trail</SectionLabel>
                     <div className="mt-4 space-y-2">
                        <Field label="Created By" value={department.createdBy} />
                        <Field
                           label="Created At"
                           value={
                              department.createdAt
                                 ? formatReadableDate(department.createdAt)
                                 : undefined
                           }
                        />
                        {department.updatedBy && (
                           <Field label="Last Updated By" value={department.updatedBy} />
                        )}
                        {department.updatedAt && (
                           <Field
                              label="Last Updated At"
                              value={formatReadableDate(department.updatedAt)}
                           />
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </Layout>
   );
};

export default DepartmentDetailPage;
