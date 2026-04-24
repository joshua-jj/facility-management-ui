import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { incidenceLogConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React, { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { formatReadableDate } from '@/utilities/helpers';
import StatusChip from '@/components/StatusChip';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import FullscreenModal from '@/components/Modals';
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
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent ?? 'var(--text-hint)' }} />
      {children}
   </span>
);

const MetaPill: React.FC<{
   icon: React.ReactNode;
   label: string;
   value: React.ReactNode;
}> = ({ icon, label, value }) => (
   <div
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-transform duration-200 hover:-translate-y-0.5"
      style={{
         background: 'var(--surface-medium)',
         border: '1px solid var(--border-default)',
      }}
   >
      <span
         className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
         style={{
            background: 'var(--surface-low)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-hint)',
         }}
      >
         {icon}
      </span>
      <div className="min-w-0">
         <div
            className="text-[0.55rem] uppercase tracking-widest font-semibold"
            style={{ color: 'var(--text-hint)' }}
         >
            {label}
         </div>
         <div
            className="text-xs font-semibold truncate max-w-[14rem]"
            style={{ color: 'var(--text-primary)' }}
         >
            {value}
         </div>
      </div>
   </div>
);

const initials = (name?: string) =>
   (name || '')
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

// ── Icons ───────────────────────────────────────────────────────────────────

const DOWNLOAD_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
   </svg>
);
const CAL_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
   </svg>
);
const PIN_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
   </svg>
);
const BUILDING_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="7" x2="9" y2="7" />
      <line x1="15" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="9" y2="11" />
      <line x1="15" y1="11" x2="15" y2="11" />
      <line x1="9" y1="15" x2="9" y2="15" />
      <line x1="15" y1="15" x2="15" y2="15" />
   </svg>
);
const USER_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
   </svg>
);
const ALERT_ICON = (
   <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
   </svg>
);
const POINTS_ICON = (
   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
   </svg>
);
const CONCLUSION_ICON = (
   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
   </svg>
);
const ACTION_ICON = (
   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
   </svg>
);

// ── Section card — staggered entrance + count badge + themed list ──────────

interface SectionCardProps {
   title: string;
   accent: string;
   icon: React.ReactNode;
   items: string[];
   animationDelay?: number;
   emptyCopy?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({
   title,
   accent,
   icon,
   items,
   animationDelay = 0,
   emptyCopy = 'Nothing recorded yet.',
}) => {
   const count = items?.length ?? 0;
   return (
      <div
         className="rounded-2xl p-5 md:p-6 transition-all duration-300 hover:-translate-y-0.5 anim-reveal"
         style={{
            ...CARD_STYLE,
            animationDelay: `${animationDelay}ms`,
         }}
      >
         <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
               <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                     background: `${accent}14`,
                     border: `1px solid ${accent}33`,
                     color: accent,
                  }}
               >
                  {icon}
               </span>
               <div>
                  <SectionLabel accent={accent}>{title}</SectionLabel>
                  <div
                     className="text-[0.6rem] uppercase tracking-widest font-semibold mt-1.5"
                     style={{ color: 'var(--text-hint)' }}
                  >
                     {count === 0 ? 'No entries' : `${count} ${count === 1 ? 'entry' : 'entries'}`}
                  </div>
               </div>
            </div>
            <span
               className="text-xs font-bold tabular-nums px-2.5 py-1 rounded-lg"
               style={{
                  background: `${accent}14`,
                  color: accent,
                  border: `1px solid ${accent}33`,
                  minWidth: 32,
                  textAlign: 'center',
               }}
            >
               {count}
            </span>
         </div>

