import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';

/**
 * Identity-context helpers: department membership, current user id /
 * email, row-author check. These are NOT capability gates — capability
 * is checked via `usePermission().can('subject:action')`.
 *
 * What used to live here (`isHod`, `isBackOffice`, `isFacilityHod`,
 * `isMember`, `isSuperAdmin`, `isAdmin`, `isOffice`, `isAnalyticsAccess`)
 * has been migrated out. Those were role-id flags and consumers should
 * now check the underlying capability — e.g. `can('requests:approve')`
 * instead of `isHod`. See the migration to permission-string-based
 * authorization landed across this branch.
 */
export const usePermissions = () => {
   const { userDetails } = useSelector((s: RootState) => s.user);
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);

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
   const isFacilityTeam =
      facilityDepartmentId != null &&
      userDetails?.departmentId === facilityDepartmentId;

   // Logistics department id — same lenient match as Facility above.
   const logisticsDepartmentId = useMemo<number | null>(() => {
      const list = allDepartmentsList as Array<{ id: number; name?: string }> | undefined;
      if (!list || list.length === 0) return null;
      const match = list.find((d) =>
         (d?.name ?? '').trim().toLowerCase().startsWith('logistics'),
      );
      return match ? match.id : null;
   }, [allDepartmentsList]);

   const isLogisticsTeam =
      logisticsDepartmentId != null &&
      userDetails?.departmentId === logisticsDepartmentId;

   // Transitional flag preserved for the Sidebar's `requiresFacilityTeam`
   // gate — back-office sees Facility-only routes regardless of dept.
   // This is still derived from roleIds[] because there's no clean
   // capability-only way to express "you're an admin who can see
   // everything in the building" — the spec ties it to roles. When the
   // seeder grows a `back-office:read` permission this can move there.
   const roleIds = userDetails?.roleIds ?? [];
   // Hardcoded role-id values to avoid importing the whole RoleId enum
   // from this hook. Match the seed: ADMIN=1, SUPER_ADMIN=5, OFFICE=6.
   const BACK_OFFICE_ROLE_IDS = [1, 5, 6];
   const isBackOffice = roleIds.some((r: number) =>
      BACK_OFFICE_ROLE_IDS.includes(r),
   );

   return {
      userId: userDetails?.id,
      userEmail: userDetails?.email,
      userDepartmentId: userDetails?.departmentId,
      facilityDepartmentId,
      logisticsDepartmentId,
      isFacilityTeam,
      isLogisticsTeam,
      isBackOffice,

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
