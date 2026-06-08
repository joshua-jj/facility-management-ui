import { put, takeLatest, all } from 'typed-redux-saga';
import { reconciliationConstants } from '@/constants';
import { SetSnackBarPayload } from '@/types';
import {
  appActions,
  ApproveReconciliationAction,
  GetReconciliationDetailAction,
  GetReconciliationsAction,
  OpenReconciliationAction,
  RejectReconciliationAction,
  SaveCountsAction,
  SubmitReconciliationAction,
} from '@/actions';
import { AppEmitter } from '@/controllers/EventEmitter';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

function* getReconciliations({ data }: GetReconciliationsAction) {
  yield put({ type: reconciliationConstants.REQUEST_GET_RECONCILIATIONS });

  try {
    const params = new URLSearchParams();
    params.set('page', String(data?.page ?? 1));
    params.set('limit', String(data?.limit ?? 10));
    if (data?.state) params.set('state', data.state);

    const uri = `${reconciliationConstants.RECONCILIATION_URI}?${params.toString()}`;

    const jsonResponse = yield* authenticatedRequest(uri, { method: 'GET' });
    if (!jsonResponse) return;

    const payload = jsonResponse?.data as
      | {
          items?: unknown;
          links?: unknown;
          meta?: unknown;
        }
      | unknown[]
      | undefined;

    const items = Array.isArray(payload)
      ? payload
      : (payload as { items?: unknown })?.items ?? payload;
    const links = Array.isArray(payload)
      ? undefined
      : (payload as { links?: unknown })?.links;
    const meta = Array.isArray(payload)
      ? undefined
      : (payload as { meta?: unknown })?.meta;

    yield put({
      type: reconciliationConstants.GET_RECONCILIATIONS_SUCCESS,
      data: items,
      links,
      meta,
    });
  } catch (error: unknown) {
    yield* handleSagaError(
      error,
      reconciliationConstants.GET_RECONCILIATIONS_ERROR,
      false
    );
  }
}

function* openReconciliation({ data }: OpenReconciliationAction) {
  yield put({ type: reconciliationConstants.REQUEST_OPEN_RECONCILIATION });

  try {
    const uri = reconciliationConstants.RECONCILIATION_URI;

    const jsonResponse = yield* authenticatedRequest(uri, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!jsonResponse) return;

    yield put({
      type: reconciliationConstants.OPEN_RECONCILIATION_SUCCESS,
      data: jsonResponse?.data,
    });

    AppEmitter.emit(
      reconciliationConstants.OPEN_RECONCILIATION_SUCCESS,
      jsonResponse?.data
    );

    const payload: SetSnackBarPayload = {
      type: 'success',
      message:
        (jsonResponse?.message as string) ?? 'Reconciliation opened successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(
      error,
      reconciliationConstants.OPEN_RECONCILIATION_ERROR
    );
  }
}

