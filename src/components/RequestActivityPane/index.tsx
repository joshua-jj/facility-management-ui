import React, { useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

/**
 * Activity-pane row payload. Loosely typed because the page's local
 * `RequestDetails` interface only enumerates a subset of the audit
 * fields the API actually returns. Using `Partial<...>` here lets the
 * pane consume the richer audit shape (createdAt / createdBy /
 * dateAssigned / assigner / collectedBy / completedBy) without forcing
 * a refactor of the page-level interface.
 */
export interface ActivityRequestAudit {
   assigneeName?: string | null;
   assigner?: string | null;
   dateAssigned?: string | null;
   collectedDate?: string | null;
   collectedBy?: string | null;
   completedDate?: string | null;
   completedBy?: string | null;
   approvedByUserId?: number | null;
   approvedByName?: string | null;
   approvedAt?: string | null;
   declinedByUserId?: number | null;
   declinedByName?: string | null;
   declinedAt?: string | null;
   declineReason?: string | null;
}

export interface ActivityRequest {
   id?: number;
   createdAt?: string | null;
   createdBy?: string | null;
   requestStatus?: string;
   fulfillingDepartmentId?: number | null;
   fulfillingDepartmentName?: string | null;
   audit?: ActivityRequestAudit;
   children?: ActivityRequest[];
   parent?: ActivityRequest;
}

export interface RequestActivityPaneProps {
   request: ActivityRequest;
   className?: string;
   /**
    * Controlled collapse state. When provided, the pane operates in
    * controlled mode and the parent owns the grid-column width. When
    * omitted the pane manages its own state via localStorage.
    */
   collapsed?: boolean;
   /** Required only when `collapsed` is provided. */
   onToggle?: () => void;
}

const COLLAPSE_STORAGE_KEY = 'request.activityPane.collapsed';

/**
 * Read + persist activity-pane collapse preference. Page-level callers
 * can mount this hook to drive their grid template; the pane reads the
 * same key when it's running uncontrolled. Returns [collapsed, toggle].
 */
export const useActivityPaneCollapsed = (): [boolean, () => void] => {
   const [collapsed, setCollapsed] = React.useState(false);
   React.useEffect(() => {
      try {
         const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
         if (stored === '1') setCollapsed(true);
      } catch {
         /* ignore */
      }
   }, []);
   const toggle = React.useCallback(() => {
      setCollapsed((c) => {
         const next = !c;
         try {
            window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? '1' : '0');
         } catch {
            /* ignore */
         }
         return next;
      });
   }, []);
   return [collapsed, toggle];
};

type EventKind = 'created' | 'approved' | 'declined' | 'assigned' | 'collected' | 'returned';

interface TimelineEvent {
   id: string;
   kind: EventKind;
   actor: string;
   verb: string;
   context?: string;
   detail?: string;
   timestamp: string; // ISO
}

/**
 * Resolve an actor name with the same fallback policy as the rest of
 * the page: prefer the API-provided name, fall back to a `(user #ID)`
 * stub, then to "—".
 */
const resolveActor = (
   name?: string | null,
   id?: number | null,
   fallback: string = '—',
): string => {
   if (name && String(name).trim().length > 0) return String(name);
   if (id != null) return `(user #${id})`;
   return fallback;
};

const departmentLabel = (row: ActivityRequest): string => {
   if (row.fulfillingDepartmentName && row.fulfillingDepartmentName.trim().length > 0) {
      return row.fulfillingDepartmentName;
   }
   if (row.fulfillingDepartmentId != null) return `Dept #${row.fulfillingDepartmentId}`;
   return 'sub-request';
};

/**
 * Relative time, modeled on `formatRelative` in
 * `src/components/ui/notifications-menu.tsx`. Uses absolute date for
 * anything older than a week.
 */
const formatRelative = (iso: string): string => {
   const now = Date.now();
   const ts = new Date(iso).getTime();
   if (Number.isNaN(ts)) return '';
   const diffSec = Math.max(0, Math.round((now - ts) / 1000));
   if (diffSec < 60) return 'just now';
   const diffMin = Math.round(diffSec / 60);
   if (diffMin < 60) return `${diffMin}m ago`;
   const diffHr = Math.round(diffMin / 60);
   if (diffHr < 24) return `${diffHr}h ago`;
   const diffDay = Math.round(diffHr / 24);
   if (diffDay === 1) return 'Yesterday';
   if (diffDay < 7) return `${diffDay}d ago`;
   return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
   });
};

/**
 * Absolute timestamp, e.g. "May 5, 2026, 3:30 pm". Lower-case meridiem
 * to match the casual ClickUp-style timeline.
 */
