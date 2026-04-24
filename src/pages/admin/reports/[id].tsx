import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { authConstants, reportConstants, userConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { useRouter } from 'next/router';
import { formatReadableDate, getObjectFromStorage } from '@/utilities/helpers';
import { formatPhoneDisplay } from '@/components/FormatValue';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import { appActions, departmentActions } from '@/actions';
import { RootState } from '@/redux/reducers';
import { AppEmitter } from '@/controllers/EventEmitter';
import { RoleId } from '@/constants/roles.constant';
import { ComboBox } from '@/components/ui/combo-box';
import ConfirmDialog from '@/components/ConfirmDialog';

const FACILITY_DEPARTMENT_NAME = 'Facility';

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
      dateResolved: string | null;
      resolvedBy: string | null;
      assignedToUserId: number | null;
      assignedAt: string | null;
   };
}

interface FacilityMember {
   id: number;
   firstName: string;
   lastName: string;
   email?: string;
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

const CheckIcon = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
   </svg>
);

const ClockIcon = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
   </svg>
);

const STATUS_COLOR: Record<string, string> = {
   Pending: '#EF4444',
   Assigned: '#F59E0B',
   'In Progress': '#F59E0B',
   Resolved: '#10B981',
   Closed: '#10B981',
};

// ── Timeline ─────────────────────────────────────────────────────────────────

interface TimelineStep {
   key: string;
   label: string;
   meta?: string;
   state: 'done' | 'current' | 'upcoming';
   accent: string;
}

const Timeline: React.FC<{ steps: TimelineStep[] }> = ({ steps }) => {
   // Once a state flips (e.g. to "done"), we briefly flag the step so the
   // dot and connector can animate into the new state.
   const [justChanged, setJustChanged] = useState<string | null>(null);
   const prevStatesRef = React.useRef<string>('');
   const signature = steps.map((s) => `${s.key}:${s.state}`).join('|');

   useEffect(() => {
      if (prevStatesRef.current && prevStatesRef.current !== signature) {
         // Find first step whose state changed — that's the one to animate.
         const prev = Object.fromEntries(
            prevStatesRef.current.split('|').map((p) => p.split(':')),
         );
         const changed = steps.find((s) => prev[s.key] !== s.state);
         if (changed) {
            setJustChanged(changed.key);
            const t = window.setTimeout(() => setJustChanged(null), 900);
            return () => window.clearTimeout(t);
         }
      }
      prevStatesRef.current = signature;
   }, [signature, steps]);

   return (
      <div>
      <ol className="relative" style={{ paddingLeft: 36 }}>
         {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const isDone = step.state === 'done';
            const isCurrent = step.state === 'current';
            const nextStep = steps[idx + 1];
            const connectorActive = isDone && nextStep && nextStep.state !== 'upcoming';
            const animate = justChanged === step.key;

            return (
               <li
                  key={step.key}
                  className="relative"
                  style={{ paddingBottom: isLast ? 0 : 28 }}
               >
                  {/* Connector — colored when the segment after a done step is
                      also active; otherwise a quiet rule. Transitions smoothly
                      when a step flips to done. */}
                  {!isLast && (
                     <span
                        aria-hidden="true"
                        className="absolute"
                        style={{
                           left: -22,
                           top: 24,
                           bottom: -4,
                           width: 2,
                           borderRadius: 2,
                           background: connectorActive
                              ? step.accent
                              : 'var(--border-default)',
                           opacity: connectorActive ? 1 : 0.8,
                           transition:
                              'background 450ms ease, opacity 450ms ease',
                        }}
                     />
                  )}

                  {/* Dot */}
                  <span
                     className="absolute flex items-center justify-center rounded-full"
                     style={{
                        left: -30,
                        top: 2,
                        width: 18,
                        height: 18,
                        background: isDone
                           ? step.accent
                           : isCurrent
                             ? 'var(--surface-paper)'
                             : 'var(--surface-medium)',
                        border: `2px solid ${
                           isDone
                              ? step.accent
                              : isCurrent
                                ? step.accent
                                : 'var(--border-default)'
                        }`,
                        color: '#ffffff',
                        transition:
                           'background 350ms ease, border-color 350ms ease, box-shadow 350ms ease, transform 350ms ease',
                        transform: animate ? 'scale(1.18)' : 'scale(1)',
                        boxShadow: isCurrent
                           ? `0 0 0 6px ${step.accent}22`
                           : animate
                             ? `0 0 0 8px ${step.accent}33`
                             : 'none',
                     }}
                  >
                     {isDone && (
                        <svg
                           width="10"
                           height="10"
                           viewBox="0 0 24 24"
                           fill="none"
                           stroke="currentColor"
                           strokeWidth="3.5"
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           style={{
                              opacity: 1,
                              transition: 'opacity 300ms ease 150ms',
                           }}
                        >
                           <polyline points="20 6 9 17 4 12" />
                        </svg>
                     )}
                     {isCurrent && (
                        <span
                           className="rounded-full"
                           style={{
                              width: 6,
                              height: 6,
                              background: step.accent,
                              animation: 'pulse-dot 1.6s ease-in-out infinite',
                           }}
                        />
                     )}
                  </span>

                  {/* Label + meta — fade + slight slide when this step animates. */}
                  <div
                     style={{
                        transition:
                           'transform 350ms ease, opacity 350ms ease',
                        transform: animate ? 'translateY(0)' : 'translateY(0)',
                     }}
                  >
                     <div
                        className="text-sm font-semibold tracking-tight"
                        style={{
                           color:
                              step.state === 'upcoming'
                                 ? 'var(--text-hint)'
                                 : 'var(--text-primary)',
                           transition: 'color 300ms ease',
                        }}
                     >
                        {step.label}
                     </div>
                     {step.meta && (
                        <div
                           className="text-xs mt-1"
                           style={{ color: 'var(--text-hint)' }}
                        >
                           {step.meta}
                        </div>
                     )}
                  </div>
               </li>
            );
         })}

      </ol>
      <style jsx>{`
         @keyframes pulse-dot {
            0%,
            100% {
               transform: scale(1);
               opacity: 1;
            }
            50% {
               transform: scale(1.35);
               opacity: 0.6;
            }
         }
      `}</style>
      </div>
   );
};

