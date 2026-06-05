import { put, takeLatest, all } from 'typed-redux-saga';
import { configConstants } from '@/constants/config.constant';
import { authenticatedRequest, handleSagaError } from '@/utilities/saga-helpers';
import { appActions } from '@/actions';
import { SetSnackBarPayload } from '@/types';
import { UpdateSettingAction, ResetSettingAction } from '@/actions/config.action';

function* getEffectiveConfig() {
  yield put({ type: configConstants.REQUEST_GET_EFFECTIVE_CONFIG });
  try {
    const json = yield* authenticatedRequest(`${configConstants.CONFIG_URI}/effective`, {
      method: 'GET',
    });
    if (!json) return;
    yield put({
      type: configConstants.GET_EFFECTIVE_CONFIG_SUCCESS,
      effective: json.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, configConstants.GET_EFFECTIVE_CONFIG_FAILURE, false);
  }
}

function* getSettings() {
  yield put({ type: configConstants.REQUEST_GET_SETTINGS });
  try {
    const json = yield* authenticatedRequest(configConstants.CONFIG_URI, {
      method: 'GET',
    });
    if (!json) return;
    yield put({
      type: configConstants.GET_SETTINGS_SUCCESS,
      settings: json.data ?? [],
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, configConstants.GET_SETTINGS_FAILURE, false);
  }
}

function* updateSetting({ key, value }: UpdateSettingAction) {
  yield put({ type: configConstants.REQUEST_UPDATE_SETTING });
  try {
    const uri = `${configConstants.CONFIG_URI}/${encodeURIComponent(key)}`;
    const json = yield* authenticatedRequest(uri, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
    if (!json) return;
    yield put({ type: configConstants.UPDATE_SETTING_SUCCESS });

    const snack: SetSnackBarPayload = {
      type: 'success',
      message: (typeof json.message === 'string' ? json.message : undefined) ?? 'Setting updated successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(snack));

    // Refresh both lists so consumers see the new effective values immediately
    yield put({ type: configConstants.GET_SETTINGS });
    yield put({ type: configConstants.GET_EFFECTIVE_CONFIG });
  } catch (error: unknown) {
    yield* handleSagaError(error, configConstants.UPDATE_SETTING_FAILURE);
  }
}

function* resetSetting({ key }: ResetSettingAction) {
  yield put({ type: configConstants.REQUEST_UPDATE_SETTING });
  try {
    const uri = `${configConstants.CONFIG_URI}/${encodeURIComponent(key)}/reset`;
    const json = yield* authenticatedRequest(uri, {
      method: 'POST',
    });
    if (!json) return;
    yield put({ type: configConstants.UPDATE_SETTING_SUCCESS });

    const snack: SetSnackBarPayload = {
      type: 'success',
      message: (typeof json.message === 'string' ? json.message : undefined) ?? 'Setting reset to default',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(snack));

    // Refresh both lists
    yield put({ type: configConstants.GET_SETTINGS });
    yield put({ type: configConstants.GET_EFFECTIVE_CONFIG });
  } catch (error: unknown) {
    yield* handleSagaError(error, configConstants.UPDATE_SETTING_FAILURE);
  }
}

function* getEffectiveConfigWatcher() {
  yield takeLatest(configConstants.GET_EFFECTIVE_CONFIG, getEffectiveConfig);
}

function* getSettingsWatcher() {
  yield takeLatest(configConstants.GET_SETTINGS, getSettings);
}

function* updateSettingWatcher() {
  yield takeLatest(configConstants.UPDATE_SETTING, updateSetting);
}

function* resetSettingWatcher() {
  yield takeLatest(configConstants.RESET_SETTING, resetSetting);
}

export default function* configRootSaga() {
  yield all([
    getEffectiveConfigWatcher(),
    getSettingsWatcher(),
    updateSettingWatcher(),
    resetSettingWatcher(),
  ]);
}
