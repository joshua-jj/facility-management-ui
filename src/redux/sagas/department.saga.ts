import { call, put, takeLatest, all } from 'typed-redux-saga';
import { departmentConstants } from '@/constants';
import { CreateDepartmentAction, UpdateDepartmentAction, ActivateDepartmentAction, DeactivateDepartmentAction } from '@/actions';
import { AppEmitter } from '@/controllers/EventEmitter';
import { checkStatus, parseResponse, createRequest } from '@/utilities/helpers';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

interface GetDepartmentsAction {
  type: string;
  data?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    hasHod?: string;
  };
}

function* getAllDepartments({ data }: GetDepartmentsAction) {
  yield put({ type: departmentConstants.REQUEST_GET_ALL_DEPARTMENTS });

  try {
    const page = data?.page ?? 1;
    const limit = data?.limit ?? 10;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (data?.search) params.set('search', data.search);
    if (data?.status) params.set('status', data.status);
    if (data?.hasHod) params.set('hasHod', data.hasHod);

    const departmentUri = `${departmentConstants.DEPARTMENT_URI}?${params.toString()}`;

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

function* updateDepartment({ data }: UpdateDepartmentAction) {
  yield put({ type: departmentConstants.REQUEST_UPDATE_DEPARTMENT });

  try {
    const { id, ...body } = data;
    const uri = `${departmentConstants.DEPARTMENT_URI}/update/${id}`;

    const jsonResponse = yield* authenticatedRequest(uri, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    if (!jsonResponse) return;

    yield put({ type: departmentConstants.UPDATE_DEPARTMENT_SUCCESS });
    AppEmitter.emit(departmentConstants.UPDATE_DEPARTMENT_SUCCESS, jsonResponse);
  } catch (error: unknown) {
    yield* handleSagaError(error, departmentConstants.UPDATE_DEPARTMENT_ERROR);
  }
}

function* activateDepartment({ id }: ActivateDepartmentAction) {
  yield put({ type: departmentConstants.REQUEST_ACTIVATE_DEPARTMENT });

  try {
    const uri = `${departmentConstants.DEPARTMENT_URI}/activate`;

    const jsonResponse = yield* authenticatedRequest(uri, {
      method: 'PATCH',
      body: JSON.stringify({ ids: [id] }),
    });
    if (!jsonResponse) return;

    yield put({ type: departmentConstants.ACTIVATE_DEPARTMENT_SUCCESS });
    AppEmitter.emit(departmentConstants.ACTIVATE_DEPARTMENT_SUCCESS, jsonResponse);
  } catch (error: unknown) {
    yield* handleSagaError(error, departmentConstants.ACTIVATE_DEPARTMENT_ERROR);
  }
}

function* deactivateDepartment({ id }: DeactivateDepartmentAction) {
  yield put({ type: departmentConstants.REQUEST_DEACTIVATE_DEPARTMENT });

  try {
    const uri = `${departmentConstants.DEPARTMENT_URI}/deactivate`;

    const jsonResponse = yield* authenticatedRequest(uri, {
      method: 'PATCH',
      body: JSON.stringify({ ids: [id] }),
    });
    if (!jsonResponse) return;

    yield put({ type: departmentConstants.DEACTIVATE_DEPARTMENT_SUCCESS });
    AppEmitter.emit(departmentConstants.DEACTIVATE_DEPARTMENT_SUCCESS, jsonResponse);
  } catch (error: unknown) {
    yield* handleSagaError(error, departmentConstants.DEACTIVATE_DEPARTMENT_ERROR);
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

function* updateDepartmentWatcher() {
  yield takeLatest(departmentConstants.UPDATE_DEPARTMENT, updateDepartment);
}

function* activateDepartmentWatcher() {
  yield takeLatest(departmentConstants.ACTIVATE_DEPARTMENT, activateDepartment);
}

function* deactivateDepartmentWatcher() {
  yield takeLatest(departmentConstants.DEACTIVATE_DEPARTMENT, deactivateDepartment);
}

export default function* rootSaga() {
  yield all([
    getAllDepartmentsWatcher(),
    getUnpaginatedDepartmentsWatcher(),
    createDepartmentWatcher(),
    updateDepartmentWatcher(),
    activateDepartmentWatcher(),
    deactivateDepartmentWatcher(),
  ]);
}
