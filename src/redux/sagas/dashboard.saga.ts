import { put, takeLatest, all } from 'typed-redux-saga';
import { dashboardConstants } from '@/constants/dashboard.constant';
import {
   authenticatedRequest,
   handleSagaError,
} from '@/utilities/saga-helpers';

function* getDashboardStats() {
   yield put({ type: dashboardConstants.REQUEST_GET_DASHBOARD_STATS });

   try {
      const statsUri = `${dashboardConstants.DASHBOARD_URI}/stats`;

      const jsonResponse = yield* authenticatedRequest(statsUri, { method: 'GET' });
      if (!jsonResponse) return;

      yield put({
         type: dashboardConstants.GET_DASHBOARD_STATS_SUCCESS,
         stats: jsonResponse?.data,
      });
   } catch (error: unknown) {
      yield* handleSagaError(error, dashboardConstants.GET_DASHBOARD_STATS_ERROR, false);
   }
}

function* getDashboardAnalytics() {
   yield put({ type: dashboardConstants.REQUEST_GET_DASHBOARD_ANALYTICS });

   try {
      const analyticsUri = `${dashboardConstants.DASHBOARD_URI}/analytics`;

      const jsonResponse = yield* authenticatedRequest(analyticsUri, { method: 'GET' });
      if (!jsonResponse) return;

      yield put({
         type: dashboardConstants.GET_DASHBOARD_ANALYTICS_SUCCESS,
         analytics: jsonResponse?.data,
      });
   } catch (error: unknown) {
      yield* handleSagaError(error, dashboardConstants.GET_DASHBOARD_ANALYTICS_ERROR, false);
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
