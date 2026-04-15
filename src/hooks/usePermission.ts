import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';

/**
 * Returns a function that checks whether the currently authenticated user
 * has a specific permission by name.
 *
 * NOTE: The current UserDetail shape in state.user.userDetails carries
 * `role` as a string (role name) and `roleId` as a number — it does NOT
 * carry the role's permissions array. This hook will always return false
 * until the user shape is extended to include permissions. When that
 * happens, uncomment the permissions check below and remove the false return.
 */
export function usePermission() {
   const userDetails = useSelector((s: RootState) => s.user.userDetails);

   const hasPermission = (name: string): boolean => {
      // The UserDetail type doesn't carry permissions yet.
      // Returning false as a safe default.
      void name;
      void userDetails;
      return false;
   };

   return { hasPermission };
}
