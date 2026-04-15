import { put, takeLatest, all } from 'typed-redux-saga';
import { meetingConstants } from '@/constants/meeting.constant';
import {
  CreateMeetingAction,
  UpdateMeetingAction,
  DeleteMeetingAction,
} from '@/actions/meeting.action';
import { AppEmitter } from '@/controllers/EventEmitter';
import { authenticatedRequest, handleSagaError } from '@/utilities/saga-helpers';
import { appActions } from '@/actions';
import { SetSnackBarPayload } from '@/types';

interface GetMeetingsAction {
  type: string;
  data?: { page?: number; limit?: number; search?: string; status?: string; locationId?: string };
}

function* getMeetings({ data }: GetMeetingsAction) {
  yield put({ type: meetingConstants.REQUEST_GET_MEETINGS });

  try {
    const page = data?.page ?? 1;
    const limit = data?.limit ?? 10;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (data?.search) params.set('search', data.search);
    if (data?.status) params.set('status', data.status);
    if (data?.locationId) params.set('locationId', data.locationId);
    const uri = `${meetingConstants.MEETING_URI}?${params.toString()}`;

    const jsonResponse = yield* authenticatedRequest(uri, { method: 'GET' });
    if (!jsonResponse) return;

    const payload = jsonResponse?.data;
    // API returns paginated { items, meta, links }
    const items = Array.isArray(payload) ? payload : (payload as { items?: unknown[] })?.items ?? payload;
    const meta = (payload as { meta?: unknown })?.meta ?? null;

    yield put({
      type: meetingConstants.GET_MEETINGS_SUCCESS,
      meetings: items,
      meta,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, meetingConstants.GET_MEETINGS_FAILURE, false);
  }
}

function* createMeeting({ data }: CreateMeetingAction) {
  yield put({ type: meetingConstants.REQUEST_CREATE_MEETING });

  try {
    if (data) {
      const uri = meetingConstants.MEETING_URI;

      const jsonResponse = yield* authenticatedRequest(uri, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!jsonResponse) return;

      yield put({
        type: meetingConstants.CREATE_MEETING_SUCCESS,
        meeting: jsonResponse?.data,
      });

      yield put({ type: meetingConstants.GET_MEETINGS });

      AppEmitter.emit(meetingConstants.CREATE_MEETING_SUCCESS, jsonResponse);

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse?.message as string) ?? 'Meeting created successfully',
        variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, meetingConstants.CREATE_MEETING_FAILURE);
  }
}

function* updateMeeting({ data }: UpdateMeetingAction) {
  yield put({ type: meetingConstants.REQUEST_UPDATE_MEETING });

  try {
    if (data) {
      const { id, ...restData } = data;
      const uri = `${meetingConstants.MEETING_URI}/${id}`;

      const jsonResponse = yield* authenticatedRequest(uri, {
        method: 'PATCH',
        body: JSON.stringify(restData),
      });
      if (!jsonResponse) return;

      yield put({
        type: meetingConstants.UPDATE_MEETING_SUCCESS,
        meeting: jsonResponse?.data,
      });

      yield put({ type: meetingConstants.GET_MEETINGS });

      AppEmitter.emit(meetingConstants.UPDATE_MEETING_SUCCESS, jsonResponse);

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: (jsonResponse?.message as string) ?? 'Meeting updated successfully',
        variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, meetingConstants.UPDATE_MEETING_FAILURE);
  }
}

function* deleteMeeting({ id }: DeleteMeetingAction) {
  yield put({ type: meetingConstants.REQUEST_DELETE_MEETING });

  try {
    const uri = `${meetingConstants.MEETING_URI}/${id}`;

    const jsonResponse = yield* authenticatedRequest(uri, { method: 'DELETE' });
    if (!jsonResponse) return;

    yield put({ type: meetingConstants.DELETE_MEETING_SUCCESS });

    yield put({ type: meetingConstants.GET_MEETINGS });

    AppEmitter.emit(meetingConstants.DELETE_MEETING_SUCCESS, jsonResponse);

    const payload: SetSnackBarPayload = {
      type: 'success',
      message: (jsonResponse?.message as string) ?? 'Meeting deleted successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(error, meetingConstants.DELETE_MEETING_FAILURE);
  }
}

function* getMeetingsWatcher() {
  yield takeLatest(meetingConstants.GET_MEETINGS, getMeetings);
}

function* createMeetingWatcher() {
  yield takeLatest(meetingConstants.CREATE_MEETING, createMeeting);
}

function* updateMeetingWatcher() {
  yield takeLatest(meetingConstants.UPDATE_MEETING, updateMeeting);
}

function* deleteMeetingWatcher() {
  yield takeLatest(meetingConstants.DELETE_MEETING, deleteMeeting);
}

export default function* rootSaga() {
  yield all([
    getMeetingsWatcher(),
    createMeetingWatcher(),
    updateMeetingWatcher(),
    deleteMeetingWatcher(),
  ]);
}
