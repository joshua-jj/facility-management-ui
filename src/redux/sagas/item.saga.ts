import { call, put, takeLatest, all } from 'typed-redux-saga';
import { itemConstants } from '@/constants';
import { checkStatus, parseResponse, createRequest } from '@/utilities/helpers';
import { SetSnackBarPayload } from '@/types';
import {
  appActions,
  CreateItemAction,
  CreateItemsAction,
  DeleteItemAction,
  GetAllDepartmentItemsAction,
  GetAllItemsAction,
  GetAnItemAction,
  GetDepartmentItemsAction,
  SearchItemAction,
  UpdateItemAction,
} from '@/actions';
import { AppEmitter } from '@/controllers/EventEmitter';
import {
  authenticatedRequest,
  handleSagaError,
  getStoredUser,
} from '@/utilities/saga-helpers';

function* getAllDepartmentItems({ data }: GetAllDepartmentItemsAction) {
  yield put({ type: itemConstants.REQUEST_GET_ALL_DEPARTMENT_ITEMS });

  try {
    const itemUri = `${itemConstants.ITEM_URI}/all/${data}`;
    const itemReq = createRequest(itemUri, { method: 'GET' });

    const response: Response = yield call(fetch, itemReq);
    yield call(checkStatus, response);

    // @ts-expect-error legacy saga pattern
    const jsonResponse = yield call(parseResponse, response);

    yield put({
      type: itemConstants.GET_ALL_DEPARTMENT_ITEMS_SUCCESS,
      items: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, itemConstants.GET_ALL_DEPARTMENT_ITEMS_ERROR, false);
  }
}

function* getAnItem({ data }: GetAnItemAction) {
  yield put({ type: itemConstants.REQUEST_GET_AN_ITEM });

  try {
    const itemUri = `${itemConstants.ITEM_URI}/detail/${data?.id}`;

    const jsonResponse = yield* authenticatedRequest(itemUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: itemConstants.GET_AN_ITEM_SUCCESS,
      itemDetails: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, itemConstants.GET_AN_ITEM_ERROR, false);
  }
}

function* getDepartmentItems({ data }: GetDepartmentItemsAction) {
  yield put({ type: itemConstants.REQUEST_GET_DEPARTMENT_ITEMS });

  try {
    const user = yield* getStoredUser();
    const deptId = data?.departmentId || (user?.user as Record<string, unknown>)?.departmentId;
    if (!deptId) return; // Guard: skip fetch if no departmentId available
    let itemUri = `${itemConstants.ITEM_URI}/department/${deptId}`;
    if (data?.page) {
      itemUri = `${itemUri}?page=${data.page}`;
    }

    const jsonResponse = yield* authenticatedRequest(itemUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: itemConstants.GET_DEPARTMENT_ITEMS_SUCCESS,
      items: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, itemConstants.GET_DEPARTMENT_ITEMS_ERROR, false);
  }
}

function* getAllItems({ data }: GetAllItemsAction) {
  yield put({ type: itemConstants.REQUEST_GET_ALL_ITEMS });

  try {
    const params = new URLSearchParams({ page: String(data?.page ?? 1), limit: String(data?.limit ?? 10) });
    if (data?.search) params.set('search', data.search);
    if (data?.status) params.set('status', data.status);
    if (data?.departmentId) params.set('departmentId', String(data.departmentId));
    if (data?.storeId) params.set('storeId', String(data.storeId));
    if (data?.fragile) params.set('fragile', data.fragile);

    const itemUri = `${itemConstants.ITEM_URI}?${params.toString()}`;

    const jsonResponse = yield* authenticatedRequest(itemUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: itemConstants.GET_ALL_ITEMS_SUCCESS,
      items: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, itemConstants.GET_ALL_ITEMS_ERROR, false);
  }
}

function* searchItem({ data }: SearchItemAction) {
  yield put({ type: itemConstants.REQUEST_SEARCH_ITEM });

  try {
    const itemUri = data.departmentId
      ? `${itemConstants.ITEM_URI}/search?q=${data.text}&department=${data.departmentId}`
      : `${itemConstants.ITEM_URI}/search?q=${data.text}`;

    const jsonResponse = yield* authenticatedRequest(itemUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: itemConstants.SEARCH_ITEM_SUCCESS,
      item: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, itemConstants.SEARCH_ITEM_ERROR, false);
  }
}

function* createItem({ data }: CreateItemAction) {
  yield put({ type: itemConstants.REQUEST_CREATE_ITEM });

  try {
    if (data) {
      const itemUri = data?.id
        ? `${itemConstants.ITEM_URI}/update/${data.id}`
        : `${itemConstants.ITEM_URI}/new`;
      const { id, ...restData } = data;

      const jsonResponse = yield* authenticatedRequest(itemUri, {
        method: data?.id ? 'PATCH' : 'POST',
        body: JSON.stringify(id ? restData : data),
      });
      if (!jsonResponse) return;

      yield put({
        type: itemConstants.CREATE_ITEM_SUCCESS,
        item: jsonResponse?.data,
      });

      AppEmitter.emit(itemConstants.CREATE_ITEM_SUCCESS, jsonResponse?.data);

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse?.message as string) ?? 'Item created successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, itemConstants.CREATE_ITEM_ERROR);
  }
}

function* createItems({ data }: CreateItemsAction) {
  yield put({ type: itemConstants.REQUEST_CREATE_ITEM });

  try {
    if (data) {
      const itemUri = `${itemConstants.ITEM_URI}/multiple/new`;

      const jsonResponse = yield* authenticatedRequest(itemUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!jsonResponse) return;

      const user = yield* getStoredUser();

      yield put({
        type: itemConstants.CREATE_ITEM_SUCCESS,
        item: jsonResponse?.data,
      });

      yield put({
        type:
          (user?.user as Record<string, unknown>)?.roleId === 3
            ? itemConstants.GET_DEPARTMENT_ITEMS
            : itemConstants.GET_ALL_ITEMS,
      });

      AppEmitter.emit(itemConstants.CREATE_ITEMS_SUCCESS, jsonResponse);

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse?.message as string) ?? 'Items created successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, itemConstants.CREATE_ITEM_ERROR);
  }
}

function* updateItem({ data }: UpdateItemAction) {
  yield put({ type: itemConstants.REQUEST_UPDATE_ITEM });

  try {
    if (data) {
      const { itemId, ...restData } = data;
      const itemUri = `${itemConstants.ITEM_URI}/update/${itemId}`;

      const jsonResponse = yield* authenticatedRequest(itemUri, {
        method: 'PATCH',
        body: JSON.stringify(restData),
      });
      if (!jsonResponse) return;

      yield put({
        type: itemConstants.UPDATE_ITEM_SUCCESS,
        item: jsonResponse?.data,
      });

      AppEmitter.emit(itemConstants.UPDATE_ITEM_SUCCESS, jsonResponse?.data);

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse?.message as string) ?? 'Item updated successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, itemConstants.UPDATE_ITEM_ERROR);
  }
}

function* updateItemBasic({ data }: { type: string; data: { id: number; name: string; actualQuantity: number; departmentId: number; fragile: boolean } }) {
  yield put({ type: itemConstants.REQUEST_UPDATE_ITEM_BASIC });

  try {
    const { id, ...body } = data;
    const itemUri = `${itemConstants.ITEM_URI}/update/${id}`;

    const jsonResponse = yield* authenticatedRequest(itemUri, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    if (!jsonResponse) return;

    yield put({ type: itemConstants.UPDATE_ITEM_BASIC_SUCCESS });
    AppEmitter.emit(itemConstants.UPDATE_ITEM_BASIC_SUCCESS, jsonResponse);

    const payload: SetSnackBarPayload = {
      type: 'success',
      message: (jsonResponse?.message as string) ?? 'Item updated successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(error, itemConstants.UPDATE_ITEM_BASIC_ERROR);
  }
}

function* deleteItem({ data }: DeleteItemAction) {
  yield put({ type: itemConstants.REQUEST_DELETE_ITEM });

  try {
    if (data) {
      const itemUri = `${itemConstants.ITEM_URI}/delete/${data.id}`;

      const jsonResponse = yield* authenticatedRequest(itemUri, {
        method: 'DELETE',
      });
      if (!jsonResponse) return;

      yield put({
        type: itemConstants.DELETE_ITEM_SUCCESS,
        id: data.id,
      });

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse?.message as string) ?? 'Item deleted successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, itemConstants.DELETE_ITEM_ERROR);
  }
}

function* getAllDepartmentItemsWatcher() {
  yield takeLatest(
    itemConstants.GET_ALL_DEPARTMENT_ITEMS,
    getAllDepartmentItems
  );
}

function* getAnItemWatcher() {
  yield takeLatest(itemConstants.GET_AN_ITEM, getAnItem);
}
function* getDepartmentItemsWatcher() {
  yield takeLatest(itemConstants.GET_DEPARTMENT_ITEMS, getDepartmentItems);
}

function* getAllItemsWatcher() {
  yield takeLatest(itemConstants.GET_ALL_ITEMS, getAllItems);
}

function* searchItemWatcher() {
  yield takeLatest(itemConstants.SEARCH_ITEM, searchItem);
}

function* createItemWatcher() {
  yield takeLatest(itemConstants.CREATE_ITEM, createItem);
}
function* createItemsWatcher() {
  yield takeLatest(itemConstants.CREATE_ITEMS, createItems);
}

function* updateItemWatcher() {
  yield takeLatest(itemConstants.UPDATE_ITEM, updateItem);
}

function* updateItemBasicWatcher() {
  yield takeLatest(itemConstants.UPDATE_ITEM_BASIC, updateItemBasic);
}

function* deleteItemWatcher() {
  yield takeLatest(itemConstants.DELETE_ITEM, deleteItem);
}

export default function* rootSaga() {
  yield all([
    getAllDepartmentItemsWatcher(),
    getDepartmentItemsWatcher(),
    getAnItemWatcher(),
    getAllItemsWatcher(),
    searchItemWatcher(),
    createItemWatcher(),
    createItemsWatcher(),
    updateItemWatcher(),
    updateItemBasicWatcher(),
    deleteItemWatcher(),
  ]);
}