const formatAbsolute = (iso: string): string => {
   const date = new Date(iso);
   if (Number.isNaN(date.getTime())) return '';
   const formatted = date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
   });
   return formatted.replace(/\s(AM|PM)$/i, (_m, ap: string) => ` ${ap.toLowerCase()}`);
};

/**
 * Derive a chronological event timeline from the row's audit fields.
 *
 * - Parent rows: aggregate each child's approve/decline events along
 *   with the row's own creation, assignment, collection, completion.
 * - Child rows: only the child's own events plus its creation. Sibling
 *   events live on the parent's view.
 * - Flat rows: created + own approve/decline + assigned + collected +
 *   returned.
 */
const deriveEvents = (request: ActivityRequest): TimelineEvent[] => {
   if (!request) return [];

   const events: TimelineEvent[] = [];
   const isParent = Array.isArray(request.children) && request.children.length > 0;
   const audit = request.audit ?? {};

   // Created — applies to every shape.
   if (request.createdAt) {
      events.push({
         id: `created-${request.id ?? 'self'}`,
         kind: 'created',
         actor: resolveActor(request.createdBy, null, 'System'),
         verb: 'created the request',
         timestamp: request.createdAt,
      });
   }

   if (isParent) {
      // For a parent, surface each child's HOD action in the timeline.
      (request.children ?? []).forEach((child) => {
         const childAudit = child.audit ?? {};
         const ctx = `${departmentLabel(child)} sub-request`;
         if (childAudit.approvedAt) {
            events.push({
               id: `approved-child-${child.id ?? Math.random()}`,
               kind: 'approved',
               actor: resolveActor(childAudit.approvedByName, childAudit.approvedByUserId),
               verb: 'approved',
               context: ctx,
               timestamp: childAudit.approvedAt,
            });
         }
         if (childAudit.declinedAt) {
            events.push({
               id: `declined-child-${child.id ?? Math.random()}`,
               kind: 'declined',
               actor: resolveActor(childAudit.declinedByName, childAudit.declinedByUserId),
               verb: 'declined',
               context: ctx,
               detail: childAudit.declineReason ? `"${childAudit.declineReason}"` : undefined,
               timestamp: childAudit.declinedAt,
            });
         }
      });
   } else {
      // Flat row OR child detail view. Either way the row's own
      // approve / decline lives on its own audit.
      if (audit.approvedAt) {
         events.push({
            id: `approved-self-${request.id ?? 'self'}`,
            kind: 'approved',
            actor: resolveActor(audit.approvedByName, audit.approvedByUserId),
            verb: 'approved',
            context: request.parent ? `${departmentLabel(request)} sub-request` : 'the request',
            timestamp: audit.approvedAt,
         });
      }
      if (audit.declinedAt) {
         events.push({
            id: `declined-self-${request.id ?? 'self'}`,
            kind: 'declined',
            actor: resolveActor(audit.declinedByName, audit.declinedByUserId),
            verb: 'declined',
            context: request.parent ? `${departmentLabel(request)} sub-request` : 'the request',
            detail: audit.declineReason ? `"${audit.declineReason}"` : undefined,
            timestamp: audit.declinedAt,
         });
      }
   }

   // Assigned — meaningful on flat / parent rows. (Children never
   // advance past approve/decline.)
   if (audit.dateAssigned) {
      const assignee = audit.assigneeName && audit.assigneeName.trim().length > 0
         ? audit.assigneeName
         : null;
      events.push({
         id: `assigned-${request.id ?? 'self'}`,
         kind: 'assigned',
         actor: resolveActor(audit.assigner, null, 'A super-admin'),
         verb: assignee ? `assigned ${assignee}` : 'assigned the request',
         timestamp: audit.dateAssigned,
      });
   }

   // Collected.
   if (audit.collectedDate) {
      events.push({
         id: `collected-${request.id ?? 'self'}`,
         kind: 'collected',
         actor: resolveActor(audit.collectedBy, null, audit.assigneeName ?? 'The assignee'),
         verb: 'collected the request',
         timestamp: audit.collectedDate,
      });
   }

   // Completed / Returned.
   if (audit.completedDate) {
      events.push({
         id: `completed-${request.id ?? 'self'}`,
         kind: 'returned',
         actor: resolveActor(audit.completedBy, null, audit.assigneeName ?? 'The assignee'),
         verb: 'returned the request',
         timestamp: audit.completedDate,
      });
   }

   // Sort ascending. Drop anything without a parseable timestamp.
   return events
      .filter((e) => !!e.timestamp && !Number.isNaN(new Date(e.timestamp).getTime()))
      .sort(
         (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
};

/** Color tokens per event kind — matches the rest of the page. */
const dotClassFor = (kind: EventKind): string => {
   switch (kind) {
      case 'created':
         return 'bg-sky-500 ring-sky-500/20';
      case 'approved':
         return 'bg-emerald-500 ring-emerald-500/20';
      case 'declined':
         return 'bg-red-500 ring-red-500/20';
      case 'assigned':
         return 'bg-amber-500 ring-amber-500/20';
      case 'collected':
      case 'returned':
      default:
         return 'bg-slate-400 ring-slate-400/20';
   }
};

const TimelineRow: React.FC<{ event: TimelineEvent; isLast: boolean }> = ({ event, isLast }) => {
   const initial = event.actor.charAt(0).toUpperCase() || '·';
   const relative = formatRelative(event.timestamp);
   const absolute = formatAbsolute(event.timestamp);

   return (
      <li className="relative pl-7 pb-4">
         {/* Vertical connector. Skip on last row. */}
         {!isLast && (
            <span
               aria-hidden
               className="absolute left-[10px] top-3.5 bottom-0 w-px"
               style={{ background: 'var(--border-default, rgba(15,37,82,0.12))' }}
            />
         )}
         {/* Dot */}
         <span
            aria-hidden
            className={`absolute left-1.5 top-1.5 w-2.5 h-2.5 rounded-full ring-4 ${dotClassFor(event.kind)}`}
         />
         <div className="flex items-start gap-2.5">
            <Avatar className="size-7 shrink-0">
               <AvatarFallback className="text-[0.65rem] font-semibold bg-[#0F2552]/8 text-[#0F2552] dark:bg-white/10 dark:text-white/85">
                  {initial}
               </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
               <p className="text-sm leading-snug text-[#0F2552] dark:text-white/85">
                  <span className="font-semibold">{event.actor}</span>{' '}
                  <span className="text-[#0F2552]/75 dark:text-white/65">{event.verb}</span>
                  {event.context && (
                     <>
                        {' '}
                        <span className="text-[#0F2552]/75 dark:text-white/65">{event.context}</span>
                     </>
                  )}
                  {event.detail && (
                     <>
                        {' — '}
                        <span
                           className="italic"
                           style={{ color: 'var(--text-secondary, #5a6478)' }}
                        >
                           {event.detail}
                        </span>
                     </>
                  )}
               </p>
               <p
                  className="text-[0.7rem] mt-0.5 tabular-nums"
                  style={{ color: 'var(--text-hint, rgba(15,37,82,0.55))' }}
               >
                  {relative}
                  {relative && absolute ? ' · ' : ''}
                  {absolute}
               </p>
            </div>
         </div>
      </li>
   );
};

const ActivityPaneBody: React.FC<{ events: TimelineEvent[] }> = ({ events }) => {
   if (events.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div
               className="rounded-full p-3 mb-3"
               style={{ background: 'var(--surface-low, rgba(15,37,82,0.04))' }}
            >
               <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--text-hint, rgba(15,37,82,0.45))' }}
               >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
               </svg>
            </div>
            <p
               className="text-xs"
               style={{ color: 'var(--text-hint, rgba(15,37,82,0.55))' }}
            >
               No activity yet.
            </p>
         </div>
      );
   }

   return (
      <ol className="relative px-4 py-3">
         {events.map((event, idx) => (
            <TimelineRow
               key={event.id}
               event={event}
               isLast={idx === events.length - 1}
            />
         ))}
      </ol>
   );
};

