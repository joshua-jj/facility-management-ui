import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { usePermission } from '@/hooks/usePermission';
import { RoleId } from '@/constants/roles.constant';

interface RoleGuardProps {
   permission?: string;
   role?: number | number[];
   fallback?: React.ReactNode;
   children: React.ReactNode;
}

/**
 * Conditionally renders children based on the current user's role and/or permission.
 * If neither `role` nor `permission` is provided, children are always rendered.
 *
 * - `role`: one or more RoleId values the user must have
 * - `permission`: permission name string (requires user shape to carry permissions)
 * - `fallback`: what to render when access is denied (default: null)
 */
const RoleGuard: React.FC<RoleGuardProps> = ({ permission, role, fallback = null, children }) => {
   const userDetails = useSelector((s: RootState) => s.user.userDetails);
   const { hasPermission } = usePermission();

   const userRoleId = userDetails?.roleId;

   // Role check
   if (role !== undefined) {
      const allowedRoles = Array.isArray(role) ? role : [role];
      if (!allowedRoles.includes(userRoleId as RoleId)) {
         return <>{fallback}</>;
      }
   }

   // Permission check (currently always returns false — see usePermission)
   if (permission !== undefined) {
      if (!hasPermission(permission)) {
         return <>{fallback}</>;
      }
   }

   return <>{children}</>;
};

export default RoleGuard;
