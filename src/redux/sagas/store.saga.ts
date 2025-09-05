import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants, storeConstants } from '@/constants';
import {
  checkStatus,
  parseResponse,
  createRequestWithToken,
  getObjectFromStorage,
  clearObjectFromStorage,
} from '@/utilities/helpers';
import { SetSnackBarPayload, Store } from '@/types';
import { appActions, CreateStoreAction, SearchStoreAction } from '@/actions';
import { AppEmitter } from '@/controllers/EventEmitter';

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
    const storeUri = `${storeConstants.STORE_URI}?page=1&limit=10`;

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

function* createStore({ data }: CreateStoreAction) {
  yield put({ type: storeConstants.REQUEST_CREATE_STORE });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );

    if (data) {
      const userUri = `${storeConstants.STORE_URI}/new`;
      const userReq = createRequestWithToken(userUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const req: Request = yield call(userReq, user?.token as string);
      const response: Store = yield call(fetch, req);

      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: storeConstants.CREATE_STORE_SUCCESS,
        user: jsonResponse?.data,
      });

      yield put({
        type: storeConstants.GET_STORES,
      });

      AppEmitter.emit(storeConstants.CREATE_STORE_SUCCESS, jsonResponse);
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: storeConstants.CREATE_STORE_ERROR,
        error: res?.error,
      });
      const payload: SetSnackBarPayload = {
        type: 'error',
        message: res?.error ?? res?.message ?? 'Something went wrong',
        variant: 'error',
      };
      yield put(appActions.setSnackBar(payload));

      return;
    }
    yield put({
      type: storeConstants.CREATE_STORE_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
    const payload: SetSnackBarPayload = {
      type: 'error',
      message:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
      variant: 'error',
    };
    yield put(appActions.setSnackBar(payload));
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
      store: jsonResponse?.data,
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

function* createStoreWatcher() {
  yield takeLatest(storeConstants.CREATE_STORE, createStore);
}

function* searchStoreWatcher() {
  yield takeLatest(storeConstants.SEARCH_STORE, searchStore);
}

export default function* rootSaga() {
  yield all([getStoresWatcher(), createStoreWatcher(), searchStoreWatcher()]);
}