function* getReconciliationDetail({ data }: GetReconciliationDetailAction) {
  yield put({
    type: reconciliationConstants.REQUEST_GET_RECONCILIATION_DETAIL,
  });

  try {
    const uri = `${reconciliationConstants.RECONCILIATION_URI}/${data.id}`;

    const jsonResponse = yield* authenticatedRequest(uri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: reconciliationConstants.GET_RECONCILIATION_DETAIL_SUCCESS,
      data: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(
      error,
      reconciliationConstants.GET_RECONCILIATION_DETAIL_ERROR,
      false
    );
  }
}

function* saveCounts({ data }: SaveCountsAction) {
  yield put({ type: reconciliationConstants.REQUEST_SAVE_COUNTS });

  try {
    const { id, lines } = data;
    const uri = `${reconciliationConstants.RECONCILIATION_URI}/${id}/count`;

    const jsonResponse = yield* authenticatedRequest(uri, {
      method: 'PATCH',
      body: JSON.stringify({ lines }),
    });
    if (!jsonResponse) return;

    yield put({
      type: reconciliationConstants.SAVE_COUNTS_SUCCESS,
      data: jsonResponse?.data,
    });

    AppEmitter.emit(
      reconciliationConstants.SAVE_COUNTS_SUCCESS,
      jsonResponse?.data
    );

    const payload: SetSnackBarPayload = {
      type: 'success',
      message: (jsonResponse?.message as string) ?? 'Counts saved successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(error, reconciliationConstants.SAVE_COUNTS_ERROR);
  }
}

function* submitReconciliation({ data }: SubmitReconciliationAction) {
  yield put({ type: reconciliationConstants.REQUEST_SUBMIT_RECONCILIATION });

  try {
    const uri = `${reconciliationConstants.RECONCILIATION_URI}/${data.id}/submit`;

    const jsonResponse = yield* authenticatedRequest(uri, { method: 'POST' });
    if (!jsonResponse) return;

    yield put({
      type: reconciliationConstants.SUBMIT_RECONCILIATION_SUCCESS,
      data: jsonResponse?.data,
    });

    AppEmitter.emit(
      reconciliationConstants.SUBMIT_RECONCILIATION_SUCCESS,
      jsonResponse?.data
    );

    const payload: SetSnackBarPayload = {
      type: 'success',
      message:
        (jsonResponse?.message as string) ??
        'Reconciliation submitted successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(
      error,
      reconciliationConstants.SUBMIT_RECONCILIATION_ERROR
    );
  }
}

function* approveReconciliation({ data }: ApproveReconciliationAction) {
  yield put({ type: reconciliationConstants.REQUEST_APPROVE_RECONCILIATION });

  try {
    const uri = `${reconciliationConstants.RECONCILIATION_URI}/${data.id}/approve`;

    const jsonResponse = yield* authenticatedRequest(uri, { method: 'POST' });
    if (!jsonResponse) return;

    yield put({
      type: reconciliationConstants.APPROVE_RECONCILIATION_SUCCESS,
      data: jsonResponse?.data,
    });

    AppEmitter.emit(
      reconciliationConstants.APPROVE_RECONCILIATION_SUCCESS,
      jsonResponse?.data
    );

    const payload: SetSnackBarPayload = {
      type: 'success',
      message:
        (jsonResponse?.message as string) ??
        'Reconciliation approved successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(
      error,
      reconciliationConstants.APPROVE_RECONCILIATION_ERROR
    );
  }
}

function* rejectReconciliation({ data }: RejectReconciliationAction) {
  yield put({ type: reconciliationConstants.REQUEST_REJECT_RECONCILIATION });

  try {
    const { id, reason } = data;
    const uri = `${reconciliationConstants.RECONCILIATION_URI}/${id}/reject`;

    const jsonResponse = yield* authenticatedRequest(uri, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (!jsonResponse) return;

    yield put({
      type: reconciliationConstants.REJECT_RECONCILIATION_SUCCESS,
      data: jsonResponse?.data,
    });

    AppEmitter.emit(
      reconciliationConstants.REJECT_RECONCILIATION_SUCCESS,
      jsonResponse?.data
    );

    const payload: SetSnackBarPayload = {
      type: 'success',
      message:
        (jsonResponse?.message as string) ??
        'Reconciliation rejected successfully',
      variant: 'success',
    };
    yield put(appActions.setSnackBar(payload));
  } catch (error: unknown) {
    yield* handleSagaError(
      error,
      reconciliationConstants.REJECT_RECONCILIATION_ERROR
    );
  }
}

function* getReconciliationReport() {
  yield put({
    type: reconciliationConstants.REQUEST_GET_RECONCILIATION_REPORT,
  });

  try {
    const uri = `${reconciliationConstants.RECONCILIATION_URI}/report`;

    const jsonResponse = yield* authenticatedRequest(uri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: reconciliationConstants.GET_RECONCILIATION_REPORT_SUCCESS,
      data: jsonResponse?.data,
    });
  } catch (error: unknown) {
    yield* handleSagaError(
      error,
      reconciliationConstants.GET_RECONCILIATION_REPORT_ERROR,
      false
    );
  }
}

function* getReconciliationsWatcher() {
  yield takeLatest(
    reconciliationConstants.GET_RECONCILIATIONS,
    getReconciliations
  );
}

function* openReconciliationWatcher() {
  yield takeLatest(
    reconciliationConstants.OPEN_RECONCILIATION,
    openReconciliation
  );
}

function* getReconciliationDetailWatcher() {
  yield takeLatest(
    reconciliationConstants.GET_RECONCILIATION_DETAIL,
    getReconciliationDetail
  );
}

function* saveCountsWatcher() {
  yield takeLatest(reconciliationConstants.SAVE_COUNTS, saveCounts);
}

function* submitReconciliationWatcher() {
  yield takeLatest(
    reconciliationConstants.SUBMIT_RECONCILIATION,
    submitReconciliation
  );
}

function* approveReconciliationWatcher() {
  yield takeLatest(
    reconciliationConstants.APPROVE_RECONCILIATION,
    approveReconciliation
  );
}

function* rejectReconciliationWatcher() {
  yield takeLatest(
    reconciliationConstants.REJECT_RECONCILIATION,
    rejectReconciliation
  );
}

function* getReconciliationReportWatcher() {
  yield takeLatest(
    reconciliationConstants.GET_RECONCILIATION_REPORT,
    getReconciliationReport
  );
}

export {
  getReconciliations,
  openReconciliation,
  getReconciliationDetail,
  saveCounts,
  submitReconciliation,
  approveReconciliation,
  rejectReconciliation,
  getReconciliationReport,
};

export default function* rootSaga() {
  yield all([
    getReconciliationsWatcher(),
    openReconciliationWatcher(),
    getReconciliationDetailWatcher(),
    saveCountsWatcher(),
    submitReconciliationWatcher(),
    approveReconciliationWatcher(),
    rejectReconciliationWatcher(),
    getReconciliationReportWatcher(),
  ]);
}
