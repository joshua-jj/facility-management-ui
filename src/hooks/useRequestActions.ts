import { useMemo } from 'react';

/**
 * Single source of truth for the request-detail page's gate flags.
 *
 * The page used to compute these inline (canActOnRow, canAssign,
 * isHodOfRow, isMemberAssigned, isMemberCollected, hasParent, etc.)
 * mixed with the rest of the render logic. Extracted here so:
 *
 *   - SRP: the page renders, this hook decides "who can do what".
 *   - ISP: the hook's input is a narrow `RequestRow` / `RequestActor`
 *          rather than the page's full RequestDetails interface, so
 *          consumers don't depend on fields they don't read.
 *   - OCP: new permission rules slot in here without touching the
 *          page's JSX; if the planned Workflow Rules Module lands,
 *          this hook is the call site that swaps from local
 *          computation to `getAvailableActions(actor, request)`.
 *
 * The hook is pure — no state, no effects, no Redux — and returns a
 * stable object via useMemo so the page can destructure once.
 */

export const PENDING_HOD_STATUSES: ReadonlySet<string> = new Set([
   'Submitted',
   'Pending',
]);

/** Statuses where the parent / flat row's items are assignable. */
const ASSIGNABLE_PARENT_STATUSES: ReadonlySet<string> = new Set([
   'Approved',
   'Partially Approved',
]);

/** Minimal row shape this hook reads from. */
export interface RequestRow {
   requestStatus: string;
   fulfillingDepartmentId?: number | null;
   children?: { id: number }[];
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
}

const isParentRow = (r?: RequestRow | null): boolean =>
   !!r && Array.isArray(r.children) && r.children.length > 0;

const isChildRow = (r?: RequestRow | null): boolean => !!r && !!r.parent;

export function useRequestActions({
   requestDetails,
   userDetails,
   can,
}: UseRequestActionsArgs): RequestActions {
   return useMemo<RequestActions>(() => {
      const canApproveRequest = can('requests:approve');
      const canAssignRequest = can('requests:assign');
      const canReleaseRequest = can('requests:release');
      const canReturnRequest = can('requests:return');
      const canManageRequests = can('requests:manage');

      const hasChildren = isParentRow(requestDetails);
      const hasParent = isChildRow(requestDetails);

      const viewerIsAssignee =
         requestDetails?.audit?.assignee != null &&
         userDetails?.id != null &&
         Number(requestDetails.audit.assignee) === Number(userDetails.id);

      const isAssigneeOnAssignedRow =
         canReleaseRequest &&
         requestDetails?.requestStatus === 'Assigned' &&
         viewerIsAssignee;

      const isAssigneeOnCollectedRow =
         canReturnRequest &&
         requestDetails?.requestStatus === 'Collected' &&
         viewerIsAssignee;

      // Capability + dept-context: can THIS viewer approve / decline
      // THIS row? Capability says "you hold requests:approve"; the
      // department check narrows to "and this row is your dept's".
      // Back-office (`requests:manage`) bypasses dept. If the row
      // has no fulfilling dept (parent of multi-dept tree, or stale
      // data), we fall back to "this HOD owns whatever the API
      // returned" — Phase 3 list scoping already gated the data.
      const isHodOfRow = (row: RequestRow | null | undefined): boolean => {
         if (!row || !userDetails) return false;
         if (!canApproveRequest) return false;
         if (canManageRequests) return true;
         if (row.fulfillingDepartmentId == null) return true;
         return userDetails.departmentId === row.fulfillingDepartmentId;
      };

      // Approve / decline visibility. Parents of multi-dept trees are
      // auto-computed from children — acting on them would clobber
      // settled siblings — so the gate is false for those rows. Each
      // child card carries its own Approve / Decline pair.
      const canActOnRow = (row: RequestRow | null | undefined): boolean => {
         if (!row) return false;
         if (!PENDING_HOD_STATUSES.has(row.requestStatus)) return false;
         if ((row.children?.length ?? 0) > 0) return false;
         return isHodOfRow(row);
      };

      // Assignment is enabled on Approved + Partially Approved (spec
      // §11 Phase 6 + §8) — and ONLY on parents / flat rows. The
      // server returns 4xx for an attempt on a sub-request, but we
      // also hide the control so the UI never offers an action that
      // throws on click.
      const canAssign =
         canAssignRequest &&
         !hasParent &&
         requestDetails != null &&
         ASSIGNABLE_PARENT_STATUSES.has(requestDetails.requestStatus);

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
   }, [requestDetails, userDetails, can]);
}
