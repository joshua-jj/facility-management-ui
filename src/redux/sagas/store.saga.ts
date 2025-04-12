import { call, put, takeLatest, all } from 'typed-redux-saga';
import { storeConstants } from '@/constants';
import { checkStatus, parseResponse, createRequest } from '@/utilities/helpers';
import { Store } from '@/types';

// interface DepartmentData {
//   token: string;
//   redirect: string;
//   password: string;
//   nonce?: string;
// }

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

function* getStores() {
  yield put({ type: storeConstants.REQUEST_GET_STORES });

  try {
    const departmentUri = `${storeConstants.STORE_URI}`;
    const departmentReq = createRequest(departmentUri, {
      method: 'GET',
    });

    const response: Store = yield call(fetch, departmentReq);
    yield call(checkStatus, response as unknown as Response);

    const jsonResponse: ParsedResponse = yield call(
      parseResponse,
      response as unknown as Response
    );

    yield put({
      type: storeConstants.GET_STORES_SUCCESS,
      stores: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: storeConstants.GET_STORES_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: storeConstants.GET_STORES_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* getStoresWatcher() {
  yield takeLatest(storeConstants.GET_STORES, getStores);
}

export default function* rootSaga() {
  yield all([getStoresWatcher()]);
}
