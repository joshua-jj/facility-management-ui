/**
 * UI-side permission service. Mirrors the API's wire-format
 * (`subject:action` lowercase) so the same key works on both sides of
 * the boundary. The CASL convention `subject:manage` means "every
 * action on this subject" — `expandPermissions` makes that implicit so
 * callers can just check `has('subject:read')` without worrying about
 * manage-overrides.
 *
 * This service is pure — it doesn't touch Redux. The `usePermission`
 * hook in `src/hooks/usePermission.ts` wires it to the Redux store.
 */

const STANDARD_ACTIONS = [
   'read',
   'write',
   'delete',
   'approve',
   'decline',
   'assign',
   'release',
   'return',
   'resolve',
] as const;

/**
 * Expand `subject:manage` into every standard action on the subject.
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
         for (const a of STANDARD_ACTIONS) out.add(`${subject}:${a}`);
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
      // Defense in depth: even if expandPermissions wasn't called, a
      // manage grant should still satisfy a finer-grained ask.
      return expanded.has(`${required.slice(0, colon)}:manage`);
   };

   return {
      has,
      hasAny: (required) => required.some((p) => has(p)),
      hasAll: (required) => required.every((p) => has(p)),
      expanded,
   };
};
