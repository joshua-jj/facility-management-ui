import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { createPermissionService, PermissionService } from '@/utilities/permissions';

/**
 * Capability hook — the canonical way to gate UI on permissions.
 *
 *   const { can, canAny, canAll } = usePermission();
 *   if (can('requests:approve')) { ... }
 *   if (canAny(['users:manage', 'users:write'])) { ... }
 *
 * Returns stable function identities across renders for the same
 * permission set, so callers can use the result in dependency arrays
 * without forcing extra renders.
 *
 * Backwards-compat shim: the old `usePermission()` exposed
 * `hasPermission(name)`. We keep that available so existing call sites
 * (RoleGuard) keep working without an immediate rewrite.
 */
export interface UsePermissionResult {
   can: PermissionService['has'];
   canAny: PermissionService['hasAny'];
   canAll: PermissionService['hasAll'];
   /** @deprecated use `can` */
   hasPermission: PermissionService['has'];
   /** Raw permission array straight from the auth payload. Empty array
    *  if the user is not yet hydrated. Mostly useful for diagnostics. */
   permissions: ReadonlyArray<string>;
}

export const usePermission = (): UsePermissionResult => {
   const permissions = useSelector(
      (s: RootState) => s.user.userDetails?.permissions ?? [],
   );

   // Memoise on the array reference. The user reducer always returns a
   // fresh `permissions` array on LOGIN_SUCCESS, so this stays cheap.
   const service = useMemo(
      () => createPermissionService(permissions),
      [permissions],
   );

   return {
      can: service.has,
      canAny: service.hasAny,
      canAll: service.hasAll,
      hasPermission: service.has,
      permissions,
   };
};
