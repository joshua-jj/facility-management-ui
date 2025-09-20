import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants, generatorConstants } from '@/constants';
import {
  checkStatus,
  parseResponse,
  createRequestWithToken,
  getObjectFromStorage,
  clearObjectFromStorage,
} from '@/utilities/helpers';
import { GeneratorLog, SetSnackBarPayload } from '@/types';
import {
  appActions,
  CreateGeneratorLogAction,
  GetGeneratorLogsAction,
  SearchGeneratorLogAction,
} from '@/actions';
import { AppEmitter } from '@/controllers/EventEmitter';

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

function* getGeneratorLogs({ data }: GetGeneratorLogsAction) {
  yield put({ type: generatorConstants.REQUEST_GET_GENERATOR_LOGS });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    let logsUri = `${generatorConstants.GENERATOR_URI}`;

    if (data?.page) {
      logsUri = `${logsUri}?page=${data.page}`;
    }

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

function* createGeneratorLog({ data }: CreateGeneratorLogAction) {
  yield put({ type: generatorConstants.REQUEST_CREATE_GENERATOR_LOG });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );

    if (data) {
      const userUri = `${generatorConstants.GENERATOR_URI}/new`;
      const userReq = createRequestWithToken(userUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const req: Request = yield call(userReq, user?.token as string);
      const response: GeneratorLog = yield call(fetch, req);

      yield call(checkStatus, response as unknown as Response);

      const jsonResponse: ParsedResponse = yield call(
        parseResponse,
        response as unknown as Response
      );

      yield put({
        type: generatorConstants.CREATE_GENERATOR_LOG_SUCCESS,
        user: jsonResponse?.data,
      });

      yield put({
        type: generatorConstants.GET_GENERATOR_LOGS,
      });

      AppEmitter.emit(
        generatorConstants.CREATE_GENERATOR_LOG_SUCCESS,
        jsonResponse
      );
      const payload: SetSnackBarPayload = {
        type: 'success',
        message: jsonResponse?.message ?? 'Generator log created successfully',
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
        type: generatorConstants.CREATE_GENERATOR_LOG_ERROR,
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
      type: generatorConstants.CREATE_GENERATOR_LOG_ERROR,
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

function* searchGeneratorLog({ data }: SearchGeneratorLogAction) {
  yield put({ type: generatorConstants.REQUEST_SEARCH_GENERATOR_LOG });

  try {
    const user: User | null = yield call(
      getObjectFromStorage,
      authConstants.USER_KEY
    );
    const logsUri = `${generatorConstants.GENERATOR_URI}/search?q=${data.text}`;

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
      type: generatorConstants.SEARCH_GENERATOR_LOG_SUCCESS,
      log: jsonResponse?.data,
    });
  } catch (error: unknown) {
    if ((error as ApiError)?.response) {
      const res: ParsedResponse = yield call(
        parseResponse,
        (error as ApiError).response as unknown as Response
      );
      yield put({
        type: generatorConstants.SEARCH_GENERATOR_LOG_ERROR,
        error: res?.error,
      });

      return;
    }
    yield put({
      type: generatorConstants.SEARCH_GENERATOR_LOG_ERROR,
      error:
        ((error as ApiError)?.error || (error as ApiError)?.message) ??
        'Something went wrong',
    });
  }
}

function* getGeneratorLogsWatcher() {
  yield takeLatest(generatorConstants.GET_GENERATOR_LOGS, getGeneratorLogs);
}

function* createGeneratorLogWatcher() {
  yield takeLatest(generatorConstants.CREATE_GENERATOR_LOG, createGeneratorLog);
}

function* searchGeneratorLogWatcher() {
  yield takeLatest(generatorConstants.SEARCH_GENERATOR_LOG, searchGeneratorLog);
}

export default function* rootSaga() {
  yield all([
    getGeneratorLogsWatcher(),
    createGeneratorLogWatcher(),
    searchGeneratorLogWatcher(),
  ]);
}
