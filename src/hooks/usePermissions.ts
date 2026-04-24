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
   const roleId = userDetails?.roleId;

   const isSuperAdmin = roleId === RoleId.SUPER_ADMIN;
   const isAdmin = roleId === RoleId.ADMIN;
   const isHod = roleId === RoleId.HOD;
   const isMember = roleId === RoleId.MEMBER;
   const isOffice = roleId === RoleId.OFFICE;

   // Anyone with SUPER_ADMIN or ADMIN sees all the back-office admin tools.
   const isBackOffice = isSuperAdmin || isAdmin;

   // Resolve the Facility department id from the loaded department list.
   // Null until the list is fetched — consumers should treat it as "not
   // yet known" rather than "definitely not Facility."
   const facilityDepartmentId = useMemo<number | null>(() => {
      const list = allDepartmentsList as Array<{ id: number; name?: string }> | undefined;
      if (!list || list.length === 0) return null;
      const match = list.find((d) => (d?.name ?? '').trim().toLowerCase() === 'facility');
      return match ? match.id : null;
   }, [allDepartmentsList]);

   // True when the current user belongs to the Facility department.
   // Super Admin / Admin don't need a department check for Facility-scoped
   // features — their `isBackOffice` flag already grants access everywhere.
   const isFacilityTeam =
      facilityDepartmentId != null &&
      userDetails?.departmentId === facilityDepartmentId;

   return {
      roleId,
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
         const fullName = `${userDetails.firstName ?? ''} ${userDetails.lastName ?? ''}`
            .trim()
            .toLowerCase();
         if (!fullName) return false;
         return row?.createdBy?.toLowerCase() === fullName;
      },
   };
};
