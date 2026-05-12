import { useMemo } from 'react';
import { Permission } from '@/constants/permissions.enum';

/**
 * Single source of truth for the complaint-detail page's gate flags.
 *
 * Phase 7 (workflow rules cleanup) made the server canonical for the
 * composite gates. Three categories live here now:
 *
 *   1. Capability flags (`canAssignComplaint`, `canResolveComplaint`,
 *      `canManageComplaints`) come from the UI's permission service
 *      (`can(...)`), fed from the JWT. Subject-level grants, not
 *      state-dependent transitions.
 *
 *   2. Data derivations (`viewerIsAssignee`, `isTerminal`) are pure
 *      projections of `complaintDetails`. No engine involvement.
 *
 *   3. Composite gates (`canAssign`, `canResolve`) are server-
 *      canonical. The hook reads them from `serverActions`. When
 *      `serverActions` is null (loading, not yet dispatched, or fetch
 *      failed), the hook returns deny-by-default — every composite
 *      gate is `false`.
 *
 * SRP: the page renders, this hook decides "who can do what".
 * ISP: the hook's input is a narrow `ComplaintRow` / `ComplaintActor`
 *      rather than the page's full ComplaintDetail interface.
 * DIP: `can` and `serverActions` are injected — the hook never
 *      reaches into Redux or fetches the engine itself.
 */

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
    * Workflow engine's verdict on which actions the viewer can fire
    * right now. Server is canonical for the composite gates
    * (`canAssign`, `canResolve`).
    *
    * When `null` (the dispatch hasn't completed, fetch failed, etc.)
    * every composite gate returns `false` — deny by default.
    * Capability flags and data derivations remain accurate (they
    * don't depend on the engine).
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
      // Capability flags — feed directly from the permission service.
      // These aren't engine-gated; they're subject-level grants that
      // ride on the JWT.
      const canAssignComplaint = can(Permission.COMPLAINTS_ASSIGN);
      const canResolveComplaint = can(Permission.COMPLAINTS_RESOLVE);
      const canManageComplaints = can(Permission.COMPLAINTS_MANAGE);

      // Pure data derivations — no engine involvement.
      const status = complaintDetails?.status ?? 'Pending';
      const isTerminal = TERMINAL_STATUSES.has(status);
      const viewerIsAssignee =
         complaintDetails?.assignedToUserId != null &&
         userDetails?.id != null &&
         Number(complaintDetails.assignedToUserId) === Number(userDetails.id);

      // Server-canonical composite gates. `serverActions === null`
      // means the engine verdict isn't loaded yet — deny by default,
      // both gates are false until the saga lands the action list.
      const hasServer = serverActions != null;
      const canAssign = hasServer && serverActions!.includes('assign');
      const canResolve = hasServer && serverActions!.includes('resolve');

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
