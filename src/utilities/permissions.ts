/**
 * UI-side permission service. Mirrors the API's wire-format
 * (`subject:action` lowercase) so the same key works on both sides of
 * the boundary. The CASL convention `subject:manage` means "I can
 * administer this subject" — administer = CRUD only. Workflow verbs
 * (approve / decline / assign / release / return / resolve) are role-
 * specific and must be granted explicitly. `expandPermissions` enforces
 * this so a back-office `requests:manage` doesn't silently confer the
 * HOD's `requests:approve`.
 *
 * This service is pure — it doesn't touch Redux. The `usePermission`
 * hook in `src/hooks/usePermission.ts` wires it to the Redux store.
 */

const CRUD_ACTIONS = ['read', 'write', 'delete'] as const;
const WORKFLOW_ACTIONS = [
   'approve',
   'decline',
   'assign',
   'release',
   'return',
   'resolve',
] as const;

// Backcompat — exported in case any caller imports it. New callers
// should reach for CRUD_ACTIONS / WORKFLOW_ACTIONS directly.
export const STANDARD_ACTIONS = [
   ...CRUD_ACTIONS,
   ...WORKFLOW_ACTIONS,
] as const;

const CRUD_ACTION_SET: ReadonlySet<string> = new Set(CRUD_ACTIONS);

/**
 * Expand `subject:manage` into the CRUD actions on the subject. Workflow
 * verbs are intentionally NOT covered by manage — they require explicit
 * grants, matching the role-spec separation between back-office (CRUD)
 * and workflow steps (approve/decline/assign/release/return/resolve).
 *
 * Returns a Set so membership checks are O(1).
 */
export const expandPermissions = (
   permissions: ReadonlyArray<string> | null | undefined,
): Set<string> => {
   const out = new Set<string>();
   if (!permissions) return out;
   for (const key of permissions) {
      if (!key) continue;
      out.add(key);
      const colon = key.indexOf(':');
      if (colon < 0) continue;
      const subject = key.slice(0, colon);
      const action = key.slice(colon + 1);
      if (action === 'manage') {
         for (const a of CRUD_ACTIONS) out.add(`${subject}:${a}`);
      }
   }
   return out;
};

export interface PermissionService {
   /** True iff the user holds the given `subject:action` permission. */
   has(required: string): boolean;
   /** True iff the user holds at least one of the given permissions. */
   hasAny(required: ReadonlyArray<string>): boolean;
   /** True iff the user holds every one of the given permissions. */
   hasAll(required: ReadonlyArray<string>): boolean;
   /** Raw expanded set — exposed for advanced callers (rare). */
   readonly expanded: Set<string>;
}

/**
 * Build a `PermissionService` from a flat permission array. Cheap to
 * call repeatedly; the underlying Set is built once and reused for
 * every check on the returned object.
 */
export const createPermissionService = (
   permissions: ReadonlyArray<string> | null | undefined,
): PermissionService => {
   const expanded = expandPermissions(permissions);

   const has = (required: string): boolean => {
      if (!required) return true;
      if (expanded.has(required)) return true;
      const colon = required.indexOf(':');
      if (colon < 0) return false;
      const subject = required.slice(0, colon);
      const action = required.slice(colon + 1);
      // Defense in depth: even if expandPermissions wasn't called, a
      // manage grant should still satisfy a finer-grained CRUD ask.
      // Workflow verbs are NOT implied by manage — they need explicit
      // grants.
      if (CRUD_ACTION_SET.has(action)) {
         return expanded.has(`${subject}:manage`);
      }
      return false;
   };

   return {
      has,
      hasAny: (required) => required.some((p) => has(p)),
      hasAll: (required) => required.every((p) => has(p)),
      expanded,
   };
};
