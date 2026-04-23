import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { generatorConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React from 'react';
import { formatReadableDate } from '@/utilities/helpers';
import StatusChip from '@/components/StatusChip';
import PageHeader from '@/components/PageHeader';

interface GeneratorLogDetail {
   id: number;
   meeting?: { id: number; name: string };
   location?: { id: number; name: string };
   /** @deprecated use meeting.name */
   nameOfMeeting?: string;
   /** @deprecated use location.name */
   meetingLocation?: string;
   generatorType: string;
   onTime: string;
   offTime: string | null;
   hoursUsed: number | null;
   engineStartHours: string | null;
   engineOffHours: string | null;
   dieselLevelOn: string | null;
   dieselLevelOff: string | null;
   dieselUnit?: 'litres' | 'percentage' | null;
   lastServiceHour: string | null;
   nextServiceHour: string | null;
   dueForService: boolean;
   oilFilterDueForReplacement: boolean;
   lastOilFilterReplacement: string | null;
   faultDetected: boolean;
   faultDescription: string | null;
   remark: string | null;
   createdBy: string;
   createdAt: string;
   status: string;
}

interface GeneratorLogDetailProps {
   log: GeneratorLogDetail | null;
}

export const getServerSideProps: GetServerSideProps<GeneratorLogDetailProps> = async (ctx) => {
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
      const resp = await axios.get(`${generatorConstants.GENERATOR_URI}/detail/${id}`, {
         headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      });
      if (resp?.status !== 200) return { notFound: true };
      return { props: { log: resp.data?.data ?? null } };
   } catch {
      return { props: { log: null } };
   }
};

/* ── Card shell tokens mirror Dashboard + Settings ── */
const CARD_STYLE: React.CSSProperties = {
   background: 'var(--surface-low, rgba(255,255,255,0.02))',
   border: '1px solid var(--border-default)',
};

/* ── Small pill label ── */
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

/* ── KPI tile ── */
const KpiTile: React.FC<{
   label: string;
   value: React.ReactNode;
   accent?: string;
   hint?: string;
}> = ({ label, value, accent, hint }) => (
   <div
      className="rounded-xl p-4 transition-colors"
      style={{
         background: 'var(--surface-medium)',
         border: '1px solid var(--border-default)',
      }}
   >
      <div
         className="text-[0.6rem] uppercase tracking-wider font-semibold mb-2"
         style={{ color: 'var(--text-hint)' }}
      >
         {label}
      </div>
      <div
         className="text-xl md:text-2xl font-bold tabular-nums tracking-tight"
         style={{ color: accent ?? 'var(--text-primary)' }}
      >
         {value}
      </div>
      {hint && (
         <div className="text-[0.65rem] mt-1" style={{ color: 'var(--text-hint)' }}>
            {hint}
         </div>
      )}
   </div>
);

