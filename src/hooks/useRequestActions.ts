import { useMemo } from 'react';

/**
 * Single source of truth for the request-detail page's gate flags.
 *
 * Phase 7 (workflow rules cleanup) made the server canonical for the
 * primary-row composite gates. Three categories live here now:
 *
 *   1. Capability flags (`canApproveRequest`, `canManageRequests`, …)
 *      come from the UI's permission service (`can(...)`), fed from
 *      the JWT. Not an engine concern — these are subject-level
 *      grants, not state-dependent transitions.
 *
 *   2. Data derivations (`hasParent`, `hasChildren`, `viewerIsAssignee`)
 *      are pure projections of `requestDetails`. No engine involvement.
 *
 *   3. Composite primary-row gates (`canAssign`, `isMemberAssigned`,
 *      `isMemberCollected`) are server-canonical. The hook reads them
 *      from `serverActions`. When `serverActions` is null (loading,
 *      not yet dispatched, or fetch failed), the hook returns
 *      deny-by-default — every primary-row gate is `false`.
 *
 * The two row-level predicates (`isHodOfRow`, `canActOnRow`) keep
 * local computation, but only as a fallback for CHILD rows in the
 * multi-dept sub-request list. The server's getAvailableActions
 * endpoint only returns actions for the QUERIED entity; child cards
 * on a parent's tree view aren't queried individually, so they need
 * the local rule set.
 *
 * SRP: the page renders, this hook decides "who can do what".
 * ISP: the hook's input is a narrow `RequestRow` / `RequestActor`
 *      rather than the page's full RequestDetails interface.
 * DIP: `can` and `serverActions` are injected — the hook never
 *      reaches into Redux or fetches the engine itself.
 */

export const PENDING_HOD_STATUSES: ReadonlySet<string> = new Set([
   'Submitted',
   'Pending',
]);

/** Minimal row shape this hook reads from. */
export interface RequestRow {
   requestStatus: string;
   fulfillingDepartmentId?: number | null;
   children?: { id?: number }[];
   parent?: unknown;
   audit?: { assignee?: number | string | null } | null;
}

/** Minimal actor shape this hook reads from. */
export interface RequestActor {
   id?: number;
   departmentId?: number | null;
}

export interface RequestActions {
   // Capability flags — straight from the permission service.
   readonly canApproveRequest: boolean;
   readonly canAssignRequest: boolean;
   readonly canReleaseRequest: boolean;
   readonly canReturnRequest: boolean;
   readonly canManageRequests: boolean;

   // Tree-shape derivations of the primary row.
   readonly hasParent: boolean;
   readonly hasChildren: boolean;

   // Assignee identity derivations.
   readonly viewerIsAssignee: boolean;
   readonly isAssigneeOnAssignedRow: boolean;
   readonly isAssigneeOnCollectedRow: boolean;

   // Aliases — semantic mirrors kept for migration compatibility with
   // the old call sites. Both names refer to the same concept now.
   readonly isMemberAssigned: boolean;
   readonly isMemberCollected: boolean;

   // Composite gates for the primary row.
   readonly canAssign: boolean;

   // Row-level predicates for child cards / list views.
   isHodOfRow(row: RequestRow | null | undefined): boolean;
   canActOnRow(row: RequestRow | null | undefined): boolean;
}

interface UseRequestActionsArgs {
   requestDetails: RequestRow | null | undefined;
   userDetails: RequestActor | null | undefined;
   /** The `can` function from usePermission — passed in (DIP) rather
    *  than imported, so the hook stays decoupled from the Redux store
    *  and is trivially testable with a stub. */
   can: (perm: string) => boolean;
   /**
    * Workflow engine's verdict on which actions the viewer can fire
    * on the PRIMARY row right now. Server is canonical for the
    * composite primary-row gates (`canAssign`, `isMemberAssigned`,
    * `isMemberCollected`).
    *
    * When `null` (the dispatch hasn't completed, fetch failed, etc.)
    * every primary-row composite gate returns `false` — deny by
    * default. Capability flags and data derivations remain accurate
    * (they don't depend on the engine).
    *
    * Row-level (`canActOnRow(row)`) on a NON-primary row (a child
    * card on a parent's tree view) keeps local computation because
    * the server endpoint only returns actions for the queried entity.
    */
   serverActions?: ReadonlyArray<string> | null;
}