const PaneHeader: React.FC<{
   count: number;
   collapsed: boolean;
   onToggle: () => void;
}> = ({ count, collapsed, onToggle }) => (
   <div
      className="flex items-center justify-between px-3 py-3 border-b"
      style={{ borderColor: 'var(--border-default, rgba(15,37,82,0.12))' }}
   >
      <button
         type="button"
         onClick={onToggle}
         className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-[var(--surface-low,rgba(15,37,82,0.06))] cursor-pointer"
         aria-label={collapsed ? 'Expand activity pane' : 'Collapse activity pane'}
         title={collapsed ? 'Expand' : 'Collapse'}
      >
         <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-3.5 h-3.5 text-[#0F2552] dark:text-white/80 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
         >
            <polyline points="10 4 6 8 10 12" />
         </svg>
      </button>
      {!collapsed && (
         <>
            <h3 className="text-sm font-semibold text-[#0F2552] dark:text-white/90 tracking-[-0.006em] flex-1 ml-2">
               Activity
            </h3>
            <span
               className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full tabular-nums"
               style={{
                  background: 'var(--surface-low, rgba(15,37,82,0.06))',
                  color: 'var(--text-hint, rgba(15,37,82,0.6))',
               }}
            >
               {count}
            </span>
         </>
      )}
   </div>
);

/**
 * Right-side activity timeline for the request detail page. On `lg:`
 * and up the parent renders this as a sticky column. On smaller
 * breakpoints the parent renders it inside a slide-in drawer.
 *
 * Can run controlled (page passes `collapsed` + `onToggle`, owning the
 * grid-column width) or uncontrolled (the pane reads/writes
 * localStorage itself).
 */
const RequestActivityPane: React.FC<RequestActivityPaneProps> = ({
   request,
   className,
   collapsed: collapsedProp,
   onToggle: onToggleProp,
}) => {
   const events = useMemo(() => deriveEvents(request), [request]);
   const [internalCollapsed, internalToggle] = useActivityPaneCollapsed();
   const collapsed = collapsedProp ?? internalCollapsed;
   const toggle = onToggleProp ?? internalToggle;

   return (
      <aside
         data-collapsed={collapsed}
         className={`bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden flex flex-col transition-[width] duration-300 ease-out ${
            collapsed ? 'w-12' : 'w-full'
         } ${className ?? ''}`}
      >
         <PaneHeader count={events.length} collapsed={collapsed} onToggle={toggle} />
         {/* Vertical "Activity" label + count badge while collapsed —
              keeps the strip recognisable without dominating the screen. */}
         {collapsed ? (
            <button
               type="button"
               onClick={toggle}
               aria-label="Expand activity pane"
               className="flex-1 flex flex-col items-center justify-start gap-2 pt-3 cursor-pointer hover:bg-[var(--surface-low,rgba(15,37,82,0.04))] transition-colors"
            >
               <span
                  className="text-[0.65rem] font-semibold px-1.5 py-0.5 rounded-full tabular-nums"
                  style={{
                     background: 'var(--surface-low, rgba(15,37,82,0.06))',
                     color: 'var(--text-hint, rgba(15,37,82,0.6))',
                  }}
               >
                  {events.length}
               </span>
               <span
                  className="text-[0.7rem] font-semibold tracking-wider text-[#0F2552] dark:text-white/80"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
               >
                  ACTIVITY
               </span>
            </button>
         ) : (
            <div className="flex-1 overflow-y-auto">
               <ActivityPaneBody events={events} />
            </div>
         )}
      </aside>
   );
};

export default RequestActivityPane;

/**
 * Mobile/tablet drawer wrapper for the activity pane. Keeps the same
 * timeline content but renders it as a right-side slide-in. Trigger
 * lives in the page; this component is just the panel + backdrop.
 */
export const RequestActivityDrawer: React.FC<{
   open: boolean;
   onClose: () => void;
   request: ActivityRequest;
}> = ({ open, onClose, request }) => {
   return (
      <>
         {/* Backdrop */}
         <div
            aria-hidden
            onClick={onClose}
            className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
         />
         {/* Panel */}
         <div
            role="dialog"
            aria-label="Request activity"
            aria-hidden={!open}
            className={`fixed top-0 right-0 z-50 h-full w-[min(92vw,360px)] bg-white dark:bg-[#0F2552] shadow-xl border-l border-gray-100 dark:border-white/10 flex flex-col transition-transform duration-200 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
         >
            <div
               className="flex items-center justify-between px-4 py-3 border-b"
               style={{ borderColor: 'var(--border-default, rgba(15,37,82,0.12))' }}
            >
               <h3 className="text-sm font-semibold text-[#0F2552] dark:text-white/90 tracking-[-0.006em]">
                  Activity
               </h3>
               <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close activity"
                  className="p-1 rounded-md hover:bg-[#0F2552]/5 dark:hover:bg-white/10 transition-colors text-[#0F2552] dark:text-white/85"
               >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <line x1="18" y1="6" x2="6" y2="18" />
                     <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
               </button>
            </div>
            <div className="flex-1 overflow-y-auto">
               <RequestActivityPane request={request} className="border-0 shadow-none rounded-none" />
            </div>
         </div>
      </>
   );
};

/**
 * Toggle button for the mobile/tablet drawer. Renders a pill-shaped
 * affordance with an event count badge.
 */
export const ActivityToggleButton: React.FC<{
   onClick: () => void;
   count: number;
   className?: string;
}> = ({ onClick, count, className }) => (
   <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${className ?? ''}`}
      style={{
         background: 'var(--surface-low, rgba(15,37,82,0.04))',
         borderColor: 'var(--border-default, rgba(15,37,82,0.12))',
         color: 'var(--text-primary, #0F2552)',
      }}
      aria-label="Open activity panel"
   >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <circle cx="12" cy="12" r="9" />
         <polyline points="12 7 12 12 15 14" />
      </svg>
      Activity
      {count > 0 && (
         <span
            className="ml-0.5 text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full tabular-nums"
            style={{
               background: 'var(--color-secondary, #B28309)',
               color: '#fff',
            }}
         >
            {count}
         </span>
      )}
   </button>
);
