import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants, roleConstants } from '@/constants';
import {
  checkStatus,
  parseResponse,
  createRequestWithToken,
  getObjectFromStorage,
  clearObjectFromStorage,
} from '@/utilities/helpers';
import { Role } from '@/types';

interface User {
  user: { [key: string]: unknown };
  refreshToken: string;
  token: string;
}

interface ParsedResponse {
  message: string;
  error: string;
  items: {
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

function* getRoles() {
  yield put({ type: roleConstants.REQUEST_GET_ROLES });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    const storeUri = `${roleConstants.ROLE_URI}`;

    const requestFn = () =>
      createRequestWithToken(storeUri, { method: 'GET' })(
        user?.token as string
      );
    const storeReq: Request = yield call(requestFn);

    const response: Role = yield call(fetch, storeReq);
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
      type: roleConstants.GET_ROLES_SUCCESS,
      roles: jsonResponse?.items,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: roleConstants.GET_ROLES_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: roleConstants.GET_ROLES_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* getRolesWatcher() {
  yield takeLatest(roleConstants.GET_ROLES, getRoles);
}

export default function* rootSaga() {
  yield all([getRolesWatcher()]);
}