const isParentRow = (r?: RequestRow | null): boolean =>
   !!r && Array.isArray(r.children) && r.children.length > 0;

const isChildRow = (r?: RequestRow | null): boolean => !!r && !!r.parent;

export function useRequestActions({
   requestDetails,
   userDetails,
   can,
   serverActions,
}: UseRequestActionsArgs): RequestActions {
   return useMemo<RequestActions>(() => {
      // Capability flags — feed directly from the permission service.
      // These aren't engine-gated; they're subject-level grants that
      // ride on the JWT.
      const canApproveRequest = can('requests:approve');
      const canAssignRequest = can('requests:assign');
      const canReleaseRequest = can('requests:release');
      const canReturnRequest = can('requests:return');
      const canManageRequests = can('requests:manage');

      // Pure data derivations — no engine involvement.
      const hasChildren = isParentRow(requestDetails);
      const hasParent = isChildRow(requestDetails);
      const viewerIsAssignee =
         requestDetails?.audit?.assignee != null &&
         userDetails?.id != null &&
         Number(requestDetails.audit.assignee) === Number(userDetails.id);

      // Server-canonical primary-row gates. `serverActions === null`
      // means the engine verdict isn't loaded yet — deny by default,
      // every gate is false until the saga lands the action list.
      const hasServer = serverActions != null;
      const canAssign = hasServer && serverActions!.includes('assign');
      const isAssigneeOnAssignedRow =
         hasServer && serverActions!.includes('release');
      const isAssigneeOnCollectedRow =
         hasServer && serverActions!.includes('return');
      const primaryRowCanAct =
         hasServer &&
         (serverActions!.includes('approve') ||
            serverActions!.includes('decline'));

      // Local row-level computation — used for child cards in the
      // multi-dept sub-request list and as the primary-row fallback
      // when no server actions have landed. The page passes the
      // primary row through `canActOnRow` for the HOD approve/decline
      // pair; the server verdict overrides for that one row.
      const isHodOfRow = (row: RequestRow | null | undefined): boolean => {
         if (!row || !userDetails) return false;
         if (!canApproveRequest) return false;
         if (canManageRequests) return true;
         if (row.fulfillingDepartmentId == null) return true;
         return userDetails.departmentId === row.fulfillingDepartmentId;
      };

      // Approve / decline visibility for child rows (and primary-row
      // fallback when server actions are missing). Parents of
      // multi-dept trees are auto-computed from children — acting on
      // them would clobber settled siblings — so the gate is false
      // for those rows.
      const canActOnRowLocal = (
         row: RequestRow | null | undefined,
      ): boolean => {
         if (!row) return false;
         if (!PENDING_HOD_STATUSES.has(row.requestStatus)) return false;
         if ((row.children?.length ?? 0) > 0) return false;
         return isHodOfRow(row);
      };

      // `canActOnRow` accepts any row — primary or child. For the
      // primary row, server-canonical when serverActions provided;
      // otherwise (and for every non-primary child card) fall back to
      // local computation, which the existing rules already handle
      // via the workflow's `appliesTo: 'child'` transitions.
      const canActOnRow = (row: RequestRow | null | undefined): boolean => {
         if (hasServer && row === requestDetails) {
            return primaryRowCanAct;
         }
         return canActOnRowLocal(row);
      };

      return {
         canApproveRequest,
         canAssignRequest,
         canReleaseRequest,
         canReturnRequest,
         canManageRequests,
         hasParent,
         hasChildren,
         viewerIsAssignee,
         isAssigneeOnAssignedRow,
         isAssigneeOnCollectedRow,
         isMemberAssigned: isAssigneeOnAssignedRow,
         isMemberCollected: isAssigneeOnCollectedRow,
         canAssign,
         isHodOfRow,
         canActOnRow,
      };
   }, [requestDetails, userDetails, can, serverActions]);
}
