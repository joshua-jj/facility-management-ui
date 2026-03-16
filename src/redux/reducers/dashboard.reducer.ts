import { combineReducers } from 'redux';
import { dashboardConstants } from '@/constants/dashboard.constant';
import { Action, LoadingState } from '@/types';
import { DashboardStats, DashboardAnalytics } from '@/types/dashboard';

interface DashboardStatsAction extends Action {
   stats: DashboardStats;
}

interface DashboardAnalyticsAction extends Action {
   analytics: DashboardAnalytics;
}

const IsFetchingDashboardStats = (
   state: LoadingState = false,
   action: Action,
): LoadingState => {
   switch (action.type) {
      case dashboardConstants.REQUEST_GET_DASHBOARD_STATS:
         return true;
      case dashboardConstants.GET_DASHBOARD_STATS_SUCCESS:
      case dashboardConstants.GET_DASHBOARD_STATS_ERROR:
         return false;
      default:
         return state;
   }
};

const IsFetchingDashboardAnalytics = (
   state: LoadingState = false,
   action: Action,
): LoadingState => {
   switch (action.type) {
      case dashboardConstants.REQUEST_GET_DASHBOARD_ANALYTICS:
         return true;
      case dashboardConstants.GET_DASHBOARD_ANALYTICS_SUCCESS:
      case dashboardConstants.GET_DASHBOARD_ANALYTICS_ERROR:
         return false;
      default:
         return state;
   }
};

const dashboardStats = (
   state: DashboardStats | null = null,
   action: DashboardStatsAction,
): DashboardStats | null => {
   switch (action.type) {
      case dashboardConstants.GET_DASHBOARD_STATS_SUCCESS:
         return action.stats ?? state;
      default:
         return state;
   }
};

const dashboardAnalytics = (
   state: DashboardAnalytics | null = null,
   action: DashboardAnalyticsAction,
): DashboardAnalytics | null => {
   switch (action.type) {
      case dashboardConstants.GET_DASHBOARD_ANALYTICS_SUCCESS:
         return action.analytics ?? state;
      default:
         return state;
   }
};

const rootReducer = combineReducers({
   IsFetchingDashboardStats,
   IsFetchingDashboardAnalytics,
   dashboardStats,
   dashboardAnalytics,
});

export default rootReducer;
