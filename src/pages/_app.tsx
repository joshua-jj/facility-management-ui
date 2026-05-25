import '@/styles/globals.css';
// React Flow base styles. Imported here (the only place Next.js
// Pages Router permits CSS from node_modules without a CSS module)
// so the workflow editor canvas has the controls / handles styling
// it relies on. Skin overrides live in components/WorkflowEditor.
import '@xyflow/react/dist/style.css';
import { Inter } from 'next/font/google';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { wrapper } from '../redux/store';
import { Persistor } from 'redux-persist';
import '../utilities/formsyValidationRules';
import ErrorBoundary from '@/components/ErrorBoundary';
import ToastContainer from '@/components/Toast';
import RouteProgress from '@/components/RouteProgress';
import UserDetailsRefresher from '@/components/UserDetailsRefresher';
import type { AppPropsWithLayout } from '@/types/next-page-with-layout';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
});

export default function App({ Component, pageProps, ...rest }: AppPropsWithLayout) {
  const { store } = wrapper.useWrappedStore(rest);

  const persistor: Persistor = store.__PERSISTOR || ({} as Persistor);

  // Pages declare their own shell via `getLayout`. Hoisting the shell
  // here means Sidebar / Header / PrivateRoute are rendered once and
  // persist across <Link> navigations — only the page content swaps.
  // Pages without `getLayout` (redirect-only or bespoke screens) render
  // bare. See src/types/next-page-with-layout.d.ts.
  const getLayout = Component.getLayout ?? ((page) => page);

  // Promote Inter's classes onto <html> so the --font-inter variable is
  // visible to elements that escape this React tree (e.g., Radix/Base UI
  // portals — the notification popover renders directly under <body>).
  useEffect(() => {
    const html = document.documentElement;
    const classes = `${inter.className} ${inter.variable}`.split(' ').filter(Boolean);
    classes.forEach((c) => html.classList.add(c));
    return () => classes.forEach((c) => html.classList.remove(c));
  }, []);

  return (
    <div className={`${inter.className} ${inter.variable}`}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ErrorBoundary>
            <RouteProgress />
            <UserDetailsRefresher />
            <ToastContainer />
            {getLayout(<Component {...pageProps} />)}
          </ErrorBoundary>
        </PersistGate>
      </Provider>
    </div>
  );
}
