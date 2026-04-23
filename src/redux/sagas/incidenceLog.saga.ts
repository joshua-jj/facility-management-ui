import { put, takeLatest, all } from 'typed-redux-saga';
import { incidenceLogConstants } from '@/constants';
import { SetSnackBarPayload } from '@/types';
import { appActions } from '@/actions';
import {
   CreateIncidenceLogAction,
   DeleteIncidenceLogAction,
   GetIncidenceLogsAction,
   UpdateIncidenceLogAction,
} from '@/actions/incidenceLog.action';
import { AppEmitter } from '@/controllers/EventEmitter';
import {
   authenticatedRequest,
   handleSagaError,
} from '@/utilities/saga-helpers';

function* getIncidenceLogs({ data }: GetIncidenceLogsAction) {
   yield put({ type: incidenceLogConstants.REQUEST_GET_INCIDENCE_LOGS });
   try {
      const params = new URLSearchParams();
      params.set('page', String(data?.page ?? 1));
      params.set('limit', String(data?.limit ?? 10));
      if (data?.search) params.set('search', data.search);
      if (data?.status) params.set('status', data.status);
      if (data?.locationId) params.set('locationId', String(data.locationId));
      if (data?.departmentId) params.set('departmentId', String(data.departmentId));
      if (data?.dateFrom) params.set('dateFrom', data.dateFrom);
      if (data?.dateTo) params.set('dateTo', data.dateTo);

      const uri = `${incidenceLogConstants.INCIDENCE_LOG_URI}?${params.toString()}`;
      const resp = yield* authenticatedRequest(uri, { method: 'GET' });
      if (!resp) return;

      yield put({
         type: incidenceLogConstants.GET_INCIDENCE_LOGS_SUCCESS,
         logs: resp?.data,
      });
   } catch (error: unknown) {
      yield* handleSagaError(
         error,
         incidenceLogConstants.GET_INCIDENCE_LOGS_ERROR,
         false,
      );
   }
}

function* createIncidenceLog({ data }: CreateIncidenceLogAction) {
   yield put({ type: incidenceLogConstants.REQUEST_CREATE_INCIDENCE_LOG });
   try {
      const resp = yield* authenticatedRequest(
         incidenceLogConstants.INCIDENCE_LOG_URI,
         { method: 'POST', body: JSON.stringify(data) },
      );
      if (!resp) return;
      yield put({
         type: incidenceLogConstants.CREATE_INCIDENCE_LOG_SUCCESS,
         log: resp?.data,
      });
      AppEmitter.emit(incidenceLogConstants.CREATE_INCIDENCE_LOG_SUCCESS, resp);
      const payload: SetSnackBarPayload = {
         type: 'success',
         message: (resp?.message as string) ?? 'Incidence log created',
         variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));
   } catch (error: unknown) {
      yield* handleSagaError(
         error,
         incidenceLogConstants.CREATE_INCIDENCE_LOG_ERROR,
      );
   }
}

function* updateIncidenceLog({ data }: UpdateIncidenceLogAction) {
   yield put({ type: incidenceLogConstants.REQUEST_UPDATE_INCIDENCE_LOG });
   try {
      const resp = yield* authenticatedRequest(
         incidenceLogConstants.INCIDENCE_LOG_URI,
         { method: 'PUT', body: JSON.stringify(data) },
      );
      if (!resp) return;
      yield put({
         type: incidenceLogConstants.UPDATE_INCIDENCE_LOG_SUCCESS,
         log: resp?.data,
      });
      AppEmitter.emit(incidenceLogConstants.UPDATE_INCIDENCE_LOG_SUCCESS, resp);
      yield put(
         appActions.setSnackBar({
            type: 'success',
            message: (resp?.message as string) ?? 'Incidence log updated',
            variant: 'success',
         }),
      );
   } catch (error: unknown) {
      yield* handleSagaError(
         error,
         incidenceLogConstants.UPDATE_INCIDENCE_LOG_ERROR,
      );
   }
}

function* deleteIncidenceLog({ id }: DeleteIncidenceLogAction) {
   yield put({ type: incidenceLogConstants.REQUEST_DELETE_INCIDENCE_LOG });
   try {
      const resp = yield* authenticatedRequest(
         `${incidenceLogConstants.INCIDENCE_LOG_URI}/${id}`,
         { method: 'DELETE' },
      );
      if (!resp) return;
      yield put({ type: incidenceLogConstants.DELETE_INCIDENCE_LOG_SUCCESS });
      AppEmitter.emit(incidenceLogConstants.DELETE_INCIDENCE_LOG_SUCCESS, resp);
      yield put(
         appActions.setSnackBar({
            type: 'success',
            message: (resp?.message as string) ?? 'Incidence log deleted',
            variant: 'success',
         }),
      );
   } catch (error: unknown) {
      yield* handleSagaError(
         error,
         incidenceLogConstants.DELETE_INCIDENCE_LOG_ERROR,
      );
   }
}

export default function* incidenceLogSagas() {
   yield* all([
      takeLatest(incidenceLogConstants.GET_INCIDENCE_LOGS, getIncidenceLogs),
      takeLatest(
         incidenceLogConstants.CREATE_INCIDENCE_LOG,
         createIncidenceLog,
      ),
      takeLatest(
         incidenceLogConstants.UPDATE_INCIDENCE_LOG,
         updateIncidenceLog,
      ),
      takeLatest(
         incidenceLogConstants.DELETE_INCIDENCE_LOG,
         deleteIncidenceLog,
      ),
   ]);
}
