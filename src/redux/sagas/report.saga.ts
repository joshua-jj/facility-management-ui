import { call, put, takeLatest, all } from 'typed-redux-saga';
import { reportConstants } from '@/constants';
import {
  appActions,
  GetReportActionsAction,
  GetReportsAction,
  SearchReportAction,
} from '@/actions';
import { checkStatus, parseResponse, createRequest } from '@/utilities/helpers';
import { ReportForm, SetSnackBarPayload } from '@/types';
import { AppEmitter } from '@/controllers/EventEmitter';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

interface SendReportAction {
  type: typeof reportConstants.SEND_REPORT;
  data: ReportForm;
}

function* sendReport({ data }: SendReportAction) {
  yield put({ type: reportConstants.REQUEST_SEND_REPORT });

  try {
    if (data) {
      const reportUri = `${reportConstants.REPORT_URI}/new`;
      const reportReq = createRequest(reportUri, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const response: Response = yield call(fetch, reportReq);
      yield call(checkStatus, response);

      // @ts-expect-error legacy saga pattern
      const jsonResponse = yield call(parseResponse, response);

      yield put({
        type: reportConstants.SEND_REPORT_SUCCESS,
        report: jsonResponse?.data,
      });

      const payload: SetSnackBarPayload = {
        type: 'success',
        message: 'Report saved successfully!',
        variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));

      AppEmitter.emit(reportConstants.SEND_REPORT_SUCCESS, jsonResponse);
    }
  } catch (error: unknown) {
    yield* handleSagaError(error, reportConstants.SEND_REPORT_ERROR);
  }
}

function* getReports({ data }: GetReportsAction) {
  yield put({ type: reportConstants.REQUEST_GET_REPORTS });

  try {
    const page = data?.page ?? 1;
    const limit = data?.limit ?? 10;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (data?.search) params.set('search', data.search);
    if (data?.complaintStatus) params.set('complaintStatus', data.complaintStatus);
    if (data?.attendedTo !== undefined) params.set('attendedTo', String(data.attendedTo));

    const reportUri = `${reportConstants.REPORT_URI}?${params.toString()}`;

    const jsonResponse = yield* authenticatedRequest(reportUri, { method: 'GET' });
    if (!jsonResponse) return;

    const payload = jsonResponse?.data ?? jsonResponse;

    yield put({
      type: reportConstants.GET_REPORTS_SUCCESS,
      reports: payload,
      meta: (payload as { meta?: unknown })?.meta ?? null,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, reportConstants.GET_REPORTS_ERROR, false);
  }
}

function* searchReport({ data }: SearchReportAction) {
  yield put({ type: reportConstants.REQUEST_SEARCH_REPORT });

  try {
    const reportUri = `${reportConstants.REPORT_URI}/search?q=${data.text}`;

    const jsonResponse = yield* authenticatedRequest(reportUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: reportConstants.SEARCH_REPORT_SUCCESS,
      report: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, reportConstants.SEARCH_REPORT_ERROR, false);
  }
}

function* getReportActions({ data }: GetReportActionsAction) {
  // Workflow Rules Module (Phase 4): asks the engine for the list of
  // action keys the current viewer can fire on this complaint right
  // now. Read-only — the server writes no event row. Powers the
  // `useComplaintActions` hook in server-canonical mode; the hook's
  // local-computation branch is the fall-through when serverActions
  // is null (e.g. before the saga returns).
  yield put({ type: reportConstants.REQUEST_GET_REPORT_ACTIONS });

  try {
    if (!data?.id) return;
    const reqUri = `${reportConstants.REPORT_URI}/${data.id}/actions`;
    const jsonResponse = yield* authenticatedRequest(reqUri, { method: 'GET' });
    if (!jsonResponse) return;

    // The engine returns `{ action, toState, transitionId }[]` —
    // the hook only needs the action keys, so the reducer stores the
    // raw array and the hook extracts via `.includes(...)`.
    yield put({
      type: reportConstants.GET_REPORT_ACTIONS_SUCCESS,
      actions: jsonResponse?.data ?? [],
    });
  } catch (error: unknown) {
    yield* handleSagaError(
      error,
      reportConstants.GET_REPORT_ACTIONS_FAILURE,
      false,
    );
  }
}

function* sendReportWatcher() {
  yield takeLatest(reportConstants.SEND_REPORT, sendReport);
}

function* getReportsWatcher() {
  yield takeLatest(reportConstants.GET_REPORTS, getReports);
}

function* searchReportWatcher() {
  yield takeLatest(reportConstants.SEARCH_REPORT, searchReport);
}

function* getReportActionsWatcher() {
  yield takeLatest(reportConstants.GET_REPORT_ACTIONS, getReportActions);
}

export default function* rootSaga() {
  yield all([
    sendReportWatcher(),
    getReportsWatcher(),
    searchReportWatcher(),
    getReportActionsWatcher(),
  ]);
}
