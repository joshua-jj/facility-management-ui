import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants, departmentConstants } from '@/constants';
// import { appActions } from '@/actions';
import {
  checkStatus,
  parseResponse,
  createRequest,
  getObjectFromStorage,
  createRequestWithToken,
} from '@/utilities/helpers';
import { appActions, CreateDepartmentAction } from '@/actions';
import { SetSnackBarPayload, User } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';
// import { SetSnackBarPayload } from '@/types';
// import { AppEmitter } from '@/controllers/EventEmitter';

interface DepartmentData {
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

function* getAllDepartments() {
  yield put({ type: departmentConstants.REQUEST_GET_ALL_DEPARTMENTS });

  try {
    const departmentUri = `${departmentConstants.DEPARTMENT_URI}/all`;
    const departmentReq = createRequest(departmentUri, {
      method: 'GET',
    });

    const response: DepartmentData = yield call(fetch, departmentReq);
    yield call(checkStatus, response as unknown as Response);

    const jsonResponse: ParsedResponse = yield call(
      parseResponse,
      response as unknown as Response
    );

    yield put({
      type: departmentConstants.GET_ALL_DEPARTMENTS_SUCCESS,
      departments: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: departmentConstants.GET_ALL_DEPARTMENTS_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: departmentConstants.GET_ALL_DEPARTMENTS_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* createDepartment({ data }: CreateDepartmentAction) {
  yield put({ type: departmentConstants.REQUEST_CREATE_DEPARTMENT });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );

    if (data) {
      const userUri = `${departmentConstants.DEPARTMENT_URI}/new`;
      const userReq = createRequestWithToken(userUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const req: Request = yield call(userReq, user?.token as string);
      const response: DepartmentData = yield call(fetch, req);

      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: departmentConstants.CREATE_DEPARTMENT_SUCCESS,
        user: jsonResponse?.data,
      });

      yield put({
        type: departmentConstants.GET_ALL_DEPARTMENTS,
      });

      AppEmitter.emit(
        departmentConstants.CREATE_DEPARTMENT_SUCCESS,
        jsonResponse
      );
    }
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: departmentConstants.CREATE_DEPARTMENT_ERROR,
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
      type: departmentConstants.CREATE_DEPARTMENT_ERROR,
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

function* getAllDepartmentsWatcher() {
  yield takeLatest(departmentConstants.GET_ALL_DEPARTMENTS, getAllDepartments);
}

function* createDepartmentWatcher() {
  yield takeLatest(departmentConstants.CREATE_DEPARTMENT, createDepartment);
}

export default function* rootSaga() {
  yield all([getAllDepartmentsWatcher(), createDepartmentWatcher()]);
}
