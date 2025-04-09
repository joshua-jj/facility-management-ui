import { Action, configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import createSagaMiddleware, { Task } from 'redux-saga';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import rootReducer from '../redux/reducers';
import rootSaga from '../redux/sagas';
import { appConstants } from '../constants';

export type RootState = ReturnType<typeof rootReducer>;

type SagaStore = ReturnType<typeof configureStore> & {
  sagaTask?: Task;
  __PERSISTOR?: ReturnType<typeof persistStore>;
};

const makeStore = (): SagaStore => {
  const sagaMiddleware = createSagaMiddleware();

  const isClient = typeof window !== 'undefined';

  let store: SagaStore;

  if (isClient) {
    const persistConfig = {
      key: `${appConstants.KEY_PREFIX}-GlobalStore`,
      storage,
      whitelist: ['auth', 'user'],
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer);

    store = configureStore({
      reducer: persistedReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }).concat(sagaMiddleware),
    }) as SagaStore;

    store.__PERSISTOR = persistStore(store);
  } else {
    store = configureStore({
      reducer: rootReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }).concat(sagaMiddleware),
    }) as SagaStore;
  }

  store.sagaTask = sagaMiddleware.run(rootSaga);

  return store;
};

export const wrapper = createWrapper<SagaStore>(makeStore);

export const storeDispatch = (act: Action) => {
  const store = makeStore();
  store.dispatch(act);
};

export default makeStore;
