import { call, put, takeLatest, all } from 'typed-redux-saga';
import {
  itemConstants,
} from '@/constants';
// import { appActions } from '@/actions';
import {
  checkStatus,
  parseResponse,
  createRequest,
} from '@/utilities/helpers';
// import { SetSnackBarPayload } from '@/types';
// import { AppEmitter } from '@/controllers/EventEmitter';

interface GetDepartmentItemsAction {
    type: typeof itemConstants.GET_DEPARTMENT_ITEMS;
    data: string;
  }

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

// function* getDepartmentItems() {  
function* getDepartmentItems({ data }: GetDepartmentItemsAction) {    
    console.log('got hereeeee');
    console.log('getDepartmentItems', data);
    
  
  yield put({ type: itemConstants.REQUEST_GET_DEPARTMENT_ITEMS });

  try {
      const itemUri = `${itemConstants.ITEM_URI}/all/${data}`;
      const itemReq = createRequest(itemUri, {
        method: 'GET',
      });

      const response: DepartmentData = yield call(fetch, itemReq);
      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response,
      );

      yield put({
        type: itemConstants.GET_DEPARTMENT_ITEMS_SUCCESS,
        items: jsonResponse?.data,
      });

  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response,
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

function* getDepartmentItemsWatcher() {
  yield takeLatest(itemConstants.GET_DEPARTMENT_ITEMS, getDepartmentItems);
}

export default function* rootSaga() {
  yield all([getDepartmentItemsWatcher()]);
}
