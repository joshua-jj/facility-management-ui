import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { RoleId } from '@/constants/roles.constant';

/**
 * Centralised role-based permission flags. Per the Roles & Permissions
 * spec, the canonical rules are:
 *
 *   SUPER_ADMIN  - full access to everything
 *   ADMIN        - same as SUPER_ADMIN except Users Management is view-only
 *   HOD          - scoped read on their dept (Requests, Items, Maintenance
 *                  Logs, Incidence Logs). No edit/delete anywhere.
 *   MEMBER       - Requests (assigned to me), Maintenance/Generator/Incidence
 *                  Logs (view all, edit only my own), Complaints (resolve
 *                  only assignments to me).
 *
 * Components that need finer-grained checks (e.g. "is this log my own?")
 * combine these flags with row-level ownership checks.
 */
export const usePermissions = () => {
   const { userDetails } = useSelector((s: RootState) => s.user);
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);
   // Canonical multi-role state. Falls back to wrapping the deprecated
   // single roleId so any reducer code still emitting it stays compatible.
   const roleIds: number[] =
      userDetails?.roleIds ??
      (typeof userDetails?.roleId === 'number' && userDetails.roleId > 0
         ? [userDetails.roleId]
         : []);

   const isSuperAdmin = roleIds.includes(RoleId.SUPER_ADMIN);
   const isAdmin = roleIds.includes(RoleId.ADMIN);
   const isHod = roleIds.includes(RoleId.HOD);
   const isMember = roleIds.includes(RoleId.MEMBER);
   const isOffice = roleIds.includes(RoleId.OFFICE);

   // Anyone with SUPER_ADMIN or ADMIN sees all the back-office admin tools.
   const isBackOffice = isSuperAdmin || isAdmin;

   // Resolve the Facility department id from the loaded department list.
   // Null until the list is fetched — consumers should treat it as "not
   // yet known" rather than "definitely not Facility."
   const facilityDepartmentId = useMemo<number | null>(() => {
      const list = allDepartmentsList as Array<{ id: number; name?: string }> | undefined;
      if (!list || list.length === 0) return null;
      // Match leniently — backend canonical name is "Facility" but we
      // also accept "Facility Maintenance", "Facilities", etc. The first
      // department whose name starts with "facility" wins.
      const match = list.find((d) =>
         (d?.name ?? '').trim().toLowerCase().startsWith('facility'),
      );
      return match ? match.id : null;
   }, [allDepartmentsList]);

   // True when the current user belongs to the Facility department.
   // Super Admin / Admin don't need a department check for Facility-scoped
   // features — their `isBackOffice` flag already grants access everywhere.
   const isFacilityTeam =
      facilityDepartmentId != null &&
      userDetails?.departmentId === facilityDepartmentId;

   return {
      roleIds,
      /** @deprecated transitional — first role id only. Use `roleIds`. */
      roleId: roleIds[0] ?? null,
      userId: userDetails?.id,
      userEmail: userDetails?.email,
      userDepartmentId: userDetails?.departmentId,
      facilityDepartmentId,
      isSuperAdmin,
      isAdmin,
      isHod,
      isMember,
      isOffice,
      isBackOffice,
      isFacilityTeam,

      // Row-level helper: the current user is the author of a row whose
      // createdBy matches their full name OR whose explicit author FK
      // matches their user id.
      isAuthor: (row: { createdBy?: string; createdByUserId?: number }) => {
         if (!userDetails) return false;
         if (row?.createdByUserId && row.createdByUserId === userDetails.id)
            return true;
         // Normalise whitespace on both sides — DB rows have shown stray
         // internal/leading/trailing spaces from migrated data, and a
         // strict === miss silently disables the edit gate. The audit
         // field is built by `buildUserName(profile, id)` on the API,
         // which falls back through firstName-only, lastName-only,
         // email, then `User-<id>`. Mirror those candidates here.
         const norm = (s: string | null | undefined) =>
            (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
         const author = norm(row?.createdBy);
         if (!author) return false;
         const candidates = [
            norm(`${userDetails.firstName ?? ''} ${userDetails.lastName ?? ''}`),
            norm(userDetails.firstName),
            norm(userDetails.lastName),
            norm(userDetails.email),
            userDetails.id ? `user-${userDetails.id}` : '',
         ].filter(Boolean);
         return candidates.includes(author);
      },
   };
};
