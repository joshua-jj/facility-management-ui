import { put, takeLatest, all } from 'typed-redux-saga';
import { maintenanceConstants } from '@/constants';
import { SetSnackBarPayload } from '@/types';
import {
  appActions,
  CreateMaintenanceLogAction,
  GetMaintenanceLogsAction,
  SearchMaintenanceLogAction,
  UpdateMaintenanceLogAction,
} from '@/actions';
import { AppEmitter } from '@/controllers/EventEmitter';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

function* getMaintenanceLogs({ data }: GetMaintenanceLogsAction) {
  yield put({ type: maintenanceConstants.REQUEST_GET_MAINTENANCE_LOGS });

  try {
    const params = new URLSearchParams();
    params.set('page', String(data?.page ?? 1));
    params.set('limit', '10');
    if (data?.status) params.set('status', data.status);
    if (data?.servicedItem) params.set('servicedItem', data.servicedItem);
    if (data?.dateFrom) params.set('dateFrom', data.dateFrom);
    if (data?.dateTo) params.set('dateTo', data.dateTo);

    const logsUri = `${maintenanceConstants.MAINTENANCE_URI}?${params.toString()}`;

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

function* updateMaintenanceLog({ data }: UpdateMaintenanceLogAction) {
  yield put({ type: maintenanceConstants.REQUEST_UPDATE_MAINTENANCE_LOG });

  try {
    if (!data?.id) return;
    const { id, ...rest } = data;
    const logUri = `${maintenanceConstants.MAINTENANCE_URI}/update/${id}`;

    const jsonResponse = yield* authenticatedRequest(logUri, {
      method: 'PATCH',
      body: JSON.stringify(rest),
    });
    if (!jsonResponse) return;

    yield put({
      type: maintenanceConstants.UPDATE_MAINTENANCE_LOG_SUCCESS,
      log: jsonResponse?.data,
    });

    // The modal listens for CREATE_*_SUCCESS to know when to close. Reuse
    // that signal on update too so the modal closes on either path.
    AppEmitter.emit(
      maintenanceConstants.CREATE_MAINTENANCE_LOG_SUCCESS,
      jsonResponse,
    );

    const payload: SetSnackBarPayload = {
      type: 'success',
      message:
        (jsonResponse?.message as string) ?? 'Maintenance log updated successfully',
      variant: 'success',
    };

    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(error, maintenanceConstants.UPDATE_MAINTENANCE_LOG_ERROR);
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

function* updateMaintenanceLogWatcher() {
  yield takeLatest(
    maintenanceConstants.UPDATE_MAINTENANCE_LOG,
    updateMaintenanceLog,
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
    updateMaintenanceLogWatcher(),
    searchMaintenanceLogWatcher(),
  ]);
}