/* ── Labelled value in a clean grid row ── */
const Field: React.FC<{
   label: string;
   value?: React.ReactNode;
   mono?: boolean;
}> = ({ label, value, mono }) => (
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

const GeneratorLogDetailPage: NextPage<GeneratorLogDetailProps> = ({ log }) => {
   if (!log) {
      return (
         <Layout title="Generator Log Details">
            <div className="flex items-center justify-center h-64">
               <p className="text-sm" style={{ color: 'var(--text-hint)' }}>
                  Generator log not found.
               </p>
            </div>
         </Layout>
      );
   }

   /* Hours used derivation (seconds → 'h m') */
   const formatHoursUsed = (): string => {
      let totalSeconds: number | null = null;
      if (typeof log.hoursUsed === 'number') {
         totalSeconds = log.hoursUsed;
      } else if (log.onTime && log.offTime) {
         try {
            const diffMs =
               new Date(log.offTime).getTime() - new Date(log.onTime).getTime();
            if (Number.isFinite(diffMs) && diffMs >= 0)
               totalSeconds = Math.floor(diffMs / 1000);
         } catch {
            /* noop */
         }
      }
      if (totalSeconds == null || totalSeconds < 0) return '—';
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      return `${h}h ${m}m`;
   };

   /* Numeric-ish helpers */
   const asNum = (v: string | number | null | undefined): number | null => {
      if (v == null || v === '') return null;
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(n) ? n : null;
   };

   const engineStart = asNum(log.engineStartHours);
   const engineOff = asNum(log.engineOffHours);
   const engineDelta =
      engineStart != null && engineOff != null ? engineOff - engineStart : null;

   const dieselOn = asNum(log.dieselLevelOn);
   const dieselOff = asNum(log.dieselLevelOff);
   const dieselConsumed =
      dieselOn != null && dieselOff != null ? dieselOn - dieselOff : null;
   const dieselUnitLabel = log.dieselUnit === 'percentage' ? '%' : 'L';
   const dieselUnitFull = log.dieselUnit === 'percentage' ? 'Percentage' : 'Litres';

   const nextService = asNum(log.nextServiceHour);
   const hoursUntilService =
      nextService != null && engineOff != null ? nextService - engineOff : null;

   /* Alert state aggregation */
   const hasAlerts =
      log.dueForService || log.faultDetected || log.oilFilterDueForReplacement;

   const serviceAccent = log.dueForService
      ? '#EF4444'
      : hoursUntilService != null && hoursUntilService <= 48
        ? '#F59E0B'
        : '#10B981';

   return (
      <Layout title="Generator Log Details">
         <div className="max-w-6xl mx-auto space-y-5">
            <PageHeader title="Generator Log Details" subtitle={`Log #${log.id}`} />

            {/* ── Hero card ── */}
            <div className="rounded-2xl p-6 md:p-7" style={CARD_STYLE}>
               <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="min-w-0">
                     <div className="flex items-center gap-2 mb-2">
                        <SectionLabel>Generator Log · #{log.id}</SectionLabel>
                        <StatusChip status={String(log.status ?? 'A')} size="md" />
                     </div>
                     <h1
                        className="text-2xl md:text-3xl font-bold tracking-tight truncate"
                        style={{ color: 'var(--text-primary)' }}
                     >
                        {log.meeting?.name ?? log.nameOfMeeting ?? 'Generator Log'}
                     </h1>
                     <p
                        className="text-xs md:text-sm mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        <span
                           className="font-semibold"
                           style={{ color: 'var(--text-secondary)' }}
                        >
                           {log.generatorType}
                        </span>
                        <span>·</span>
                        <span>{log.location?.name ?? log.meetingLocation ?? '—'}</span>
                        <span>·</span>
                        <span>Logged by {log.createdBy}</span>
                     </p>
                  </div>
                  {hasAlerts && (
                     <div className="flex flex-wrap gap-2 lg:justify-end">
                        {log.dueForService && (
                           <SectionLabel accent="#EF4444">Due For Service</SectionLabel>
                        )}
                        {log.faultDetected && (
                           <SectionLabel accent="#F97316">Fault Detected</SectionLabel>
                        )}
                        {log.oilFilterDueForReplacement && (
                           <SectionLabel accent="#F59E0B">Oil Filter Due</SectionLabel>
                        )}
                     </div>
                  )}
               </div>

               {/* KPI strip inside the hero */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
                  <KpiTile
                     label="Hours Used"
                     value={formatHoursUsed()}
                     hint={
                        log.onTime && log.offTime
                           ? 'On → Off duration'
                           : log.onTime
                             ? 'Still running'
                             : undefined
                     }
                  />
                  <KpiTile
                     label="Engine Run"
                     value={engineDelta != null ? `${engineDelta.toFixed(1)} hrs` : '—'}
                     hint={
                        engineStart != null && engineOff != null
                           ? `${engineStart} → ${engineOff}`
                           : 'No reading'
                     }
                  />
                  <KpiTile
                     label={`Diesel Consumed (${dieselUnitFull})`}
                     value={
                        dieselConsumed != null
                           ? `${dieselConsumed.toFixed(0)} ${dieselUnitLabel}`
                           : '—'
                     }
                     hint={
                        dieselOn != null && dieselOff != null
                           ? `${dieselOn} → ${dieselOff} ${dieselUnitLabel}`
                           : 'No reading'
                     }
                  />
                  <KpiTile
                     label="Service Status"
                     value={
                        log.dueForService
                           ? 'Due Now'
                           : hoursUntilService != null
                             ? `${Math.max(0, Math.round(hoursUntilService))} hrs left`
                             : 'Not tracked'
                     }
                     accent={serviceAccent}
                     hint={
                        nextService != null
                           ? `Next at ${nextService} hrs`
                           : undefined
                     }
                  />
               </div>
            </div>

            {/* ── 2-column layout below hero ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
               {/* Left column (3/5) — Timing + Engine & Fuel */}
               <div className="lg:col-span-3 space-y-5">
                  {/* Timing */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <div className="flex items-center justify-between mb-5">
                        <SectionLabel>Timing</SectionLabel>
                        <span
                           className="text-[0.65rem] tabular-nums"
                           style={{ color: 'var(--text-hint)' }}
                        >
                           Duration {formatHoursUsed()}
                        </span>
                     </div>

                     {/* On → Off timeline */}
                     <div className="flex items-stretch gap-3">
                        <div className="flex-1">
                           <div
                              className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1.5"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              On Time
                           </div>
                           <div
                              className="rounded-lg p-3 flex items-start gap-2"
                              style={{
                                 background: 'var(--surface-medium)',
                                 border: '1px solid var(--border-default)',
                              }}
                           >
                              <span
                                 className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                                 style={{ background: '#10B981' }}
                              />
                              <span
                                 className="text-sm font-medium"
                                 style={{ color: 'var(--text-primary)' }}
                              >
                                 {log.onTime ? formatReadableDate(log.onTime) : '—'}
                              </span>
                           </div>
                        </div>
                        <div
                           className="flex items-center text-xl"
                           style={{ color: 'var(--text-hint)' }}
                           aria-hidden
                        >
                           →
                        </div>
                        <div className="flex-1">
                           <div
                              className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1.5"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              Off Time
                           </div>
                           <div
                              className="rounded-lg p-3 flex items-start gap-2"
                              style={{
                                 background: 'var(--surface-medium)',
                                 border: '1px solid var(--border-default)',
                              }}
                           >
                              <span
                                 className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                                 style={{
                                    background: log.offTime ? '#EF4444' : 'var(--text-hint)',
                                 }}
                              />
                              <span
                                 className="text-sm font-medium"
                                 style={{
                                    color: log.offTime ? 'var(--text-primary)' : 'var(--text-hint)',
                                 }}
                              >
                                 {log.offTime ? formatReadableDate(log.offTime) : 'Still running'}
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Engine & Fuel readings */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <div className="flex items-center justify-between mb-4">
                        <SectionLabel>Engine &amp; Fuel</SectionLabel>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        <Field
                           label="Engine Start Hours"
                           value={log.engineStartHours}
                           mono
                        />
                        <Field
                           label="Engine Off Hours"
                           value={log.engineOffHours}
                           mono
                        />
                        <Field
                           label={`Diesel Level On (${dieselUnitLabel})`}
                           value={log.dieselLevelOn != null ? `${log.dieselLevelOn} ${dieselUnitLabel}` : undefined}
                           mono
                        />
                        <Field
                           label={`Diesel Level Off (${dieselUnitLabel})`}
                           value={log.dieselLevelOff != null ? `${log.dieselLevelOff} ${dieselUnitLabel}` : undefined}
                           mono
                        />
                     </div>
                  </div>

                  {/* Remarks & Faults */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <div className="flex items-center justify-between mb-4">
                        <SectionLabel accent={log.faultDetected ? '#EF4444' : undefined}>
                           Remarks &amp; Faults
                        </SectionLabel>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        <Field
                           label="Fault Detected"
                           value={<StatusChip status={log.faultDetected ? 'yes' : 'no'} />}
                        />
                        <Field
                           label="Due For Service"
                           value={<StatusChip status={log.dueForService ? 'yes' : 'no'} />}
                        />
                     </div>
                     <div className="mt-2">
                        <Field label="Fault Description" value={log.faultDescription} />
                        <Field label="Remark" value={log.remark} />
                     </div>
                  </div>
               </div>

               {/* Right column (2/5) — Service schedule + Audit */}
               <div className="lg:col-span-2 space-y-5">
                  {/* Service Schedule */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel accent={serviceAccent}>Service Schedule</SectionLabel>
                     <div className="mt-5">
                        <div
                           className="text-[0.6rem] uppercase tracking-wider font-semibold mb-1"
                           style={{ color: 'var(--text-hint)' }}
                        >
                           Remaining
                        </div>
                        <div
                           className="text-3xl font-bold tabular-nums tracking-tight"
                           style={{ color: serviceAccent }}
                        >
                           {log.dueForService
                              ? 'Due Now'
                              : hoursUntilService != null
                                ? `${Math.max(0, Math.round(hoursUntilService))} hrs`
                                : '—'}
                        </div>
                        <div
                           className="text-[0.7rem] mt-1"
                           style={{ color: 'var(--text-hint)' }}
                        >
                           {nextService != null
                              ? `Next service at ${nextService} hours`
                              : 'No service schedule set'}
                        </div>
                     </div>

                     <div
                        className="mt-5 pt-4 grid grid-cols-2 gap-3"
                        style={{ borderTop: '1px solid var(--border-default)' }}
                     >
                        <Field
                           label="Last Service"
                           value={log.lastServiceHour ? `${log.lastServiceHour} hrs` : undefined}
                           mono
                        />
                        <Field
                           label="Next Service"
                           value={log.nextServiceHour ? `${log.nextServiceHour} hrs` : undefined}
                           mono
                        />
                        <Field
                           label="Oil Filter Due"
                           value={
                              <StatusChip
                                 status={log.oilFilterDueForReplacement ? 'yes' : 'no'}
                              />
                           }
                        />
                        <Field
                           label="Last Oil Filter"
                           value={
                              log.lastOilFilterReplacement
                                 ? formatReadableDate(log.lastOilFilterReplacement)
                                 : undefined
                           }
                        />
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

export default GeneratorLogDetailPage;
