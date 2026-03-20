import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Montserrat } from 'next/font/google';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { wrapper } from '../redux/store';
import { Persistor } from 'redux-persist';
import '../utilities/formsyValidationRules';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '700'], // specify weights you need
});

export default function App({ Component, pageProps, ...rest }: AppProps) {
  const { store } = wrapper.useWrappedStore(rest);

  const persistor: Persistor = store.__PERSISTOR || ({} as Persistor);

  if (process.env.NODE_ENV === 'production') {
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
  }

  return (
    <div className={montserrat.className}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <Component {...pageProps} />
        </PersistGate>
      </Provider>
    </div>
  );
}
