import { put, takeLatest, all } from 'typed-redux-saga';
import { maintenanceConstants } from '@/constants';
import { SetSnackBarPayload } from '@/types';
import {
  appActions,
  CreateMaintenanceLogAction,
  GetMaintenanceLogsAction,
  SearchMaintenanceLogAction,
} from '@/actions';
import { AppEmitter } from '@/controllers/EventEmitter';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

function* getMaintenanceLogs({ data }: GetMaintenanceLogsAction) {
  yield put({ type: maintenanceConstants.REQUEST_GET_MAINTENANCE_LOGS });

  try {
    let logsUri = `${maintenanceConstants.MAINTENANCE_URI}`;

    if (data?.page) {
      logsUri = `${logsUri}?page=${data.page}`;
    }

    const jsonResponse = yield* authenticatedRequest(logsUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: maintenanceConstants.GET_MAINTENANCE_LOGS_SUCCESS,
      logs: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, maintenanceConstants.GET_MAINTENANCE_LOGS_ERROR, false);
  }
}

function* createMaintenanceLog({ data }: CreateMaintenanceLogAction) {
  yield put({ type: maintenanceConstants.REQUEST_CREATE_MAINTENANCE_LOG });

  try {
    if (data) {
      const logUri = `${maintenanceConstants.MAINTENANCE_URI}/new`;

      const jsonResponse = yield* authenticatedRequest(logUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!jsonResponse) return;

      yield put({
        type: maintenanceConstants.CREATE_MAINTENANCE_LOG_SUCCESS,
        user: jsonResponse?.data,
      });

      yield put({
        type: maintenanceConstants.GET_MAINTENANCE_LOGS,
      });

      AppEmitter.emit(
        maintenanceConstants.CREATE_MAINTENANCE_LOG_SUCCESS,
        jsonResponse
      );

      const payload: SetSnackBarPayload = {
        type: 'success',
        message:
          (jsonResponse?.message as string) ?? 'Maintenance log created successfully',
        variant: 'success',
      };

      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, maintenanceConstants.CREATE_MAINTENANCE_LOG_ERROR);
  }
}

function* searchMaintenanceLog({ data }: SearchMaintenanceLogAction) {
  yield put({ type: maintenanceConstants.REQUEST_SEARCH_MAINTENANCE_LOG });

  try {
    const logsUri = `${maintenanceConstants.MAINTENANCE_URI}/search?q=${data.text}`;

    const jsonResponse = yield* authenticatedRequest(logsUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: maintenanceConstants.SEARCH_MAINTENANCE_LOG_SUCCESS,
      log: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, maintenanceConstants.SEARCH_MAINTENANCE_LOG_ERROR, false);
  }
}

function* getMaintenanceLogsWatcher() {
  yield takeLatest(
    maintenanceConstants.GET_MAINTENANCE_LOGS,
    getMaintenanceLogs
  );
}

function* createMaintenanceLogWatcher() {
  yield takeLatest(
    maintenanceConstants.CREATE_MAINTENANCE_LOG,
    createMaintenanceLog
  );
}

function* searchMaintenanceLogWatcher() {
  yield takeLatest(
    maintenanceConstants.SEARCH_MAINTENANCE_LOG,
    searchMaintenanceLog
  );
}

export default function* rootSaga() {
  yield all([
    getMaintenanceLogsWatcher(),
    createMaintenanceLogWatcher(),
    searchMaintenanceLogWatcher(),
  ]);
}
