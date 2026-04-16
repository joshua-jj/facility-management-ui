import { put, takeLatest, all } from 'typed-redux-saga';
import { storeConstants } from '@/constants';
import { appActions, CreateStoreAction, SearchStoreAction, UpdateStoreAction, ActivateStoreAction, DeactivateStoreAction } from '@/actions';
import { SetSnackBarPayload } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

interface GetStoresAction {
  type: string;
  data?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  };
}

function* getStores({ data }: GetStoresAction) {
  yield put({ type: storeConstants.REQUEST_GET_STORES });

  try {
    const page = data?.page ?? 1;
    const limit = data?.limit ?? 10;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (data?.search) params.set('search', data.search);
    if (data?.status) params.set('filter', data.status);

    const storeUri = `${storeConstants.STORE_URI}?${params.toString()}`;

    const jsonResponse = yield* authenticatedRequest(storeUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: storeConstants.GET_STORES_SUCCESS,
      stores: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, storeConstants.GET_STORES_ERROR, false);
  }
}

function* createStore({ data }: CreateStoreAction) {
  yield put({ type: storeConstants.REQUEST_CREATE_STORE });

  try {
    if (data) {
      const storeUri = `${storeConstants.STORE_URI}/new`;

      const jsonResponse = yield* authenticatedRequest(storeUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!jsonResponse) return;

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
    yield* handleSagaError(error, storeConstants.CREATE_STORE_ERROR);
  }
}

function* updateStore({ data }: UpdateStoreAction) {
  yield put({ type: storeConstants.REQUEST_UPDATE_STORE });

  try {
    if (data) {
      const { id, ...restData } = data;
      const storeUri = `${storeConstants.STORE_URI}/update/${id}`;

      const jsonResponse = yield* authenticatedRequest(storeUri, {
        method: 'PATCH',
        body: JSON.stringify(restData),
      });
      if (!jsonResponse) return;

      yield put({
        type: storeConstants.UPDATE_STORE_SUCCESS,
        user: jsonResponse?.data,
      });

      yield put({
        type: storeConstants.GET_STORES,
      });

      AppEmitter.emit(storeConstants.UPDATE_STORE_SUCCESS, jsonResponse);
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, storeConstants.UPDATE_STORE_ERROR);
  }
}

function* searchStore({ data }: SearchStoreAction) {
  yield put({ type: storeConstants.REQUEST_SEARCH_STORE });

  try {
    const storeUri = `${storeConstants.STORE_URI}/search?q=${data.text}`;

    const jsonResponse = yield* authenticatedRequest(storeUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: storeConstants.SEARCH_STORE_SUCCESS,
      store: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, storeConstants.SEARCH_STORE_ERROR, false);
  }
}

function* activateStore({ data }: ActivateStoreAction) {
  yield put({ type: storeConstants.REQUEST_ACTIVATE_STORE });

  try {
    const storeUri = `${storeConstants.STORE_URI}/activate`;

    const jsonResponse = yield* authenticatedRequest(storeUri, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!jsonResponse) return;

    yield put({ type: storeConstants.ACTIVATE_STORE_SUCCESS });
    yield put({ type: storeConstants.GET_STORES });

    const payload: SetSnackBarPayload = {
      type: 'success',
      message: (jsonResponse?.message as string) ?? 'Store activated successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(error, storeConstants.ACTIVATE_STORE_ERROR);
  }
}

function* deactivateStore({ data }: DeactivateStoreAction) {
  yield put({ type: storeConstants.REQUEST_DEACTIVATE_STORE });

  try {
    const storeUri = `${storeConstants.STORE_URI}/deactivate`;

    const jsonResponse = yield* authenticatedRequest(storeUri, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!jsonResponse) return;

    yield put({ type: storeConstants.DEACTIVATE_STORE_SUCCESS });
    yield put({ type: storeConstants.GET_STORES });

    const payload: SetSnackBarPayload = {
      type: 'success',
      message: (jsonResponse?.message as string) ?? 'Store deactivated successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(error, storeConstants.DEACTIVATE_STORE_ERROR);
  }
}

function* getStoresWatcher() {
  yield takeLatest(storeConstants.GET_STORES, getStores);
}

function* createStoreWatcher() {
  yield takeLatest(storeConstants.CREATE_STORE, createStore);
}

function* updateStoreWatcher() {
  yield takeLatest(storeConstants.UPDATE_STORE, updateStore);
}

function* searchStoreWatcher() {
  yield takeLatest(storeConstants.SEARCH_STORE, searchStore);
}

function* activateStoreWatcher() {
  yield takeLatest(storeConstants.ACTIVATE_STORE, activateStore);
}

function* deactivateStoreWatcher() {
  yield takeLatest(storeConstants.DEACTIVATE_STORE, deactivateStore);
}

export default function* rootSaga() {
  yield all([
    getStoresWatcher(),
    createStoreWatcher(),
    updateStoreWatcher(),
    searchStoreWatcher(),
    activateStoreWatcher(),
    deactivateStoreWatcher(),
  ]);
}
