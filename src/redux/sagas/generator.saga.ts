import { put, takeLatest, all } from 'typed-redux-saga';
import { generatorConstants } from '@/constants';
import { SetSnackBarPayload } from '@/types';
import {
  appActions,
  CreateGeneratorLogAction,
  GetGeneratorLogsAction,
  SearchGeneratorLogAction,
  UpdateGeneratorLogAction,
} from '@/actions';
import { AppEmitter } from '@/controllers/EventEmitter';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

function* getGeneratorLogs({ data }: GetGeneratorLogsAction) {
  yield put({ type: generatorConstants.REQUEST_GET_GENERATOR_LOGS });

  try {
    const logsUri = `${generatorConstants.GENERATOR_URI}?page=${data?.page ?? 1}&limit=10`;


    const jsonResponse = yield* authenticatedRequest(logsUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: generatorConstants.GET_GENERATOR_LOGS_SUCCESS,
      logs: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, generatorConstants.GET_GENERATOR_LOGS_ERROR, false);
  }
}

function* createGeneratorLog({ data }: CreateGeneratorLogAction) {
  yield put({ type: generatorConstants.REQUEST_CREATE_GENERATOR_LOG });

  try {
    if (data) {
      const logUri = `${generatorConstants.GENERATOR_URI}/new`;

      const jsonResponse = yield* authenticatedRequest(logUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!jsonResponse) return;

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
        message: (jsonResponse?.message as string) ?? 'Generator log created successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, generatorConstants.CREATE_GENERATOR_LOG_ERROR);
  }
}

function* updateGeneratorLog({ data }: UpdateGeneratorLogAction) {
  yield put({ type: generatorConstants.REQUEST_UPDATE_GENERATOR_LOG });

  try {
    if (data) {
      const { id, ...restData } = data;

      const logUri = `${generatorConstants.GENERATOR_URI}/update/${id}`;

      const jsonResponse = yield* authenticatedRequest(logUri, {
        method: 'PATCH',
        body: JSON.stringify(restData),
      });
      if (!jsonResponse) return;

      yield put({
        type: generatorConstants.UPDATE_GENERATOR_LOG_SUCCESS,
        user: jsonResponse?.data,
      });

      yield put({
        type: generatorConstants.GET_GENERATOR_LOGS,
      });

      AppEmitter.emit(
        generatorConstants.UPDATE_GENERATOR_LOG_SUCCESS,
        jsonResponse
      );

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse?.message as string) ?? 'Generator log updated successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, generatorConstants.UPDATE_GENERATOR_LOG_ERROR);
  }
}

function* searchGeneratorLog({ data }: SearchGeneratorLogAction) {
  yield put({ type: generatorConstants.REQUEST_SEARCH_GENERATOR_LOG });

  try {
    const logsUri = `${generatorConstants.GENERATOR_URI}/search?q=${data.text}`;

    const jsonResponse = yield* authenticatedRequest(logsUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: generatorConstants.SEARCH_GENERATOR_LOG_SUCCESS,
      log: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, generatorConstants.SEARCH_GENERATOR_LOG_ERROR, false);
  }
}

function* getGeneratorLogsWatcher() {
  yield takeLatest(generatorConstants.GET_GENERATOR_LOGS, getGeneratorLogs);
}

function* createGeneratorLogWatcher() {
  yield takeLatest(generatorConstants.CREATE_GENERATOR_LOG, createGeneratorLog);
}

function* updateGeneratorLogWatcher() {
  yield takeLatest(generatorConstants.UPDATE_GENERATOR_LOG, updateGeneratorLog);
}

function* searchGeneratorLogWatcher() {
  yield takeLatest(generatorConstants.SEARCH_GENERATOR_LOG, searchGeneratorLog);
}

export default function* rootSaga() {
  yield all([
    getGeneratorLogsWatcher(),
    createGeneratorLogWatcher(),
    updateGeneratorLogWatcher(),
    searchGeneratorLogWatcher(),
  ]);
}