// ── Page ─────────────────────────────────────────────────────────────────────

const ReportDetailPage: NextPage<ReportDetailProps> = ({ report: initialReport }) => {
   const dispatch = useDispatch();
   const router = useRouter();
   const { userDetails } = useSelector((s: RootState) => s.user);
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);

   const [report, setReport] = useState<ComplaintDetail | null>(initialReport);
   const [facilityMembers, setFacilityMembers] = useState<FacilityMember[]>([]);
   const [assigneeId, setAssigneeId] = useState<string>('');
   const [isSaving, setIsSaving] = useState<false | 'resolve' | 'assign'>(false);
   const [showResolveConfirm, setShowResolveConfirm] = useState(false);

   const facilityDepartment = useMemo(
      () =>
         (allDepartmentsList ?? []).find(
            (d) => d.name?.toLowerCase() === FACILITY_DEPARTMENT_NAME.toLowerCase(),
         ),
      [allDepartmentsList],
   );

   // Assignment privileges: Super Admin + Facility HOD (matched by Facility
   // department's hodEmail primary, or roleId=HOD+dept=Facility as fallback).
   const facilityHodEmail = facilityDepartment?.hodEmail;
   const isSuperAdmin = userDetails?.roleId === RoleId.SUPER_ADMIN;
   const isFacilityMember =
      !!facilityDepartment && userDetails?.departmentId === facilityDepartment.id;
   const isFacilityHod =
      (!!facilityHodEmail &&
         !!userDetails?.email &&
         userDetails.email.toLowerCase() === facilityHodEmail.toLowerCase()) ||
      (isFacilityMember && userDetails?.roleId === RoleId.HOD);
   const canAssign = isFacilityHod || isSuperAdmin;

   // Resolve privileges: ONLY the user to whom this complaint is currently
   // assigned can mark it resolved. Not HOD, not Super Admin, not other
   // Facility members — only the assignee.
   const assignedToMe =
      !!report?.summary?.assignedToUserId &&
      !!userDetails?.id &&
      report.summary.assignedToUserId === userDetails.id;
   const canResolve = assignedToMe;

   const isAssigned = !!report?.summary?.assignedToUserId;

   useEffect(() => {
      if (!allDepartmentsList || allDepartmentsList.length === 0) {
         dispatch(
            departmentActions.getAllDepartments({ limit: 1000 }) as unknown as UnknownAction,
         );
      }
   }, [dispatch, allDepartmentsList]);

   /**
    * Assignee pool = every user with role=MEMBER on the app, plus the
    * Facility HOD (resolved by Facility department hodEmail). This matches
    * the product rule that any member of the Facility team can be assigned
    * a complaint — users aren't strictly scoped to departments on the app.
    *
    * We fetch regardless of canAssign because other viewers still need the
    * list to resolve the assignee's display name in the timeline + audit.
    */
   useEffect(() => {
      let cancelled = false;
      (async () => {
         try {
            const user = await getObjectFromStorage(authConstants.USER_KEY);
            const headers = {
               Accept: 'application/json',
               Authorization: user?.token ? `Bearer ${user.token}` : '',
            };

            const requests: Promise<{ items: FacilityMember[] }>[] = [
               axios
                  .get(
                     `${userConstants.USER_URI}?roleId=${RoleId.MEMBER}&limit=1000`,
                     { headers },
                  )
                  .then((r) => ({
                     items:
                        (r?.data?.data?.items ?? r?.data?.data ?? []) as FacilityMember[],
                  }))
                  .catch(() => ({ items: [] })),
            ];
            if (facilityHodEmail) {
               requests.push(
                  axios
                     .get(
                        `${userConstants.USER_URI}/details/${encodeURIComponent(
                           facilityHodEmail,
                        )}`,
                        { headers },
                     )
                     .then((r) => {
                        const hod = r?.data?.data as FacilityMember | undefined;
                        return { items: hod ? [hod] : [] };
                     })
                     .catch(() => ({ items: [] })),
               );
            }

            const results = await Promise.all(requests);
            if (cancelled) return;

            const seen = new Set<number>();
            const merged: FacilityMember[] = [];
            results
               .flatMap((r) => r.items)
               .reverse()
               .forEach((m) => {
                  if (!m?.id || seen.has(m.id)) return;
                  seen.add(m.id);
                  merged.push(m);
               });
            setFacilityMembers(merged);
         } catch {
            if (!cancelled) setFacilityMembers([]);
         }
      })();
      return () => {
         cancelled = true;
      };
   }, [facilityHodEmail]);

   const refetchReport = useCallback(async () => {
      if (!report?.id) return;
      try {
         const user = await getObjectFromStorage(authConstants.USER_KEY);
         const resp = await axios.get(
            `${reportConstants.REPORT_URI}/detail/${report.id}`,
            {
               headers: {
                  Accept: 'application/json',
                  Authorization: user?.token ? `Bearer ${user.token}` : '',
               },
            },
         );
         setReport(resp?.data?.data ?? report);
      } catch {
         /* swallow — user will see stale status, snackbar fires from caller */
      }
   }, [report]);

   const doResolve = async () => {
      if (!report?.id || isSaving) return;
      setIsSaving('resolve');
      try {
         const user = await getObjectFromStorage(authConstants.USER_KEY);
         await axios.patch(
            `${reportConstants.REPORT_URI}/${report.id}/resolve`,
            {},
            {
               headers: {
                  'Content-Type': 'application/json',
                  Authorization: user?.token ? `Bearer ${user.token}` : '',
               },
            },
         );
         dispatch(
            appActions.setSnackBar({
               type: 'success',
               message: 'Complaint resolved.',
               variant: 'success',
            }) as unknown as UnknownAction,
         );
         AppEmitter.emit(reportConstants.UPDATE_REPORT_SUCCESS, null);
         await refetchReport();
         setShowResolveConfirm(false);
      } catch {
         dispatch(
            appActions.setSnackBar({
               type: 'error',
               message: 'Failed to resolve complaint.',
               variant: 'error',
            }) as unknown as UnknownAction,
         );
      } finally {
         setIsSaving(false);
      }
   };

   const handleAssign = async () => {
      if (!report?.id || !assigneeId || isSaving) return;
      setIsSaving('assign');
      try {
         const user = await getObjectFromStorage(authConstants.USER_KEY);
         await axios.patch(
            `${reportConstants.REPORT_URI}/${report.id}/assign`,
            { userId: Number(assigneeId) },
            {
               headers: {
                  'Content-Type': 'application/json',
                  Authorization: user?.token ? `Bearer ${user.token}` : '',
               },
            },
         );
         dispatch(
            appActions.setSnackBar({
               type: 'success',
               message: 'Complaint assigned.',
               variant: 'success',
            }) as unknown as UnknownAction,
         );
         AppEmitter.emit(reportConstants.UPDATE_REPORT_SUCCESS, null);
         await refetchReport();
         setAssigneeId('');
      } catch {
         dispatch(
            appActions.setSnackBar({
               type: 'error',
               message: 'Failed to assign complaint.',
               variant: 'error',
            }) as unknown as UnknownAction,
         );
      } finally {
         setIsSaving(false);
      }
   };

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
   const statusAccent = STATUS_COLOR[complaintStatus] ?? '#EF4444';

   const assignedMember = (() => {
      const id = report.summary?.assignedToUserId;
      if (!id) return null;
      return facilityMembers.find((m) => m.id === id) ?? null;
   })();
   const assignedName = (() => {
      const id = report.summary?.assignedToUserId;
      if (!id) return null;
      if (assignedMember) {
         return (
            `${assignedMember.firstName ?? ''} ${assignedMember.lastName ?? ''}`.trim() ||
            assignedMember.email ||
            `User #${id}`
         );
      }
      return `User #${id}`;
   })();

   const timelineSteps: TimelineStep[] = [
      {
         key: 'submitted',
         label: 'Submitted',
         meta: formatReadableDate(report.complaintDate || report.createdAt),
         state: 'done',
         accent: '#1F6FB2',
      },
      {
         key: 'assigned',
         label: 'Assigned',
         meta:
            report.summary?.assignedAt && assignedName
               ? `${assignedName} · ${formatReadableDate(report.summary.assignedAt)}`
               : report.summary?.assignedAt
                 ? formatReadableDate(report.summary.assignedAt)
                 : 'Awaiting assignment',
         state: isResolved || isAssigned ? 'done' : report.summary?.assignedToUserId ? 'done' : 'upcoming',
         accent: '#F59E0B',
      },
      {
         key: 'resolved',
         label: 'Resolved',
         meta: report.summary?.dateResolved
            ? `${report.summary.resolvedBy ?? '—'} · ${formatReadableDate(
                 report.summary.dateResolved,
              )}`
            : 'Not yet resolved',
         state: isResolved ? 'done' : isAssigned ? 'current' : 'upcoming',
         accent: '#10B981',
      },
   ];

   return (
      <Layout title="Complaint Details">
         <div className="max-w-6xl mx-auto space-y-5">
            <PageHeader
               action={
                  <ActionButton variant="outline" onClick={() => router.back()}>
                     Back
                  </ActionButton>
               }
            />

            {/* ── Hero ── */}
            <div
               className="rounded-2xl p-6 md:p-7 relative overflow-hidden"
               style={CARD_STYLE}
            >
               {/* accent stripe */}
               <div
                  aria-hidden="true"
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: statusAccent }}
               />
               <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                     <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                        style={{
                           background: `${statusAccent}14`,
                           border: `1px solid ${statusAccent}33`,
                           color: statusAccent,
                        }}
                     >
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                     </div>
                     <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                           <SectionLabel>Complaint · #{report.id}</SectionLabel>
                           <SectionLabel accent={statusAccent}>
                              {complaintStatus}
                           </SectionLabel>
                           {report.summary?.attendedTo && !isResolved && (
                              <SectionLabel accent="#1F6FB2">Attended</SectionLabel>
                           )}
                        </div>
                        <h1
                           className="text-2xl md:text-3xl font-bold tracking-tight"
                           style={{ color: 'var(--text-primary)' }}
                        >
                           {report.complaintSubject || 'Complaint'}
                        </h1>
                        <p
                           className="text-xs md:text-sm mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1"
                           style={{ color: 'var(--text-hint)' }}
                        >
                           <span className="inline-flex items-center gap-1.5">
                              {ClockIcon}
                              {formatReadableDate(report.complaintDate || report.createdAt)}
                           </span>
                           <span>·</span>
                           <span>
                              by{' '}
                              <span
                                 className="font-semibold"
                                 style={{ color: 'var(--text-secondary)' }}
                              >
                                 {report.complainerName || '—'}
                              </span>
                           </span>
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* ── Two-column body ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
               {/* Left: main content */}
               <div className="lg:col-span-2 space-y-5">
                  {/* Description */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Complaint Description</SectionLabel>
                     <p
                        className="mt-4 text-sm whitespace-pre-wrap"
                        style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
                     >
                        {report.complaintDescription || '—'}
                     </p>
                  </div>

                  {/* Resolution */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                           <SectionLabel accent={statusAccent}>Resolution</SectionLabel>
                           <p
                              className="text-xs mt-2"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              Track the lifecycle of this complaint from submission to
                              resolution.
                           </p>
                        </div>
                        {canResolve && !isResolved && (
                           <button
                              type="button"
                              onClick={() => setShowResolveConfirm(true)}
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer"
                              style={{ background: '#10B981' }}
                           >
                              <span>{CheckIcon}</span>
                              Mark as Resolved
                           </button>
                        )}
                     </div>

                     <div className="mt-5">
                        <Timeline steps={timelineSteps} />
                     </div>
                  </div>

                  {/* Assign card — HOD + Super Admin only. Once the complaint
                      has been assigned, the form is replaced by a read-only
                      summary of the current assignee. */}
                  {canAssign && !isResolved && (
                     <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                        <SectionLabel accent="#F59E0B">Assign Complaint</SectionLabel>

                        {isAssigned ? (
                           <div
                              className="mt-4 flex items-center gap-4 rounded-xl p-4"
                              style={{
                                 background: 'var(--surface-medium)',
                                 border: '1px solid var(--border-default)',
                              }}
                              aria-disabled="true"
                           >
                              <div
                                 className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold tracking-wider shrink-0"
                                 style={{
                                    background:
                                       'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
                                    color: '#ffffff',
                                 }}
                              >
                                 {assignedName
                                    ? assignedName
                                         .split(/\s+/)
                                         .map((s) => s[0])
                                         .filter(Boolean)
                                         .slice(0, 2)
                                         .join('')
                                         .toUpperCase()
                                    : '—'}
                              </div>
                              <div className="min-w-0 flex-1">
                                 <div
                                    className="text-[0.6rem] uppercase tracking-widest font-semibold"
                                    style={{ color: 'var(--text-hint)' }}
                                 >
                                    Assigned to
                                 </div>
                                 <div
                                    className="text-sm font-semibold truncate mt-0.5"
                                    style={{ color: 'var(--text-primary)' }}
                                 >
                                    {assignedName ?? `User #${report.summary?.assignedToUserId}`}
                                 </div>
                                 {assignedMember?.email && (
                                    <div
                                       className="text-xs mt-0.5 truncate"
                                       style={{ color: 'var(--text-hint)' }}
                                    >
                                       {assignedMember.email}
                                    </div>
                                 )}
                                 {report.summary?.assignedAt && (
                                    <div
                                       className="text-xs mt-0.5"
                                       style={{ color: 'var(--text-hint)' }}
                                    >
                                       Assigned on{' '}
                                       {formatReadableDate(report.summary.assignedAt)}
                                    </div>
                                 )}
                              </div>
                              <span
                                 className="text-[0.55rem] font-semibold uppercase tracking-widest px-2 py-1 rounded-md shrink-0"
                                 style={{
                                    color: '#F59E0B',
                                    background: 'rgba(245,158,11,0.12)',
                                    border: '1px solid rgba(245,158,11,0.35)',
                                 }}
                              >
                                 Locked
                              </span>
                           </div>
                        ) : (
                           <>
                              <p
                                 className="text-xs mt-2 max-w-md"
                                 style={{ color: 'var(--text-hint)' }}
                              >
                                 Assign this complaint to a Facility team member (or
                                 yourself). The assignee will be emailed a link and is
                                 the only person who can mark it resolved.
                              </p>
                              <div className="mt-4 flex items-start gap-2">
                                 <div className="flex-1">
                                    <ComboBox
                                       value={assigneeId}
                                       onChange={(v) => setAssigneeId(v)}
                                       options={facilityMembers.map((m) => ({
                                          value: String(m.id),
                                          label:
                                             `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() ||
                                             m.email ||
                                             `User #${m.id}`,
                                       }))}
                                       placeholder={
                                          facilityMembers.length === 0
                                             ? 'Loading Facility team…'
                                             : 'Select a Facility team member…'
                                       }
                                       searchable
                                    />
                                 </div>
                                 <button
                                    type="button"
                                    onClick={handleAssign}
                                    disabled={!assigneeId || isSaving === 'assign'}
                                    className="shrink-0 px-4 h-[42px] rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    style={{ background: 'var(--color-secondary)' }}
                                 >
                                    {isSaving === 'assign' ? (
                                       <span className="flex items-center gap-2">
                                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          Assigning…
                                       </span>
                                    ) : (
                                       'Assign'
                                    )}
                                 </button>
                              </div>
                           </>
                        )}
                     </div>
                  )}
               </div>

               {/* Right sidebar */}
               <div className="lg:col-span-1 space-y-5">
                  {/* Complainer */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Complainer</SectionLabel>
                     <div className="mt-5 flex items-start gap-3">
                        <div
                           className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold tracking-wider shrink-0"
                           style={{
                              background: 'linear-gradient(135deg, #1F6FB2 0%, #0F2552 100%)',
                              color: '#ffffff',
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
                           <p
                              className="text-[0.65rem] uppercase tracking-widest mt-0.5"
                              style={{ color: 'var(--text-hint)' }}
                           >
                              Submitter
                           </p>
                        </div>
                     </div>

                     <div className="mt-4 space-y-2">
                        {report.complainerEmail ? (
                           <a
                              href={`mailto:${report.complainerEmail}`}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-colors hover:bg-white/5"
                              style={{
                                 background: 'var(--surface-medium)',
                                 border: '1px solid var(--border-default)',
                                 color: 'var(--text-primary)',
                              }}
                           >
                              <span style={{ color: 'var(--text-hint)' }}>{MailIcon}</span>
                              <span className="truncate">{report.complainerEmail}</span>
                           </a>
                        ) : null}
                        {report.complainerPhone ? (
                           <a
                              href={`tel:${report.complainerPhone}`}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-colors hover:bg-white/5"
                              style={{
                                 background: 'var(--surface-medium)',
                                 border: '1px solid var(--border-default)',
                                 color: 'var(--text-primary)',
                              }}
                           >
                              <span style={{ color: 'var(--text-hint)' }}>{PhoneIcon}</span>
                              <span>{formatPhoneDisplay(report.complainerPhone)}</span>
                           </a>
                        ) : null}
                     </div>
                  </div>

                  {/* Audit */}
                  <div className="rounded-2xl p-5 md:p-6" style={CARD_STYLE}>
                     <SectionLabel>Audit Trail</SectionLabel>
                     <dl className="mt-4 space-y-3 text-sm">
                        <div>
                           <dt className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'var(--text-hint)' }}>
                              Created At
                           </dt>
                           <dd style={{ color: 'var(--text-primary)' }}>
                              {formatReadableDate(report.createdAt)}
                           </dd>
                        </div>
                        {report.updatedAt && (
                           <div>
                              <dt className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'var(--text-hint)' }}>
                                 Last Updated
                              </dt>
                              <dd style={{ color: 'var(--text-primary)' }}>
                                 {formatReadableDate(report.updatedAt)}
                              </dd>
                           </div>
                        )}
                        {report.summary?.assignedAt && (
                           <div>
                              <dt className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'var(--text-hint)' }}>
                                 Assigned
                              </dt>
                              <dd style={{ color: 'var(--text-primary)' }}>
                                 {assignedName ? `${assignedName} · ` : ''}
                                 {formatReadableDate(report.summary.assignedAt)}
                              </dd>
                           </div>
                        )}
                        {report.summary?.dateResolved && (
                           <div>
                              <dt className="text-[0.6rem] uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'var(--text-hint)' }}>
                                 Resolved
                              </dt>
                              <dd style={{ color: 'var(--text-primary)' }}>
                                 {report.summary.resolvedBy
                                    ? `${report.summary.resolvedBy} · `
                                    : ''}
                                 {formatReadableDate(report.summary.dateResolved)}
                              </dd>
                           </div>
                        )}
                     </dl>
                  </div>
               </div>
            </div>
         </div>

         <ConfirmDialog
            open={showResolveConfirm}
            onClose={() => !isSaving && setShowResolveConfirm(false)}
            onConfirm={doResolve}
            title="Resolve this complaint?"
            description={
               <>
                  This will mark the complaint as <strong>Resolved</strong>, stamp
                  your name as the resolver, and email the Facility HOD a link to
                  the resolved complaint. You can&apos;t undo this from the app.
               </>
            }
            confirmLabel="Yes, resolve"
            cancelLabel="Cancel"
            tone="success"
            loading={isSaving === 'resolve'}
         />
      </Layout>
   );
};

export default ReportDetailPage;
