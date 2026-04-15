import { put, takeLatest, all } from 'typed-redux-saga';
import { meetingLocationConstants } from '@/constants/meetingLocation.constant';
import {
  CreateMeetingLocationAction,
  UpdateMeetingLocationAction,
  DeleteMeetingLocationAction,
} from '@/actions/meetingLocation.action';
import { AppEmitter } from '@/controllers/EventEmitter';
import { authenticatedRequest, handleSagaError } from '@/utilities/saga-helpers';
import { appActions } from '@/actions';
import { SetSnackBarPayload } from '@/types';

interface GetMeetingLocationsAction {
  type: string;
  data?: { page?: number; limit?: number };
}

function* getMeetingLocations({ data }: GetMeetingLocationsAction) {
  yield put({ type: meetingLocationConstants.REQUEST_GET_MEETING_LOCATIONS });

  try {
    let uri: string;
    let paginated = false;

    if (data?.limit !== undefined) {
      // Explicit limit requested — use paginated endpoint
      const page = data.page ?? 1;
      const limit = data.limit;
      uri = `${meetingLocationConstants.MEETING_LOCATION_URI}?page=${page}&limit=${limit}`;
      paginated = true;
    } else {
      // No limit specified — fetch all locations (for dropdowns)
      uri = meetingLocationConstants.MEETING_LOCATION_ALL_URI;
    }

    const jsonResponse = yield* authenticatedRequest(uri, { method: 'GET' });
    if (!jsonResponse) return;

    const payload = jsonResponse?.data;

    let items: unknown[];
    let meta: unknown = null;

    if (paginated) {
      items = Array.isArray(payload) ? payload : (payload as { items?: unknown[] })?.items ?? [];
      meta = (payload as { meta?: unknown })?.meta ?? null;
    } else {
      // /all endpoint returns a plain array
      items = Array.isArray(payload) ? payload : [];
    }

    yield put({
      type: meetingLocationConstants.GET_MEETING_LOCATIONS_SUCCESS,
      meetingLocations: items,
      meta,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, meetingLocationConstants.GET_MEETING_LOCATIONS_FAILURE, false);
  }
}

function* createMeetingLocation({ data }: CreateMeetingLocationAction) {
  yield put({ type: meetingLocationConstants.REQUEST_CREATE_MEETING_LOCATION });

  try {
    if (data) {
      const uri = meetingLocationConstants.MEETING_LOCATION_URI;

      const jsonResponse = yield* authenticatedRequest(uri, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!jsonResponse) return;

      yield put({
        type: meetingLocationConstants.CREATE_MEETING_LOCATION_SUCCESS,
        meetingLocation: jsonResponse?.data,
      });

      yield put({ type: meetingLocationConstants.GET_MEETING_LOCATIONS });

      AppEmitter.emit(meetingLocationConstants.CREATE_MEETING_LOCATION_SUCCESS, jsonResponse);

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse?.message as string) ?? 'Meeting location created successfully',
        variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, meetingLocationConstants.CREATE_MEETING_LOCATION_FAILURE);
  }
}

function* updateMeetingLocation({ data }: UpdateMeetingLocationAction) {
  yield put({ type: meetingLocationConstants.REQUEST_UPDATE_MEETING_LOCATION });

  try {
    if (data) {
      const { id, ...restData } = data;
      const uri = `${meetingLocationConstants.MEETING_LOCATION_URI}/${id}`;

      const jsonResponse = yield* authenticatedRequest(uri, {
        method: 'PATCH',
        body: JSON.stringify(restData),
      });
      if (!jsonResponse) return;

      yield put({
        type: meetingLocationConstants.UPDATE_MEETING_LOCATION_SUCCESS,
        meetingLocation: jsonResponse?.data,
      });

      yield put({ type: meetingLocationConstants.GET_MEETING_LOCATIONS });

      AppEmitter.emit(meetingLocationConstants.UPDATE_MEETING_LOCATION_SUCCESS, jsonResponse);

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse?.message as string) ?? 'Meeting location updated successfully',
        variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, meetingLocationConstants.UPDATE_MEETING_LOCATION_FAILURE);
  }
}

function* deleteMeetingLocation({ id }: DeleteMeetingLocationAction) {
  yield put({ type: meetingLocationConstants.REQUEST_DELETE_MEETING_LOCATION });

  try {
    const uri = `${meetingLocationConstants.MEETING_LOCATION_URI}/${id}`;

    const jsonResponse = yield* authenticatedRequest(uri, { method: 'DELETE' });
    if (!jsonResponse) return;

    yield put({ type: meetingLocationConstants.DELETE_MEETING_LOCATION_SUCCESS });

    yield put({ type: meetingLocationConstants.GET_MEETING_LOCATIONS });

    AppEmitter.emit(meetingLocationConstants.DELETE_MEETING_LOCATION_SUCCESS, jsonResponse);

    const payload: SetSnackBarPayload = {
      type: 'success',
      message: (jsonResponse?.message as string) ?? 'Meeting location deleted successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(error, meetingLocationConstants.DELETE_MEETING_LOCATION_FAILURE);
  }
}

function* getMeetingLocationsWatcher() {
  yield takeLatest(meetingLocationConstants.GET_MEETING_LOCATIONS, getMeetingLocations);
}

function* createMeetingLocationWatcher() {
  yield takeLatest(meetingLocationConstants.CREATE_MEETING_LOCATION, createMeetingLocation);
}

function* updateMeetingLocationWatcher() {
  yield takeLatest(meetingLocationConstants.UPDATE_MEETING_LOCATION, updateMeetingLocation);
}

function* deleteMeetingLocationWatcher() {
  yield takeLatest(meetingLocationConstants.DELETE_MEETING_LOCATION, deleteMeetingLocation);
}

export default function* rootSaga() {
  yield all([
    getMeetingLocationsWatcher(),
    createMeetingLocationWatcher(),
    updateMeetingLocationWatcher(),
    deleteMeetingLocationWatcher(),
  ]);
}
