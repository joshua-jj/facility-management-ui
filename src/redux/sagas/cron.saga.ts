import { put, takeLatest, all } from 'typed-redux-saga';
import { cronConstants } from '@/constants/cron.constant';
import { authenticatedRequest, handleSagaError } from '@/utilities/saga-helpers';
import { appActions } from '@/actions';
import { SetSnackBarPayload } from '@/types';
import {
  UpdateCronAction,
  TriggerCronAction,
  ValidateCronAction,
} from '@/actions/cron.actions';

function* getCrons() {
  yield put({ type: cronConstants.REQUEST_GET_CRONS });
  try {
    const json = yield* authenticatedRequest(cronConstants.CRON_URI, {
      method: 'GET',
    });
    if (!json) return;
    yield put({
      type: cronConstants.GET_CRONS_SUCCESS,
      crons: json.data ?? [],
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, cronConstants.GET_CRONS_FAILURE, false);
  }
}

function* updateCron({ key, body }: UpdateCronAction) {
  yield put({ type: cronConstants.REQUEST_UPDATE_CRON });
  try {
    const uri = `${cronConstants.CRON_URI}/${encodeURIComponent(key)}`;
    const json = yield* authenticatedRequest(uri, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!json) return;
    yield put({
      type: cronConstants.UPDATE_CRON_SUCCESS,
      cron: json.data,
    });

    const snack: SetSnackBarPayload = {
      type: 'success',
      message: (typeof json.message === 'string' ? json.message : undefined) ?? 'Cron schedule updated successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(snack));

    // Refresh configurations list
    yield put({ type: cronConstants.GET_CRONS });
  } catch (error: unknown) {
    yield* handleSagaError(error, cronConstants.UPDATE_CRON_FAILURE);
  }
}

function* triggerCron({ key }: TriggerCronAction) {
  yield put({ type: cronConstants.REQUEST_TRIGGER_CRON });
  try {
    const uri = `${cronConstants.CRON_URI}/${encodeURIComponent(key)}/trigger`;
    const json = yield* authenticatedRequest(uri, {
      method: 'POST',
    });
    if (!json) return;
    yield put({ type: cronConstants.TRIGGER_CRON_SUCCESS });

    const snack: SetSnackBarPayload = {
      type: 'success',
      message: (typeof json.message === 'string' ? json.message : undefined) ?? 'Cron execution triggered',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(snack));
  } catch (error: unknown) {
    yield* handleSagaError(error, cronConstants.TRIGGER_CRON_FAILURE);
  }
}

function* validateCron({ cronExpression }: ValidateCronAction) {
  yield put({ type: cronConstants.REQUEST_VALIDATE_CRON });
  try {
    const uri = `${cronConstants.CRON_URI}/validate`;
    const json = yield* authenticatedRequest(uri, {
      method: 'POST',
      body: JSON.stringify({ cronExpression }),
    });
    if (!json) return;
    yield put({
      type: cronConstants.VALIDATE_CRON_SUCCESS,
      nextExecutions: (json.data as { nextExecutions?: string[] })?.nextExecutions ?? [],
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, cronConstants.VALIDATE_CRON_FAILURE, false);
  }
}

function* getCronsWatcher() {
  yield takeLatest(cronConstants.GET_CRONS, getCrons);
}

function* updateCronWatcher() {
  yield takeLatest(cronConstants.UPDATE_CRON, updateCron);
}

function* triggerCronWatcher() {
  yield takeLatest(cronConstants.TRIGGER_CRON, triggerCron);
}

function* validateCronWatcher() {
  yield takeLatest(cronConstants.VALIDATE_CRON, validateCron);
}

export default function* cronRootSaga() {
  yield all([
    getCronsWatcher(),
    updateCronWatcher(),
    triggerCronWatcher(),
    validateCronWatcher(),
  ]);
}
