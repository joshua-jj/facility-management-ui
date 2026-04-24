import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { storeConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React from 'react';
import { useRouter } from 'next/router';
import { formatReadableDate } from '@/utilities/helpers';
import StatusChip from '@/components/StatusChip';
import PageHeader, { ActionButton } from '@/components/PageHeader';

interface StoreDetail {
   id: number;
   name: string;
   status: string;
   createdBy: string;
   createdAt: string;
   updatedAt?: string;
   updatedBy?: string;
   location?: {
      id?: number;
      streetAddress?: string;
      city?: string;
      state?: string;
      country?: string;
   } | null;
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

// ── Styling tokens ──────────────────────────────────────────────────────────

const CARD_STYLE: React.CSSProperties = {
   background: 'var(--surface-low, rgba(255,255,255,0.02))',
   border: '1px solid var(--border-default)',
};

// ── Small components ────────────────────────────────────────────────────────

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

const formatAddress = (loc?: StoreDetail['location']): string => {
   if (!loc) return '';
   return [loc.streetAddress, loc.city, loc.state, loc.country]
      .filter(Boolean)
      .join(', ');
};

// ── Icons ───────────────────────────────────────────────────────────────────

const StoreIcon = (
   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1.5-6h15L21 9" />
      <path d="M3 9v12h18V9" />
      <path d="M3 9h18" />
      <path d="M8 13h8" />
   </svg>
);

const PinIcon = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
   </svg>
);

// ── Page ────────────────────────────────────────────────────────────────────

const StoreDetailPage: NextPage<StoreDetailProps> = ({ store }) => {
   const router = useRouter();

   if (!store) {
      return (
         <Layout title="Store">
            <div className="flex items-center justify-center h-64">
               <p className="text-sm" style={{ color: 'var(--text-hint)' }}>
                  Store not found.
               </p>
            </div>
         </Layout>
      );
   }

   const isActive =
      store.status === 'A' ||
      store.status === 'ACTIVE' ||
      store.status === 'Active' ||
      store.status === '1';
   const statusAccent = isActive ? '#10B981' : '#EF4444';
   const statusLabel = isActive ? 'Active' : 'Inactive';
   const address = formatAddress(store.location);

   return (
      <Layout title="Store">
         <div className="max-w-6xl mx-auto space-y-5">
            <PageHeader
               action={
                  <ActionButton variant="outline" onClick={() => router.back()}>
                     Back
                  </ActionButton>
               }
            />

            {/* ── Hero card ── */}
            <div
               className="rounded-2xl p-6 md:p-7 relative overflow-hidden anim-reveal"
               style={{ ...CARD_STYLE, animationDelay: '0ms' }}
            >
               <div
                  aria-hidden="true"
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: statusAccent }}
               />
               <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="flex items-center gap-4 min-w-0">
                     <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 anim-icon-pop"
                        style={{
                           background: 'linear-gradient(135deg, #1F6FB2 0%, #0F2552 100%)',
                           color: '#ffffff',
                        }}
                     >
                        {StoreIcon}
                     </div>
                     <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                           <SectionLabel>Store · #{store.id}</SectionLabel>
                           <SectionLabel accent={statusAccent}>{statusLabel}</SectionLabel>
                        </div>
                        <h1
                           className="text-2xl md:text-3xl font-bold tracking-tight truncate"
                           style={{ color: 'var(--text-primary)' }}
                        >
                           {store.name}
                        </h1>
                        <p
                           className="text-xs md:text-sm mt-1 flex flex-wrap items-center gap-x-2 gap-y-1"
                           style={{ color: 'var(--text-hint)' }}
                        >
                           <span>Added by</span>
                           <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                              {store.createdBy || '—'}
                           </span>
                           <span>·</span>
                           <span>
                              {store.createdAt ? formatReadableDate(store.createdAt) : '—'}
                           </span>
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* ── Two-column body ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
               <div className="lg:col-span-2 space-y-5">
                  {/* Store info */}
                  <div
                     className="rounded-2xl p-5 md:p-6 anim-reveal"
                     style={{ ...CARD_STYLE, animationDelay: '120ms' }}
                  >
                     <SectionLabel accent="#1F6FB2">Store Information</SectionLabel>
                     <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                           <div
                              className="text-[0.6rem] uppercase tracking-widest font-semibold mb-1"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              Store Name
                           </div>
                           <div
                              className="text-sm font-semibold"
                              style={{ color: 'var(--text-primary)' }}
                           >
                              {store.name}
                           </div>
                        </div>
                        <div>
                           <div
                              className="text-[0.6rem] uppercase tracking-widest font-semibold mb-1"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              Status
                           </div>
                           <div>
                              <StatusChip
                                 status={isActive ? 'active' : 'inactive'}
                                 pulse={isActive}
                              />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Address — only if we have data */}
                  {address && (
                     <div
                        className="rounded-2xl p-5 md:p-6 anim-reveal"
                        style={{ ...CARD_STYLE, animationDelay: '240ms' }}
                     >
                        <SectionLabel accent="#10B981">Address</SectionLabel>
                        <div
                           className="mt-4 flex items-start gap-3 px-3 py-2.5 rounded-lg"
                           style={{
                              background: 'var(--surface-medium)',
                              border: '1px solid var(--border-default)',
                           }}
                        >
                           <span
                              className="shrink-0 mt-0.5"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              {PinIcon}
                           </span>
                           <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                              {address}
                           </span>
                        </div>
                     </div>
                  )}
               </div>

               {/* Audit sidebar */}
               <div className="lg:col-span-1 space-y-5">
                  <div
                     className="rounded-2xl p-5 md:p-6 anim-reveal"
                     style={{ ...CARD_STYLE, animationDelay: '180ms' }}
                  >
                     <SectionLabel>Audit Trail</SectionLabel>
                     <div className="mt-5 flex items-start gap-3">
                        <div
                           className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold tracking-wider shrink-0"
                           style={{
                              background: 'linear-gradient(135deg, #1F6FB2 0%, #0F2552 100%)',
                              color: '#ffffff',
                           }}
                        >
                           {initials(store.createdBy) || '—'}
                        </div>
                        <div className="min-w-0 flex-1">
                           <p
                              className="text-sm font-semibold truncate"
                              style={{ color: 'var(--text-primary)' }}
                           >
                              {store.createdBy || '—'}
                           </p>
                           <p
                              className="text-[0.65rem] uppercase tracking-widest mt-0.5"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              Added the store
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
                              {store.createdAt
                                 ? formatReadableDate(store.createdAt)
                                 : '—'}
                           </dd>
                        </div>
                        {store.updatedBy && (
                           <div>
                              <dt
                                 className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 Last Updated By
                              </dt>
                              <dd style={{ color: 'var(--text-primary)' }}>
                                 {store.updatedBy}
                              </dd>
                           </div>
                        )}
                        {store.updatedAt && (
                           <div>
                              <dt
                                 className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 Last Updated At
                              </dt>
                              <dd style={{ color: 'var(--text-primary)' }}>
                                 {formatReadableDate(store.updatedAt)}
                              </dd>
                           </div>
                        )}
                     </dl>
                  </div>
               </div>
            </div>
         </div>

         <style jsx global>{`
            @keyframes store-reveal {
               0% {
                  opacity: 0;
                  transform: translateY(12px);
               }
               100% {
                  opacity: 1;
                  transform: translateY(0);
               }
            }
            @keyframes store-icon-pop {
               0% {
                  opacity: 0;
                  transform: scale(0.7);
               }
               70% {
                  transform: scale(1.08);
               }
               100% {
                  opacity: 1;
                  transform: scale(1);
               }
            }
            .anim-reveal {
               opacity: 0;
               animation: store-reveal 520ms cubic-bezier(0.2, 0.65, 0.3, 1) forwards;
            }
            .anim-icon-pop {
               opacity: 0;
               animation: store-icon-pop 520ms cubic-bezier(0.2, 0.65, 0.3, 1) 120ms forwards;
            }
            @media (prefers-reduced-motion: reduce) {
               .anim-reveal,
               .anim-icon-pop {
                  animation: none !important;
                  opacity: 1 !important;
                  transform: none !important;
               }
            }
         `}</style>
      </Layout>
   );
};

export default StoreDetailPage;
