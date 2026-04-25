import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { wrapper } from '../redux/store';
import { Persistor } from 'redux-persist';
import '../utilities/formsyValidationRules';
import ErrorBoundary from '@/components/ErrorBoundary';
import ToastContainer from '@/components/Toast';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
});

export default function App({ Component, pageProps, ...rest }: AppProps) {
  const { store } = wrapper.useWrappedStore(rest);

  const persistor: Persistor = store.__PERSISTOR || ({} as Persistor);

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
            <ToastContainer />
            <Component {...pageProps} />
          </ErrorBoundary>
        </PersistGate>
      </Provider>
    </div>
  );
}
