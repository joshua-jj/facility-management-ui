import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants, storeConstants } from '@/constants';
import {
  checkStatus,
  parseResponse,
  createRequestWithToken,
  getObjectFromStorage,
  clearObjectFromStorage,
} from '@/utilities/helpers';
import { Store } from '@/types';
import { SearchStoreAction } from '@/actions';

interface User {
  user: { [key: string]: unknown };
  refreshToken: string;
  token: string;
}

interface ParsedResponse {
  message: string;
  error: string;
  data: {
    user: { [key: string]: unknown };
    id: string;
  };
}

interface ApiError {
  response?: Response;
  message?: string;
  error?: string;
}

function* getStores() {
  yield put({ type: storeConstants.REQUEST_GET_STORES });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    const storeUri = `${storeConstants.STORE_URI}`;

    const requestFn = () =>
      createRequestWithToken(storeUri, { method: 'GET' })(
        user?.token as string
      );
    const storeReq: Request = yield call(requestFn);

    const response: Store = yield call(fetch, storeReq);
    if (response.status === 401) {
      yield call(clearObjectFromStorage, authConstants.USER_KEY);

      yield put({ type: authConstants.TOKEN_HAS_EXPIRED });
      return;
    }
    yield call(checkStatus, response as unknown as Response);

    const jsonResponse: ParsedResponse = yield call(
      parseResponse,
      response as unknown as Response
    );

    yield put({
      type: storeConstants.GET_STORES_SUCCESS,
      stores: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: storeConstants.GET_STORES_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: storeConstants.GET_STORES_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* searchStore({ data }: SearchStoreAction) {
  yield put({ type: storeConstants.REQUEST_SEARCH_STORE });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    const storeUri = `${storeConstants.STORE_URI}/search?q=${data.text}`;

    const requestFn = () =>
      createRequestWithToken(storeUri, { method: 'GET' })(
        user?.token as string
      );
    const storeReq: Request = yield call(requestFn);

    const response: Store = yield call(fetch, storeReq);
    yield call(checkStatus, response as unknown as Response);

    const jsonResponse: ParsedResponse = yield call(
      parseResponse,
      response as unknown as Response
    );

    yield put({
      type: storeConstants.SEARCH_STORE_SUCCESS,
      store: jsonResponse,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: storeConstants.SEARCH_STORE_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: storeConstants.SEARCH_STORE_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* getStoresWatcher() {
  yield takeLatest(storeConstants.GET_STORES, getStores);
}

function* searchStoreWatcher() {
  yield takeLatest(storeConstants.SEARCH_STORE, searchStore);
}

export default function* rootSaga() {
  yield all([getStoresWatcher(), searchStoreWatcher()]);
}
