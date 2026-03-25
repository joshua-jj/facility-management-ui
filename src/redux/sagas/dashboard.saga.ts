import { call, put, takeLatest, all } from 'typed-redux-saga';
import { authConstants } from '@/constants';
import { dashboardConstants } from '@/constants/dashboard.constant';
import {
   checkStatus,
   parseResponse,
   createRequestWithToken,
   getObjectFromStorage,
   clearObjectFromStorage,
} from '@/utilities/helpers';
import { User } from '@/types';

interface ApiError {
   response?: Response;
   message?: string;
   error?: string;
}

interface ParsedResponse {
   message: string;
   error: string;
   data: unknown;
}

function* getDashboardStats() {
   yield put({ type: dashboardConstants.REQUEST_GET_DASHBOARD_STATS });

   try {
      const user: User | null = yield call(getObjectFromStorage, authConstants.USER_KEY);
      const uri = `${dashboardConstants.DASHBOARD_URI}/stats`;

      const requestFn = () => createRequestWithToken(uri, { method: 'GET' })(user?.token as string);
      const req: Request = yield call(requestFn);

      const response: Response = yield call(fetch, req);
      if (response.status === 401) {
         yield call(clearObjectFromStorage, authConstants.USER_KEY);
         yield put({ type: authConstants.TOKEN_HAS_EXPIRED });
         return;
      }
      yield call(checkStatus, response);

      const jsonResponse: ParsedResponse = yield call(parseResponse, response);

      yield put({
         type: dashboardConstants.GET_DASHBOARD_STATS_SUCCESS,
         stats: jsonResponse?.data,
      });
   } catch (error: unknown) {
      if ((error as ApiError)?.response) {
         const res: ParsedResponse = yield call(parseResponse, (error as ApiError).response as unknown as Response);
         yield put({
            type: dashboardConstants.GET_DASHBOARD_STATS_ERROR,
            error: res?.error,
         });
         return;
      }
      yield put({
         type: dashboardConstants.GET_DASHBOARD_STATS_ERROR,
         error: ((error as ApiError)?.error || (error as ApiError)?.message) ?? 'Something went wrong',
      });
   }
}

function* getDashboardAnalytics() {
   yield put({ type: dashboardConstants.REQUEST_GET_DASHBOARD_ANALYTICS });

   try {
      const user: User | null = yield call(getObjectFromStorage, authConstants.USER_KEY);
      const uri = `${dashboardConstants.DASHBOARD_URI}/analytics`;

      const requestFn = () => createRequestWithToken(uri, { method: 'GET' })(user?.token as string);
      const req: Request = yield call(requestFn);

      const response: Response = yield call(fetch, req);
      if (response.status === 401) {
         yield call(clearObjectFromStorage, authConstants.USER_KEY);
         yield put({ type: authConstants.TOKEN_HAS_EXPIRED });
         return;
      }
      yield call(checkStatus, response);

      const jsonResponse: ParsedResponse = yield call(parseResponse, response);

      yield put({
         type: dashboardConstants.GET_DASHBOARD_ANALYTICS_SUCCESS,
         analytics: jsonResponse?.data,
      });
   } catch (error: unknown) {
      if ((error as ApiError)?.response) {
         const res: ParsedResponse = yield call(parseResponse, (error as ApiError).response as unknown as Response);
         yield put({
            type: dashboardConstants.GET_DASHBOARD_ANALYTICS_ERROR,
            error: res?.error,
         });
         return;
      }
      yield put({
         type: dashboardConstants.GET_DASHBOARD_ANALYTICS_ERROR,
         error: ((error as ApiError)?.error || (error as ApiError)?.message) ?? 'Something went wrong',
      });
   }
}

function* getDashboardStatsWatcher() {
   yield takeLatest(dashboardConstants.GET_DASHBOARD_STATS, getDashboardStats);
}

function* getDashboardAnalyticsWatcher() {
   yield takeLatest(dashboardConstants.GET_DASHBOARD_ANALYTICS, getDashboardAnalytics);
}

export default function* rootSaga() {
   yield all([getDashboardStatsWatcher(), getDashboardAnalyticsWatcher()]);
}
