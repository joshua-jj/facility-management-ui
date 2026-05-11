import { useMemo } from 'react';

/**
 * Single source of truth for the complaint-detail page's gate flags.
 *
 * Mirrors `useRequestActions` (the cut-over hook for the request
 * detail page). The complaint detail page previously computed gates
 * inline — `canManageComplaints`, `isFacilityHod`, `assignedToMe`,
 * etc. — mixed with the rest of the render logic. Extracted here so:
 *
 *   - SRP: the page renders, this hook decides "who can do what".
 *   - ISP: the hook's input is a narrow `ComplaintRow` /
 *          `ComplaintActor` rather than the page's full
 *          ComplaintDetail interface, so consumers don't depend on
 *          fields they don't read.
 *   - DIP: the `can` function is injected (from usePermission), not
 *          imported — so the hook stays decoupled from the Redux
 *          store and is trivially testable with a stub. The
 *          `serverActions` argument is the swap-point between local
 *          computation and the engine-canonical verdict.
 *   - OCP: new rules slot in here without touching the page's JSX.
 *
 * The hook is pure — no state, no effects, no Redux — and returns a
 * stable object via useMemo so the page can destructure once.
 */

/** Statuses where a complaint is open for assignment / reassignment. */
const ASSIGNABLE_STATUSES: ReadonlySet<string> = new Set([
   'Pending',
   'Open',
   'Assigned',
   'In Progress',
]);

/** Statuses where the complaint is resolved or otherwise terminal. */
const TERMINAL_STATUSES: ReadonlySet<string> = new Set([
   'Resolved',
   'Closed',
   'Cancelled',
]);

/** Minimal complaint row shape this hook reads from. */
export interface ComplaintRow {
   /** Lifecycle status — driven by `summary.complaintStatus` server-side. */
   status?: string | null;
   /** The user the complaint is currently assigned to (null until assign). */
   assignedToUserId?: number | string | null;
}

/** Minimal actor shape this hook reads from. */
export interface ComplaintActor {
   id?: number | null;
}

export interface ComplaintActions {
   // Capability flags — straight from the permission service.
   readonly canAssignComplaint: boolean;
   readonly canResolveComplaint: boolean;
   readonly canManageComplaints: boolean;

   // Composite gates.
   readonly canAssign: boolean;
   readonly canResolve: boolean;

   // Identity derivation.
   readonly viewerIsAssignee: boolean;

   // Terminal-state derivation, exposed so the page doesn't recompute
   // the rule on its own.
   readonly isTerminal: boolean;
}

interface UseComplaintActionsArgs {
   complaintDetails: ComplaintRow | null | undefined;
   userDetails: ComplaintActor | null | undefined;
   /** The `can` function from usePermission — injected (DIP). */
   can: (perm: string) => boolean;
   /**
    * Workflow Rules Module (Phase 4) — server's verdict on which
    * actions the viewer can fire right now.
    *
    * When provided (non-null), the hook treats the server as
    * canonical for every gate. When `null` (the default), the hook
    * falls back to local computation — keeping the pre-Phase-4
    * behavior intact whenever the engine verdict isn't loaded yet,
    * the saga is in flight, or the environment isn't routing through
    * the engine at all.
    */
   serverActions?: ReadonlyArray<string> | null;
}

export function useComplaintActions({
   complaintDetails,
   userDetails,
   can,
   serverActions,
}: UseComplaintActionsArgs): ComplaintActions {
   return useMemo<ComplaintActions>(() => {
      const canAssignComplaint = can('complaints:assign');
      const canResolveComplaint = can('complaints:resolve');
      const canManageComplaints = can('complaints:manage');

      const status = complaintDetails?.status ?? 'Pending';
      const isTerminal = TERMINAL_STATUSES.has(status);

      const viewerIsAssignee =
         complaintDetails?.assignedToUserId != null &&
         userDetails?.id != null &&
         Number(complaintDetails.assignedToUserId) === Number(userDetails.id);

      // ─── Local-computation branch (status quo) ───
      // canAssign: capability + status is in the assignable bucket
      // and not terminal. This is "the assign panel may be opened" —
      // the page already gates "is this complaint currently assigned"
      // separately to render the locked vs. unassigned variants.
      const localCanAssign =
         canAssignComplaint && !isTerminal && ASSIGNABLE_STATUSES.has(status);

      // canResolve: capability + the complaint is currently Assigned
      // and the viewer is the assignee. The Pending->Resolved jump is
      // forbidden — must go through Assigned first.
      const localCanResolve =
         canResolveComplaint &&
         (status === 'Assigned' || status === 'In Progress') &&
         viewerIsAssignee;

      // ─── Server-canonical branch (Phase 4) ───
      // When the server has spoken, its verdict overrides local
      // computation for every gate. Byte-equivalent to the locals
      // above whenever `serverActions === null` (the default), so
      // callers that don't pass `serverActions` see exactly the
      // pre-Phase-4 behavior.
      const hasServer = serverActions != null;
      const serverCanAssign = hasServer && serverActions!.includes('assign');
      const serverCanResolve = hasServer && serverActions!.includes('resolve');

      const canAssign = hasServer ? serverCanAssign : localCanAssign;
      const canResolve = hasServer ? serverCanResolve : localCanResolve;

      return {
         canAssignComplaint,
         canResolveComplaint,
         canManageComplaints,
         canAssign,
         canResolve,
         viewerIsAssignee,
         isTerminal,
      };
   }, [complaintDetails, userDetails, can, serverActions]);
}