         {count === 0 ? (
            <p
               className="text-sm mt-4"
               style={{ color: 'var(--text-hint)', fontStyle: 'italic' }}
            >
               {emptyCopy}
            </p>
         ) : (
            <ol className="mt-4 space-y-2">
               {items.map((txt, i) => (
                  <li
                     key={i}
                     className="flex items-start gap-3 p-2.5 rounded-lg transition-colors anim-list-item"
                     style={{
                        background: 'var(--surface-medium)',
                        border: '1px solid transparent',
                        animationDelay: `${animationDelay + 140 + i * 70}ms`,
                     }}
                     onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = `${accent}55`;
                     }}
                     onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                     }}
                  >
                     <span
                        className="shrink-0 tabular-nums text-[0.6rem] font-bold uppercase tracking-widest px-2 py-1 rounded-md"
                        style={{
                           background: `${accent}22`,
                           color: accent,
                           minWidth: 26,
                           textAlign: 'center',
                        }}
                     >
                        {i + 1}
                     </span>
                     <span
                        className="text-sm whitespace-pre-wrap pt-0.5"
                        style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}
                     >
                        {txt}
                     </span>
                  </li>
               ))}
            </ol>
         )}
      </div>
   );
};

// ── Page ────────────────────────────────────────────────────────────────────

