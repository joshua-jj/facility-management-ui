import { call, put, takeLatest, all } from 'typed-redux-saga';
import {
  departmentConstants,
} from '@/constants';
// import { appActions } from '@/actions';
import {
  checkStatus,
  parseResponse,
  createRequest,
} from '@/utilities/helpers';
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
        response as unknown as Response,
      );

      yield put({
        type: departmentConstants.GET_ALL_DEPARTMENTS_SUCCESS,
        departments: jsonResponse?.data,
      });

  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response,
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

function* getAllDepartmentsWatcher() {
  yield takeLatest(departmentConstants.GET_ALL_DEPARTMENTS, getAllDepartments);
}

export default function* rootSaga() {
  yield all([getAllDepartmentsWatcher()]);
}
