import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants, storeConstants } from '@/constants';
import {
  checkStatus,
  parseResponse,
  createRequestWithToken,
  getObjectFromStorage,
} from '@/utilities/helpers';
import { Store } from '@/types';

interface User {
  user: { [key: string]: unknown };
  refreshToken: string;
  token: string;
}

interface ParsedResponse {
  message: string;
  error: string;
  items: {
    user: { [key: string]: unknown };
    id: string;
    redirect_url: string;
    source?: string;
    token: string;
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
    yield call(checkStatus, response as unknown as Response);

    const jsonResponse: ParsedResponse = yield call(
      parseResponse,
      response as unknown as Response
    );

    yield put({
      type: storeConstants.GET_STORES_SUCCESS,
      stores: jsonResponse?.items,
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

function* getStoresWatcher() {
  yield takeLatest(storeConstants.GET_STORES, getStores);
}

export default function* rootSaga() {
  yield all([getStoresWatcher()]);
}