const IncidenceLogDetailPage: NextPage<Props> = ({ log }) => {
   const router = useRouter();
   const [pdfOpen, setPdfOpen] = useState(false);
   const [pdfReady, setPdfReady] = useState(false);
   const printFrameRef = useRef<HTMLIFrameElement>(null);

   const openPdf = () => {
      setPdfReady(false);
      setPdfOpen(true);
   };
   const closePdf = () => {
      setPdfOpen(false);
      setPdfReady(false);
   };

   const onPrintFrameLoad = () => {
      const iframe = printFrameRef.current;
      if (!iframe?.contentWindow) return;
      window.setTimeout(() => {
         try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
         } catch {
            /* manual Print button is available as a fallback */
         }
         setPdfReady(true);
      }, 600);
   };

   const triggerManualPrint = () => {
      const iframe = printFrameRef.current;
      if (!iframe?.contentWindow) return;
      try {
         iframe.contentWindow.focus();
         iframe.contentWindow.print();
      } catch {
         /* noop */
      }
   };

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

   const totalEntries =
      (log.incidents?.length ?? 0) +
      (log.conclusions?.length ?? 0) +
      (log.actionsTaken?.length ?? 0);

   return (
      <Layout title="Incidence Log Details">
         <div className="max-w-6xl mx-auto space-y-5">
            <PageHeader
               action={
                  <div className="flex gap-2">
                     <ActionButton
                        variant="outline"
                        onClick={() => router.push('/admin/incidence-log')}
                     >
                        Back
                     </ActionButton>
                     <ActionButton variant="primary" onClick={openPdf}>
                        <span className="flex items-center gap-1.5">
                           {DOWNLOAD_ICON} Generate PDF
                        </span>
                     </ActionButton>
                  </div>
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
                  style={{
                     background:
                        'linear-gradient(90deg, #EF4444 0%, #F59E0B 50%, #10B981 100%)',
                  }}
               />
               <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                     <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 anim-icon-pop"
                        style={{
                           background: 'rgba(239, 68, 68, 0.14)',
                           border: '1px solid rgba(239, 68, 68, 0.33)',
                           color: '#EF4444',
                        }}
                     >
                        {ALERT_ICON}
                     </div>
                     <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                           <SectionLabel>Incidence Report · #{log.id}</SectionLabel>
                           <StatusChip status={String(log.status ?? 'A')} size="md" />
                           {totalEntries > 0 && (
                              <span
                                 className="text-[0.55rem] uppercase tracking-widest font-semibold px-2 py-1 rounded-md"
                                 style={{
                                    background: 'var(--surface-medium)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-default)',
                                 }}
                              >
                                 {totalEntries} total entries
                              </span>
                           )}
                        </div>
                        <h1
                           className="text-2xl md:text-3xl font-bold tracking-tight"
                           style={{ color: 'var(--text-primary)' }}
                        >
                           {log.department?.name ?? 'Incidence Report'}
                        </h1>
                        <p
                           className="text-xs md:text-sm mt-1.5"
                           style={{ color: 'var(--text-hint)' }}
                        >
                           Filed{' '}
                           <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                              {log.createdAt ? formatReadableDate(log.createdAt) : '—'}
                           </span>{' '}
                           by{' '}
                           <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                              {log.reportedBy ?? '—'}
                           </span>
                        </p>
                     </div>
                  </div>
               </div>

               {/* Meta pills row */}
               <div className="mt-5 flex flex-wrap gap-2.5">
                  <MetaPill
                     icon={CAL_ICON}
                     label="Occurred"
                     value={log.incidenceDate ? formatReadableDate(log.incidenceDate) : '—'}
                  />
                  <MetaPill
                     icon={PIN_ICON}
                     label="Location"
                     value={log.location?.name ?? '—'}
                  />
                  <MetaPill
                     icon={BUILDING_ICON}
                     label="Focus Department"
                     value={log.department?.name ?? '—'}
                  />
                  <MetaPill
                     icon={USER_ICON}
                     label="Reported By"
                     value={log.reportedBy ?? '—'}
                  />
               </div>
            </div>

            {/* ── Two-column body ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
               {/* Main content — three sections */}
               <div className="lg:col-span-2 space-y-5">
                  <SectionCard
                     title="Incident Points"
                     accent="#EF4444"
                     icon={POINTS_ICON}
                     items={log.incidents ?? []}
                     animationDelay={120}
                     emptyCopy="No incident points were recorded."
                  />
                  <SectionCard
                     title="Conclusions"
                     accent="#F59E0B"
                     icon={CONCLUSION_ICON}
                     items={log.conclusions ?? []}
                     animationDelay={240}
                     emptyCopy="No conclusions reached yet."
                  />
                  <SectionCard
                     title="Actions Taken"
                     accent="#10B981"
                     icon={ACTION_ICON}
                     items={log.actionsTaken ?? []}
                     animationDelay={360}
                     emptyCopy="No actions have been taken."
                  />
               </div>

               {/* Sidebar — reporter + audit */}
               <div className="lg:col-span-1 space-y-5">
                  <div
                     className="rounded-2xl p-5 md:p-6 anim-reveal"
                     style={{ ...CARD_STYLE, animationDelay: '180ms' }}
                  >
                     <SectionLabel accent="#1F6FB2">Reporter</SectionLabel>
                     <div className="mt-5 flex items-start gap-3">
                        <div
                           className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold tracking-wider shrink-0"
                           style={{
                              background: 'linear-gradient(135deg, #1F6FB2 0%, #0F2552 100%)',
                              color: '#ffffff',
                           }}
                        >
                           {initials(log.reportedBy) || '—'}
                        </div>
                        <div className="min-w-0 flex-1">
                           <p
                              className="text-sm font-semibold truncate"
                              style={{ color: 'var(--text-primary)' }}
                           >
                              {log.reportedBy || '—'}
                           </p>
                           <p
                              className="text-[0.65rem] uppercase tracking-widest mt-0.5"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              Filed the report
                           </p>
                        </div>
                     </div>
                  </div>

                  <div
                     className="rounded-2xl p-5 md:p-6 anim-reveal"
                     style={{ ...CARD_STYLE, animationDelay: '300ms' }}
                  >
                     <SectionLabel>Audit Trail</SectionLabel>
                     <dl className="mt-4 space-y-3 text-sm">
                        <div>
                           <dt
                              className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              Date of Report
                           </dt>
                           <dd style={{ color: 'var(--text-primary)' }}>
                              {log.createdAt ? formatReadableDate(log.createdAt) : '—'}
                           </dd>
                        </div>
                        <div>
                           <dt
                              className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              Created By
                           </dt>
                           <dd style={{ color: 'var(--text-primary)' }}>
                              {log.createdBy ?? '—'}
                           </dd>
                        </div>
                        {log.updatedAt && (
                           <div>
                              <dt
                                 className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 Last Updated
                              </dt>
                              <dd style={{ color: 'var(--text-primary)' }}>
                                 {formatReadableDate(log.updatedAt)}
                              </dd>
                           </div>
                        )}
                        {log.updatedBy && (
                           <div>
                              <dt
                                 className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 Updated By
                              </dt>
                              <dd style={{ color: 'var(--text-primary)' }}>
                                 {log.updatedBy}
                              </dd>
                           </div>
                        )}
                     </dl>
                  </div>
               </div>
            </div>
         </div>

         {/* ── PDF preview modal — loads the /print page inside an iframe
              and kicks window.print() on the iframe once images decode. ── */}
         <FullscreenModal open={pdfOpen} onClickAway={closePdf}>
            <div
               role="dialog"
               aria-modal="true"
               className="rounded-2xl shadow-2xl mx-auto flex flex-col overflow-hidden"
               style={{
                  background: 'var(--surface-paper)',
                  border: '1px solid var(--border-default)',
                  width: 'min(92vw, 920px)',
                  height: 'min(92vh, 1100px)',
               }}
            >
               <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: '1px solid var(--border-default)' }}
               >
                  <div className="min-w-0">
                     <h3
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                     >
                        PDF Preview — Report #{log.id}
                     </h3>
                     <p
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        {pdfReady
                           ? 'Use the browser dialog to save as PDF. Click Print if it closed.'
                           : 'Preparing the report…'}
                     </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                     <button
                        type="button"
                        onClick={triggerManualPrint}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer transition-colors"
                        style={{ background: 'var(--color-secondary)' }}
                     >
                        {DOWNLOAD_ICON}
                        Print
                     </button>
                     <button
                        type="button"
                        onClick={closePdf}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                        style={{
                           color: 'var(--text-secondary)',
                           border: '1px solid var(--border-strong)',
                        }}
                     >
                        Close
                     </button>
                  </div>
               </div>
               <div className="relative flex-1" style={{ background: '#f5f5f5' }}>
                  {!pdfReady && (
                     <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.02)' }}
                     >
                        <span
                           className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin"
                           style={{
                              borderColor: 'var(--color-secondary)',
                              borderTopColor: 'transparent',
                           }}
                        />
                     </div>
                  )}
                  <iframe
                     ref={printFrameRef}
                     src={`/admin/incidence-log/${log.id}/print`}
                     onLoad={onPrintFrameLoad}
                     title={`PDF preview for incidence report #${log.id}`}
                     className="w-full h-full block"
                     style={{ border: 'none', background: '#fff' }}
                  />
               </div>
            </div>
         </FullscreenModal>

         {/* ── Entrance animations (scoped to this page) ── */}
         <style jsx global>{`
            @keyframes ilg-reveal {
               0% {
                  opacity: 0;
                  transform: translateY(12px);
               }
               100% {
                  opacity: 1;
                  transform: translateY(0);
               }
            }
            @keyframes ilg-list-item {
               0% {
                  opacity: 0;
                  transform: translateX(-8px);
               }
               100% {
                  opacity: 1;
                  transform: translateX(0);
               }
            }
            @keyframes ilg-icon-pop {
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
               animation: ilg-reveal 520ms cubic-bezier(0.2, 0.65, 0.3, 1) forwards;
            }
            .anim-list-item {
               opacity: 0;
               animation: ilg-list-item 380ms cubic-bezier(0.2, 0.65, 0.3, 1) forwards;
            }
            .anim-icon-pop {
               opacity: 0;
               animation: ilg-icon-pop 520ms cubic-bezier(0.2, 0.65, 0.3, 1) 120ms forwards;
            }
            @media (prefers-reduced-motion: reduce) {
               .anim-reveal,
               .anim-list-item,
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

export default IncidenceLogDetailPage;
