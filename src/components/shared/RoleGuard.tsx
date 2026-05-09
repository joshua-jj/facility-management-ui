import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { usePermission } from '@/hooks/usePermission';
import { RoleId } from '@/constants/roles.constant';

interface RoleGuardProps {
   /**
    * Required permission(s) (`subject:action`). The component renders
    * children iff the user has ANY of them. Prefer this — it's the
    * canonical capability gate.
    */
   permission?: string | readonly string[];
   /**
    * @deprecated transitional — gate by `permission` instead. Kept for
    * not-yet-migrated call sites.
    */
   role?: number | number[];
   fallback?: React.ReactNode;
   children: React.ReactNode;
}

/**
 * Conditionally renders children based on the user's permissions
 * and/or roles. If neither `role` nor `permission` is provided,
 * children are always rendered.
 */
const RoleGuard: React.FC<RoleGuardProps> = ({
   permission,
   role,
   fallback = null,
   children,
}) => {
   const userDetails = useSelector((s: RootState) => s.user.userDetails);
   const { canAny } = usePermission();

   if (permission !== undefined) {
      const required = Array.isArray(permission) ? permission : [permission];
      if (!canAny(required as readonly string[])) {
         return <>{fallback}</>;
      }
   }

   if (role !== undefined) {
      const allowedRoles = Array.isArray(role) ? role : [role];
      const userRoleIds = userDetails?.roleIds ?? [];
      if (!allowedRoles.some((r) => userRoleIds.includes(r as RoleId))) {
         return <>{fallback}</>;
      }
   }

   return <>{children}</>;
};

export default RoleGuard;
