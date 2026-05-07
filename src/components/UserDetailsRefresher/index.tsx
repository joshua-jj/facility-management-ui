import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { UnknownAction } from 'redux';
import { authActions } from '@/actions';
import type { RootState } from '@/redux/reducers';

/**
 * Keeps the cached user profile in sync with the server.
 *
 * The persisted `userDetails` slice is hydrated at login time and
 * re-written only by another login. Without this, an admin upgrading
 * a Member to Super Admin (or moving someone between departments)
 * leaves the affected user's session showing the old role until they
 * log out and back in — the sidebar, permission gates and dashboard
 * scope all stay stale.
 *
 * Strategy: dispatch `refreshUserDetails` whenever the tab regains
 * focus or visibility flips back to visible, plus once on mount. The
 * saga calls GET /authentication/me, which returns the same `user`
 * shape as login and hydrates userDetails via LOGIN_SUCCESS.
 */
export const UserDetailsRefresher: React.FC = () => {
   const dispatch = useDispatch();
   const isAuthenticated = useSelector(
      (s: RootState) => s.auth?.IsAuthenticated ?? false,
   );

   useEffect(() => {
      if (!isAuthenticated) return;
      const refresh = () =>
         dispatch(authActions.refreshUserDetails() as unknown as UnknownAction);

      // Initial hydrate after mount + auth being available — covers
      // tab reopened from a persisted session that bypassed login.
      refresh();

      const onFocus = () => refresh();
      const onVisibility = () => {
         if (document.visibilityState === 'visible') refresh();
      };

      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibility);
      return () => {
         window.removeEventListener('focus', onFocus);
         document.removeEventListener('visibilitychange', onVisibility);
      };
   }, [dispatch, isAuthenticated]);

   return null;
};

export default UserDetailsRefresher;
