import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants, itemConstants } from '@/constants';
// import { appActions } from '@/actions';
import {
  checkStatus,
  parseResponse,
  createRequest,
  createRequestWithToken,
  getObjectFromStorage,
  clearObjectFromStorage,
} from '@/utilities/helpers';
import { Item, SetSnackBarPayload } from '@/types';
import {
  appActions,
  CreateItemAction,
  GetAllDepartmentItemsAction,
  GetAllItemsAction,
  GetDepartmentItemsAction,
  SearchItemAction,
  UpdateItemAction,
} from '@/actions';
import { AppEmitter } from '@/controllers/EventEmitter';
// import { SetSnackBarPayload } from '@/types';
// import { AppEmitter } from '@/controllers/EventEmitter';

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

function* getAllDepartmentItems({ data }: GetAllDepartmentItemsAction) {
  yield put({ type: itemConstants.REQUEST_GET_ALL_DEPARTMENT_ITEMS });

  try {
    const itemUri = `${itemConstants.ITEM_URI}/all/${data}`;
    const itemReq = createRequest(itemUri, {
      method: 'GET',
    });

    const response: Item = yield call(fetch, itemReq);
    yield call(checkStatus, response as unknown as Response);

    const jsonResponse: ParsedResponse = yield call(
      parseResponse,
      response as unknown as Response
    );

    yield put({
      type: itemConstants.GET_ALL_DEPARTMENT_ITEMS_SUCCESS,
      items: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: itemConstants.GET_ALL_DEPARTMENT_ITEMS_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: itemConstants.GET_ALL_DEPARTMENT_ITEMS_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* getDepartmentItems({ data }: GetDepartmentItemsAction) {
  yield put({ type: itemConstants.REQUEST_GET_DEPARTMENT_ITEMS });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    let itemUri = `${itemConstants.ITEM_URI}/department/${data?.departmentId}`;
    if (data?.page) {
      itemUri = `${itemUri}?page=${data.page}`;
    }

    const requestFn = () =>
      createRequestWithToken(itemUri, { method: 'GET' })(user?.token as string);
    const itemReq: Request = yield call(requestFn);
    const response: Item = yield call(fetch, itemReq);

    if (response.status === 401) {
      yield call(clearObjectFromStorage, authConstants.USER_KEY);

      yield put({ type: authConstants.TOKEN_HAS_EXPIRED });
      return;
    }
    // const itemReq = createRequest(itemUri, {
    //   method: 'GET',
    // });

    // const response: Item = yield call(fetch, itemReq);
    yield call(checkStatus, response as unknown as Response);

    const jsonResponse: ParsedResponse = yield call(
      parseResponse,
      response as unknown as Response
    );

    yield put({
      type: itemConstants.GET_DEPARTMENT_ITEMS_SUCCESS,
      items: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: itemConstants.GET_DEPARTMENT_ITEMS_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: itemConstants.GET_DEPARTMENT_ITEMS_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* getAllItems({ data }: GetAllItemsAction) {
  yield put({ type: itemConstants.REQUEST_GET_ALL_ITEMS });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    let itemUri = `${itemConstants.ITEM_URI}`;

    if (data?.page) {
      itemUri = `${itemUri}?page=${data.page}`;
    }

    const requestFn = () =>
      createRequestWithToken(itemUri, { method: 'GET' })(user?.token as string);
    const itemReq: Request = yield call(requestFn);
    const response: Item = yield call(fetch, itemReq);

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
      type: itemConstants.GET_ALL_ITEMS_SUCCESS,
      items: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: itemConstants.GET_ALL_ITEMS_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: itemConstants.GET_ALL_ITEMS_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* searchItem({ data }: SearchItemAction) {
  yield put({ type: itemConstants.REQUEST_SEARCH_ITEM });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    const itemUri = `${itemConstants.ITEM_URI}/search?q=${data.text}`;

    const requestFn = () =>
      createRequestWithToken(itemUri, { method: 'GET' })(user?.token as string);
    const itemReq: Request = yield call(requestFn);
    const response: Item = yield call(fetch, itemReq);

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
      type: itemConstants.SEARCH_ITEM_SUCCESS,
      item: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: itemConstants.SEARCH_ITEM_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: itemConstants.SEARCH_ITEM_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* createItem({ data }: CreateItemAction) {
  yield put({ type: itemConstants.REQUEST_CREATE_ITEM });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );

    if (data) {
      const itemUri = `${itemConstants.ITEM_URI}/new`;
      const itemReq = createRequestWithToken(itemUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const req: Request = yield call(itemReq, user?.token as string);
      const response: Item = yield call(fetch, req);

      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: itemConstants.CREATE_ITEM_SUCCESS,
        item: jsonResponse?.data,
      });

      // yield put({
      //   type: itemConstants.GET_ITEMS,
      // });

      AppEmitter.emit(itemConstants.CREATE_ITEM_SUCCESS, jsonResponse?.data);

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: jsonResponse?.message ?? 'Item created successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: itemConstants.CREATE_ITEM_ERROR,
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
      type: itemConstants.CREATE_ITEM_ERROR,
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

function* updateItem({ data }: UpdateItemAction) {
  yield put({ type: itemConstants.REQUEST_UPDATE_ITEM });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );

    if (data) {
      const itemUri = `${itemConstants.ITEM_URI}/update/${data.itemId}`;
      const { itemId, ...restData } = data;

      const itemReq = createRequestWithToken(itemUri, {
        method: 'PATCH',
        body: JSON.stringify(restData),
      });
      const req: Request = yield call(itemReq, user?.token as string);
      const response: Item = yield call(fetch, req);

      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: itemConstants.UPDATE_ITEM_SUCCESS,
        item: jsonResponse?.data,
      });

      // yield put({
      //   type: itemConstants.GET_ITEMS,
      // });

      AppEmitter.emit(itemConstants.UPDATE_ITEM_SUCCESS, jsonResponse?.data);

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: jsonResponse?.message ?? 'Item updated successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: itemConstants.UPDATE_ITEM_ERROR,
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
      type: itemConstants.UPDATE_ITEM_ERROR,
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

function* getAllDepartmentItemsWatcher() {
  yield takeLatest(
    itemConstants.GET_ALL_DEPARTMENT_ITEMS,
    getAllDepartmentItems
  );
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

function* updateItemWatcher() {
  yield takeLatest(itemConstants.UPDATE_ITEM, updateItem);
}

export default function* rootSaga() {
  yield all([
    getAllDepartmentItemsWatcher(),
    getDepartmentItemsWatcher(),
    getAllItemsWatcher(),
    searchItemWatcher(),
    createItemWatcher(),
    updateItemWatcher(),
  ]);
}
