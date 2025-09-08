import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants, requestConstants } from '@/constants';
import {
  appActions,
  AssignRequestAction,
  CreateRequestAction,
  GetAllRequestsAction,
  GetAssignedRequestsAction,
  GetDepartmentRequestsAction,
  ReleaseItemsAction,
  ReturnItemsAction,
  UpdateRequestStatusAction,
} from '@/actions';
import {
  checkStatus,
  parseResponse,
  createRequest,
  getObjectFromStorage,
  createRequestWithToken,
  clearObjectFromStorage,
} from '@/utilities/helpers';
import { Request as CustomRequest, SetSnackBarPayload } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';

interface User {
  user: { [key: string]: unknown };
  refreshToken: string;
  token: string;
}

interface ResetPasswordData {
  token: string;
  redirect: string;
  password: string;
  nonce?: string;
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

function* createNewRequest({ data }: CreateRequestAction) {
  yield put({ type: requestConstants.REQUEST_CREATE_REQUEST });

  try {
    if (data) {
      const requestUri = `${requestConstants.REQUEST_URI}/new`;
      const requestReq = createRequest(requestUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const response: ResetPasswordData = yield call(fetch, requestReq);
      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: requestConstants.CREATE_REQUEST_SUCCESS,
        request: jsonResponse?.data,
      });

      AppEmitter.emit(requestConstants.CREATE_REQUEST_SUCCESS, jsonResponse);
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: requestConstants.CREATE_REQUEST_ERROR,
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
      type: requestConstants.CREATE_REQUEST_ERROR,
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

function* getAllRequests({ data }: GetAllRequestsAction) {
  yield put({ type: requestConstants.REQUEST_GET_ALL_REQUESTS });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    let reqUri = `${requestConstants.REQUEST_URI}`;
    if (data?.page) {
      reqUri = `${reqUri}?page=${data.page}`;
    }

    const requestFn = () =>
      createRequestWithToken(reqUri, { method: 'GET' })(user?.token as string);
    const reqReq: Request = yield call(requestFn);

    const response: CustomRequest = yield call(fetch, reqReq);
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
      type: requestConstants.GET_ALL_REQUESTS_SUCCESS,
      requests: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: requestConstants.GET_ALL_REQUESTS_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: requestConstants.GET_ALL_REQUESTS_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* getDepartmentRequests({ data }: GetDepartmentRequestsAction) {
  yield put({ type: requestConstants.REQUEST_GET_DEPARTMENT_REQUESTS });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    let reqUri = `${requestConstants.REQUEST_URI}?id=${data?.departmentId}`;
    if (data?.page) {
      reqUri = `${reqUri}?page=${data.page}`;
    }
    const requestFn = () =>
      createRequestWithToken(reqUri, { method: 'GET' })(user?.token as string);
    const storeReq: Request = yield call(requestFn);

    const response: CustomRequest = yield call(fetch, storeReq);
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
      type: requestConstants.GET_DEPARTMENT_REQUESTS_SUCCESS,
      requests: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: requestConstants.GET_DEPARTMENT_REQUESTS_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: requestConstants.GET_DEPARTMENT_REQUESTS_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* getAssignedRequests({ data }: GetAssignedRequestsAction) {
  yield put({ type: requestConstants.REQUEST_GET_ASSIGNED_REQUESTS });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    let reqUri = `${requestConstants.REQUEST_URI}/assignee/${data?.userId}`;
    if (data?.page) {
      reqUri = `${reqUri}?page=${data.page}`;
    }
    const requestFn = () =>
      createRequestWithToken(reqUri, { method: 'GET' })(user?.token as string);
    const storeReq: Request = yield call(requestFn);

    const response: CustomRequest = yield call(fetch, storeReq);
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
      type: requestConstants.GET_ASSIGNED_REQUESTS_SUCCESS,
      requests: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: requestConstants.GET_ASSIGNED_REQUESTS_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: requestConstants.GET_ASSIGNED_REQUESTS_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* updateRequestStatus({ data }: UpdateRequestStatusAction) {
  yield put({ type: requestConstants.REQUEST_UPDATE_REQUEST_STATUS });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    if (data) {
      const requestUri = `${requestConstants.REQUEST_URI}/${data?.status}/${data?.requestId}`;
      const requestReq = createRequestWithToken(requestUri, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      const req: Request = yield call(requestReq, user?.token as string);
      const response: CustomRequest = yield call(fetch, req);

      // const response: ResetPasswordData = yield call(fetch, requestReq);
      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

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
        message: jsonResponse?.message ?? 'Request approved successfully',
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
        type: requestConstants.UPDATE_REQUEST_STATUS_ERROR,
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
      type: requestConstants.UPDATE_REQUEST_STATUS_ERROR,
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

function* assignRequest({ data }: AssignRequestAction) {
  yield put({ type: requestConstants.REQUEST_ASSIGN_REQUEST });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    if (data) {
      const { requestId, ...restData } = data;
      const requestUri = `${requestConstants.REQUEST_URI}/assign/${requestId}`;
      const requestReq = createRequestWithToken(requestUri, {
        method: 'PATCH',
        body: JSON.stringify(restData),
      });
      const req: Request = yield call(requestReq, user?.token as string);
      const response: CustomRequest = yield call(fetch, req);

      // const response: ResetPasswordData = yield call(fetch, requestReq);
      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: requestConstants.ASSIGN_REQUEST_SUCCESS,
        request: jsonResponse?.data,
      });

      AppEmitter.emit(requestConstants.ASSIGN_REQUEST_SUCCESS, jsonResponse);

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: jsonResponse?.message ?? 'Request assigned successfully',
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
        type: requestConstants.ASSIGN_REQUEST_ERROR,
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
      type: requestConstants.ASSIGN_REQUEST_ERROR,
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

function* releaseRequestItems({ data }: ReleaseItemsAction) {
  yield put({ type: requestConstants.REQUEST_RELEASE_REQUEST_ITEMS });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    if (data) {
      const requestUri = `${requestConstants.REQUEST_URI}/release/${data?.requestId}`;
      const { requestId, ...restData } = data;
      const requestReq = createRequestWithToken(requestUri, {
        method: 'PATCH',
        body: JSON.stringify(restData),
      });
      const req: Request = yield call(requestReq, user?.token as string);
      const response: CustomRequest = yield call(fetch, req);

      // const response: ResetPasswordData = yield call(fetch, requestReq);
      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

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
        message: jsonResponse?.message ?? 'Request items released successfully',
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
        type: requestConstants.RELEASE_REQUEST_ITEMS_ERROR,
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
      type: requestConstants.RELEASE_REQUEST_ITEMS_ERROR,
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

function* returnRequestItems({ data }: ReturnItemsAction) {
  yield put({ type: requestConstants.REQUEST_RETURN_REQUEST_ITEMS });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    if (data) {
      const requestUri = `${requestConstants.REQUEST_URI}/return-item/${data?.requestId}`;
      const { requestId, ...restData } = data;

      const requestReq = createRequestWithToken(requestUri, {
        method: 'PATCH',
        body: JSON.stringify(restData),
      });
      const req: Request = yield call(requestReq, user?.token as string);
      const response: CustomRequest = yield call(fetch, req);

      // const response: ResetPasswordData = yield call(fetch, requestReq);
      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

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
        message: jsonResponse?.message ?? 'Request items returned successfully',
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
        type: requestConstants.RETURN_REQUEST_ITEMS_ERROR,
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
      type: requestConstants.RETURN_REQUEST_ITEMS_ERROR,
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
