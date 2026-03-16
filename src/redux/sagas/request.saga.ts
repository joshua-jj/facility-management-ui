import { call, put, takeLatest, all } from 'typed-redux-saga';
import { requestConstants } from '@/constants';
import {
  appActions,
  CreateRequestAction,
  GetAllRequestsAction,
  GetAssignedRequestsAction,
  GetDepartmentRequestsAction,
  ReleaseItemsAction,
  ReturnItemsAction,
  UpdateRequestStatusAction,
  AssignRequestAction,
} from '@/actions';
import { checkStatus, parseResponse, createRequest } from '@/utilities/helpers';
import { SetSnackBarPayload } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

function* createNewRequest({ data }: CreateRequestAction) {
  yield put({ type: requestConstants.REQUEST_CREATE_REQUEST });

  try {
    if (data) {
      const requestUri = `${requestConstants.REQUEST_URI}/new`;
      const requestReq = createRequest(requestUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const response: Response = yield call(fetch, requestReq);
      yield call(checkStatus, response);

      // @ts-expect-error legacy saga pattern
      const jsonResponse = yield call(parseResponse, response);

      yield put({
        type: requestConstants.CREATE_REQUEST_SUCCESS,
        request: jsonResponse?.data,
      });

      AppEmitter.emit(requestConstants.CREATE_REQUEST_SUCCESS, jsonResponse);
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, requestConstants.CREATE_REQUEST_ERROR);
  }
}

function* getAllRequests({ data }: GetAllRequestsAction) {
  yield put({ type: requestConstants.REQUEST_GET_ALL_REQUESTS });

  try {
    let reqUri = `${requestConstants.REQUEST_URI}`;
    if (data?.page) {
      reqUri = `${reqUri}?page=${data.page}`;
    }

    const jsonResponse = yield* authenticatedRequest(reqUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: requestConstants.GET_ALL_REQUESTS_SUCCESS,
      requests: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, requestConstants.GET_ALL_REQUESTS_ERROR, false);
  }
}

function* getDepartmentRequests({ data }: GetDepartmentRequestsAction) {
  yield put({ type: requestConstants.REQUEST_GET_DEPARTMENT_REQUESTS });

  try {
    let reqUri = `${requestConstants.REQUEST_URI}?id=${data?.departmentId}`;
    if (data?.page) {
      reqUri = `${reqUri}&page=${data.page}`;
    }

    const jsonResponse = yield* authenticatedRequest(reqUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: requestConstants.GET_DEPARTMENT_REQUESTS_SUCCESS,
      requests: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, requestConstants.GET_DEPARTMENT_REQUESTS_ERROR, false);
  }
}

function* getAssignedRequests({ data }: GetAssignedRequestsAction) {
  yield put({ type: requestConstants.REQUEST_GET_ASSIGNED_REQUESTS });

  try {
    let reqUri = `${requestConstants.REQUEST_URI}/assignee/${data?.userId}`;
    if (data?.page) {
      reqUri = `${reqUri}?page=${data.page}`;
    }

    const jsonResponse = yield* authenticatedRequest(reqUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: requestConstants.GET_ASSIGNED_REQUESTS_SUCCESS,
      requests: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, requestConstants.GET_ASSIGNED_REQUESTS_ERROR, false);
  }
}

function* updateRequestStatus({ data }: UpdateRequestStatusAction) {
  yield put({ type: requestConstants.REQUEST_UPDATE_REQUEST_STATUS });

  try {
    if (data) {
      const requestUri = `${requestConstants.REQUEST_URI}/${data?.status}/${data?.requestId}`;

      const jsonResponse = yield* authenticatedRequest(requestUri, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!jsonResponse) return;

      yield put({
        type: requestConstants.UPDATE_REQUEST_STATUS_SUCCESS,
        request: jsonResponse?.data,
      });

      AppEmitter.emit(
        requestConstants.UPDATE_REQUEST_STATUS_SUCCESS,
        jsonResponse
      );

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse?.message as string) ?? 'Request approved successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, requestConstants.UPDATE_REQUEST_STATUS_ERROR);
  }
}

function* assignRequest({ data }: AssignRequestAction) {
  yield put({ type: requestConstants.REQUEST_ASSIGN_REQUEST });

  try {
    if (data) {
      const { requestId, ...restData } = data;
      const requestUri = `${requestConstants.REQUEST_URI}/assign/${requestId}`;

      const jsonResponse = yield* authenticatedRequest(requestUri, {
        method: 'PATCH',
        body: JSON.stringify(restData),
      });
      if (!jsonResponse) return;

      yield put({
        type: requestConstants.ASSIGN_REQUEST_SUCCESS,
        request: jsonResponse?.data,
      });

      AppEmitter.emit(requestConstants.ASSIGN_REQUEST_SUCCESS, jsonResponse);

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse?.message as string) ?? 'Request assigned successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, requestConstants.ASSIGN_REQUEST_ERROR);
  }
}

function* releaseRequestItems({ data }: ReleaseItemsAction) {
  yield put({ type: requestConstants.REQUEST_RELEASE_REQUEST_ITEMS });

  try {
    if (data) {
      const { requestId, ...restData } = data;
      const requestUri = `${requestConstants.REQUEST_URI}/release/${requestId}`;

      const jsonResponse = yield* authenticatedRequest(requestUri, {
        method: 'PATCH',
        body: JSON.stringify(restData),
      });
      if (!jsonResponse) return;

      yield put({
        type: requestConstants.RELEASE_REQUEST_ITEMS_SUCCESS,
        request: jsonResponse?.data,
      });

      AppEmitter.emit(
        requestConstants.RELEASE_REQUEST_ITEMS_SUCCESS,
        jsonResponse
      );

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse?.message as string) ?? 'Request items released successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, requestConstants.RELEASE_REQUEST_ITEMS_ERROR);
  }
}

function* returnRequestItems({ data }: ReturnItemsAction) {
  yield put({ type: requestConstants.REQUEST_RETURN_REQUEST_ITEMS });

  try {
    if (data) {
      const { requestId, ...restData } = data;
      const requestUri = `${requestConstants.REQUEST_URI}/return-item/${requestId}`;

      const jsonResponse = yield* authenticatedRequest(requestUri, {
        method: 'PATCH',
        body: JSON.stringify(restData),
      });
      if (!jsonResponse) return;

      yield put({
        type: requestConstants.RETURN_REQUEST_ITEMS_SUCCESS,
        request: jsonResponse?.data,
      });

      AppEmitter.emit(
        requestConstants.RETURN_REQUEST_ITEMS_SUCCESS,
        jsonResponse
      );

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse?.message as string) ?? 'Request items returned successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, requestConstants.RETURN_REQUEST_ITEMS_ERROR);
  }
}

function* createNewRequestWatcher() {
  yield takeLatest(requestConstants.CREATE_REQUEST, createNewRequest);
}

function* getAllRequestsWatcher() {
  yield takeLatest(requestConstants.GET_ALL_REQUESTS, getAllRequests);
}

function* getDepartmentRequestsWatcher() {
  yield takeLatest(
    requestConstants.GET_DEPARTMENT_REQUESTS,
    getDepartmentRequests
  );
}

function* getAssignedRequestsWatcher() {
  yield takeLatest(requestConstants.GET_ASSIGNED_REQUESTS, getAssignedRequests);
}

function* updateRequestStatusWatcher() {
  yield takeLatest(requestConstants.UPDATE_REQUEST_STATUS, updateRequestStatus);
}

function* assignRequestWatcher() {
  yield takeLatest(requestConstants.ASSIGN_REQUEST, assignRequest);
}

function* releaseRequestItemsWatcher() {
  yield takeLatest(requestConstants.RELEASE_REQUEST_ITEMS, releaseRequestItems);
}

function* returnRequestItemsWatcher() {
  yield takeLatest(requestConstants.RETURN_REQUEST_ITEMS, returnRequestItems);
}

export default function* rootSaga() {
  yield all([
    createNewRequestWatcher(),
    getAllRequestsWatcher(),
    getDepartmentRequestsWatcher(),
    getAssignedRequestsWatcher(),
    updateRequestStatusWatcher(),
    assignRequestWatcher(),
    releaseRequestItemsWatcher(),
    returnRequestItemsWatcher(),
  ]);
}
