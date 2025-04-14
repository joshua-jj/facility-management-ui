import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants, generatorConstants } from '@/constants';
import {
  checkStatus,
  parseResponse,
  createRequestWithToken,
  getObjectFromStorage,
  clearObjectFromStorage,
} from '@/utilities/helpers';
import { GeneratorLog } from '@/types';

interface User {
  user: { [key: string]: unknown };
  refreshToken: string;
  token: string;
}

interface ParsedResponse {
  message: string;
  error: string;
  data: {
    items: { [key: string]: unknown };
    links: { [key: string]: unknown };
    meta: { [key: string]: unknown };
  };
}

interface ApiError {
  response?: Response;
  message?: string;
  error?: string;
}

function* getGeneratorLogs() {
  yield put({ type: generatorConstants.REQUEST_GET_GENERATOR_LOGS });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    const logsUri = `${generatorConstants.GENERATOR_URI}`;

    const requestFn = () =>
      createRequestWithToken(logsUri, { method: 'GET' })(user?.token as string);
    const logsReq: Request = yield call(requestFn);

    const response: GeneratorLog = yield call(fetch, logsReq);

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
      type: generatorConstants.GET_GENERATOR_LOGS_SUCCESS,
      logs: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: generatorConstants.GET_GENERATOR_LOGS_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: generatorConstants.GET_GENERATOR_LOGS_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* getGeneratorLogsWatcher() {
  yield takeLatest(generatorConstants.GET_GENERATOR_LOGS, getGeneratorLogs);
}

export default function* rootSaga() {
  yield all([getGeneratorLogsWatcher()]);
}
