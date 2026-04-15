import { call, put, takeLatest, all } from 'typed-redux-saga';
import { departmentConstants } from '@/constants';
import { CreateDepartmentAction } from '@/actions';
import { AppEmitter } from '@/controllers/EventEmitter';
import { checkStatus, parseResponse, createRequest } from '@/utilities/helpers';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

interface GetDepartmentsAction {
  type: string;
  data?: { page?: number };
}

function* getAllDepartments({ data }: GetDepartmentsAction) {
  yield put({ type: departmentConstants.REQUEST_GET_ALL_DEPARTMENTS });

  try {
    const page = data?.page ?? 1;
    const departmentUri = `${departmentConstants.DEPARTMENT_URI}?page=${page}&limit=10`;

    const jsonResponse = yield* authenticatedRequest(departmentUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: departmentConstants.GET_ALL_DEPARTMENTS_SUCCESS,
      departments: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, departmentConstants.GET_ALL_DEPARTMENTS_ERROR, false);
  }
}

function* createDepartment({ data }: CreateDepartmentAction) {
  yield put({ type: departmentConstants.REQUEST_CREATE_DEPARTMENT });

  try {
    if (data) {
      const departmentUri = `${departmentConstants.DEPARTMENT_URI}/new`;

      const jsonResponse = yield* authenticatedRequest(departmentUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!jsonResponse) return;

      yield put({
        type: departmentConstants.CREATE_DEPARTMENT_SUCCESS,
        user: jsonResponse?.data,
      });

      yield put({ type: departmentConstants.GET_ALL_DEPARTMENTS });

      AppEmitter.emit(departmentConstants.CREATE_DEPARTMENT_SUCCESS, jsonResponse);
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, departmentConstants.CREATE_DEPARTMENT_ERROR);
  }
}

function* getUnpaginatedDepartments() {
  yield put({ type: departmentConstants.REQUEST_GET_UNPAGINATED_DEPARTMENTS });

  try {
    const departmentUri = `${departmentConstants.DEPARTMENT_URI}/all`;
    const departmentReq = createRequest(departmentUri, { method: 'GET' });

    const response: Response = yield call(fetch, departmentReq);
    yield call(checkStatus, response);

    // @ts-expect-error legacy saga pattern
    const jsonResponse = yield call(parseResponse, response);

    yield put({
      type: departmentConstants.GET_UNPAGINATED_DEPARTMENTS_SUCCESS,
      departments: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, departmentConstants.GET_UNPAGINATED_DEPARTMENTS_ERROR, false);
  }
}

function* getAllDepartmentsWatcher() {
  yield takeLatest(departmentConstants.GET_ALL_DEPARTMENTS, getAllDepartments);
}

function* getUnpaginatedDepartmentsWatcher() {
  yield takeLatest(departmentConstants.GET_UNPAGINATED_DEPARTMENTS, getUnpaginatedDepartments);
}

function* createDepartmentWatcher() {
  yield takeLatest(departmentConstants.CREATE_DEPARTMENT, createDepartment);
}

export default function* rootSaga() {
  yield all([getAllDepartmentsWatcher(), getUnpaginatedDepartmentsWatcher(), createDepartmentWatcher()]);
}
