import { GetServerSideProps, NextPage } from 'next';
import { incidenceLogConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React, { useEffect } from 'react';
import Image from 'next/image';
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

/**
 * Print-friendly layout that mirrors the sample Facility Incident Report PDF.
 * Users trigger this page from the detail view; we auto-open the browser
 * print dialog so they can save as PDF. Zero dependencies.
 */
const PrintPage: NextPage<Props> = ({ log }) => {
   useEffect(() => {
      if (!log) return;
      let cancelled = false;
      const triggerPrint = () => {
         if (!cancelled) window.print();
      };

      // Wait for every image on the page (e.g. the logo) to finish decoding
      // before opening the dialog — otherwise the PDF can render blank spots.
      const images = Array.from(document.images);
      if (images.length === 0 || images.every((img) => img.complete)) {
         const t = setTimeout(triggerPrint, 300);
         return () => {
            cancelled = true;
            clearTimeout(t);
         };
      }

      let pending = images.filter((img) => !img.complete).length;
      const onDone = () => {
         pending -= 1;
         if (pending <= 0) triggerPrint();
      };
      images.forEach((img) => {
         if (!img.complete) {
            img.addEventListener('load', onDone);
            img.addEventListener('error', onDone);
         }
      });
      const fallback = setTimeout(triggerPrint, 2500);
      return () => {
         cancelled = true;
         clearTimeout(fallback);
         images.forEach((img) => {
            img.removeEventListener('load', onDone);
            img.removeEventListener('error', onDone);
         });
      };
   }, [log]);

   if (!log) {
      return (
         <div style={{ padding: 40, fontFamily: 'Georgia, serif' }}>
            Incidence log not found.
         </div>
      );
   }

   const dateStr = log.incidenceDate
      ? new Date(log.incidenceDate).toLocaleDateString('en-GB', {
           day: 'numeric',
           month: 'long',
           year: 'numeric',
        })
      : '—';
   const reportDate = log.createdAt
      ? formatOrdinalDate(new Date(log.createdAt))
      : '—';

   return (
      <>
         <style jsx global>{`
            @page {
               size: A4;
               margin: 20mm;
            }
            @media print {
               body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  background: #fff !important;
               }
               .no-print { display: none !important; }
            }
            html, body {
               background: #fff;
            }
         `}</style>
         <div
            style={{
               maxWidth: 780,
               margin: '0 auto',
               padding: '24px 32px 48px',
               fontFamily: 'Georgia, "Times New Roman", serif',
               color: '#0F2552',
               background: '#fff',
               fontSize: 12,
               lineHeight: 1.55,
            }}
         >
            {/* Logo (centred) */}
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
               <Image
                  src="/assets/images/egfm-logo.png"
                  alt="EGFM"
                  width={72}
                  height={72}
                  priority
               />
            </div>

            {/* Title */}
            <h1
               style={{
                  textAlign: 'center',
                  color: '#1F6FB2',
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 20,
               }}
            >
               Facility Management Incident Report
            </h1>

            {/* Metadata */}
            <div style={{ marginBottom: 18 }}>
               <div>Date: {dateStr}</div>
               <div>Location: {log.location?.name ?? '—'}</div>
               <div>Department: {log.department?.name ?? '—'}</div>
            </div>

            <Section title="1. Incident Points" items={log.incidents ?? []} />
            <Section title="2. Conclusions" items={log.conclusions ?? []} />
            <Section title="3. Actions Taken" items={log.actionsTaken ?? []} />

            <div style={{ marginTop: 32 }}>
               <div>Reported By: {log.reportedBy ?? '—'}</div>
               <div>Date of Report: {reportDate}</div>
            </div>

            {/* Print-only: hidden on screen, the user already has a button */}
            <div className="no-print" style={{ marginTop: 32, textAlign: 'center' }}>
               <button
                  onClick={() => window.print()}
                  style={{
                     padding: '10px 24px',
                     fontSize: 13,
                     fontWeight: 600,
                     border: '1px solid #1F6FB2',
                     background: '#1F6FB2',
                     color: '#fff',
                     borderRadius: 8,
                     cursor: 'pointer',
                  }}
               >
                  Open print dialog
               </button>
               <p style={{ fontSize: 11, color: '#888', marginTop: 10 }}>
                  In the print dialog, select <strong>Save as PDF</strong> as the destination.
               </p>
            </div>
         </div>
      </>
   );
};

const Section: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
   <div style={{ marginBottom: 16 }}>
      <h2 style={{ color: '#1F6FB2', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
         {title}
      </h2>
      {items && items.length > 0 ? (
         <ol style={{ marginLeft: 20, paddingLeft: 0 }}>
            {items.map((item, idx) => (
               <li key={idx} style={{ marginBottom: 6 }}>
                  {item}
               </li>
            ))}
         </ol>
      ) : (
         <p style={{ marginLeft: 20 }}>—</p>
      )}
   </div>
);

function formatOrdinalDate(d: Date): string {
   const day = d.getDate();
   const month = d.toLocaleDateString('en-GB', { month: 'long' });
   const year = d.getFullYear();
   const suffix = (() => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
         case 1:
            return 'st';
         case 2:
            return 'nd';
         case 3:
            return 'rd';
         default:
            return 'th';
      }
   })();
   return `${day}${suffix}, ${month} ${year}`;
}

export default PrintPage;
