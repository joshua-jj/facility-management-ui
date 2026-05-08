import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { ReactNode, useEffect } from 'react';
import { usePermission } from '@/hooks/usePermission';

type LayoutProps = {
   children: ReactNode;
   query?: string;
   /**
    * Required permissions (`subject:action`). The page is admitted
    * when the user has ANY of these (OR semantics). Prefer this over
    * `allowedRoles`. `subject:manage` covers every action on a subject.
    */
   permissions?: readonly string[];
   /**
    * @deprecated transitional — gate by `permissions` instead. Kept so
    * not-yet-migrated pages don't break.
    */
   allowedRoles?: number[];
};

const PrivateRoute: React.FC<LayoutProps> = ({
   children,
   permissions,
   allowedRoles,
}) => {
   const IsAuthenticated = useSelector(
      (state: RootState) => state.auth.IsAuthenticated,
   );
   const { userDetails } = useSelector((s: RootState) => s.user);
   const { canAny } = usePermission();

   const router = useRouter();

   useEffect(() => {
      if (!IsAuthenticated) {
         router.replace({
            pathname: `/login`,
            query: { from: encodeURIComponent(router.pathname) },
         });
         return;
      }

      // Permission gate (canonical). Falls through if the page didn't
      // declare any required permissions — pages can self-gate.
      if (permissions && permissions.length > 0) {
         if (!canAny(permissions)) {
            router.replace('/login');
            return;
         }
      }

      // Legacy role-id gate. Kept ONLY so pages that haven't migrated
      // yet keep working. New code should use `permissions`.
      if (allowedRoles) {
         const userRoleIds = userDetails?.roleIds ?? [];
         const hasAccess = allowedRoles.some((rid) => userRoleIds.includes(rid));
         if (!hasAccess) {
            router.replace('/login');
         }
      }
   }, [
      IsAuthenticated,
      userDetails?.roleIds,
      permissions,
      allowedRoles,
      canAny,
      router,
   ]);

   if (!IsAuthenticated) return null;
   if (permissions && permissions.length > 0 && !canAny(permissions)) return null;
   if (
      allowedRoles &&
      !allowedRoles.some((rid) => (userDetails?.roleIds ?? []).includes(rid))
   ) {
      return null;
   }

   return <>{children}</>;
};

export default PrivateRoute;
