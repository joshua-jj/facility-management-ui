import { combineReducers } from 'redux';
import { dashboardConstants } from '@/constants/dashboard.constant';
import { DashboardStats, DashboardAnalytics } from '@/types';

interface Action {
   type: string;
   [key: string]: unknown;
}

type LoadingState = boolean;

const IsFetchingDashboardStats = (state: LoadingState = false, action: Action): LoadingState => {
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

const IsFetchingDashboardAnalytics = (state: LoadingState = false, action: Action): LoadingState => {
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

const dashboardStats = (state: DashboardStats | null = null, action: Action): DashboardStats | null => {
   switch (action.type) {
      case dashboardConstants.GET_DASHBOARD_STATS_SUCCESS:
         return (action.stats as DashboardStats) ?? state;
      default:
         return state;
   }
};

const dashboardAnalytics = (
   state: DashboardAnalytics | null = null,
   action: Action,
): DashboardAnalytics | null => {
   switch (action.type) {
      case dashboardConstants.GET_DASHBOARD_ANALYTICS_SUCCESS:
         return (action.analytics as DashboardAnalytics) ?? state;
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