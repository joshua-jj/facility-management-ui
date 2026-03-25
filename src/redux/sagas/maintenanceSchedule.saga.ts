import { put, takeLatest, all } from 'typed-redux-saga';
import { maintenanceScheduleConstants } from '@/constants/maintenanceSchedule.constant';
import { SetSnackBarPayload } from '@/types';
import { appActions, CreateMaintenanceScheduleAction, UpdateMaintenanceScheduleAction } from '@/actions';
import { AppEmitter } from '@/controllers/EventEmitter';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

function* getAllMaintenanceSchedules() {
  yield put({ type: maintenanceScheduleConstants.REQUEST_GET_ALL_MAINTENANCE_SCHEDULES });

  try {
    const uri = `${maintenanceScheduleConstants.MAINTENANCE_SCHEDULE_URI}?page=1&limit=100`;

    const jsonResponse = yield* authenticatedRequest(uri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: maintenanceScheduleConstants.GET_ALL_MAINTENANCE_SCHEDULES_SUCCESS,
      schedules: (jsonResponse?.data as Record<string, unknown>)?.items ?? [],
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, maintenanceScheduleConstants.GET_ALL_MAINTENANCE_SCHEDULES_ERROR, false);
  }
}

function* createMaintenanceSchedule({ data }: CreateMaintenanceScheduleAction) {
  yield put({ type: maintenanceScheduleConstants.REQUEST_CREATE_MAINTENANCE_SCHEDULE });

  try {
    const uri = `${maintenanceScheduleConstants.MAINTENANCE_SCHEDULE_URI}/new`;

    const jsonResponse = yield* authenticatedRequest(uri, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!jsonResponse) return;

    yield put({
      type: maintenanceScheduleConstants.CREATE_MAINTENANCE_SCHEDULE_SUCCESS,
    });

    AppEmitter.emit(maintenanceScheduleConstants.CREATE_MAINTENANCE_SCHEDULE_SUCCESS, jsonResponse?.data);

    const payload: SetSnackBarPayload = {
      type: 'success',
      message: (jsonResponse?.message as string) ?? 'Maintenance schedule created successfully',
      variant: 'success',
    };

    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(error, maintenanceScheduleConstants.CREATE_MAINTENANCE_SCHEDULE_ERROR);
  }
}

function* updateMaintenanceSchedule({ data }: UpdateMaintenanceScheduleAction) {
  yield put({ type: maintenanceScheduleConstants.REQUEST_UPDATE_MAINTENANCE_SCHEDULE });

  try {
    const { id, ...restData } = data;
    const uri = `${maintenanceScheduleConstants.MAINTENANCE_SCHEDULE_URI}/update/${id}`;

    const jsonResponse = yield* authenticatedRequest(uri, {
      method: 'PATCH',
      body: JSON.stringify(restData),
    });
    if (!jsonResponse) return;

    yield put({
      type: maintenanceScheduleConstants.UPDATE_MAINTENANCE_SCHEDULE_SUCCESS,
    });

    AppEmitter.emit(maintenanceScheduleConstants.UPDATE_MAINTENANCE_SCHEDULE_SUCCESS, jsonResponse?.data);

    const payload: SetSnackBarPayload = {
      type: 'success',
      message: (jsonResponse?.message as string) ?? 'Maintenance schedule updated successfully',
      variant: 'success',
    };

    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(error, maintenanceScheduleConstants.UPDATE_MAINTENANCE_SCHEDULE_ERROR);
  }
}

function* getAllMaintenanceSchedulesWatcher() {
  yield takeLatest(maintenanceScheduleConstants.GET_ALL_MAINTENANCE_SCHEDULES, getAllMaintenanceSchedules);
}

function* createMaintenanceScheduleWatcher() {
  yield takeLatest(maintenanceScheduleConstants.CREATE_MAINTENANCE_SCHEDULE, createMaintenanceSchedule);
}

function* updateMaintenanceScheduleWatcher() {
  yield takeLatest(maintenanceScheduleConstants.UPDATE_MAINTENANCE_SCHEDULE, updateMaintenanceSchedule);
}

export default function* rootSaga() {
  yield all([
    getAllMaintenanceSchedulesWatcher(),
    createMaintenanceScheduleWatcher(),
    updateMaintenanceScheduleWatcher(),
  ]);
}
