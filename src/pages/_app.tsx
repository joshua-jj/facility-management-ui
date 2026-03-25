import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
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
