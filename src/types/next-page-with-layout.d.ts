import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import type { ReactElement, ReactNode } from 'react';

/**
 * Pages can declare a `getLayout` static so the shell (sidebar, header,
 * PrivateRoute) is rendered ONCE in _app.tsx and persists across
 * client-side navigations. Without this pattern, every <Link> click
 * unmounts and remounts the entire shell — the sidebar, header, and
 * top bar visibly flash on every route change.
 *
 * Usage on a page:
 *
 *   const Items: NextPageWithLayout = () => { ... };
 *   Items.getLayout = (page) => (
 *     <PrivateRoute permissions={[Permission.ITEMS_READ]}>
 *       <Layout title="Items">{page}</Layout>
 *     </PrivateRoute>
 *   );
 *   export default Items;
 *
 * Pages that omit `getLayout` (e.g. redirect-only or fully bespoke
 * routes) render as-is with no shell.
 */
export type NextPageWithLayout<P = unknown, IP = P> = NextPage<P, IP> & {
   getLayout?: (page: ReactElement) => ReactNode;
};

export type AppPropsWithLayout = AppProps & {
   Component: NextPageWithLayout;
};
