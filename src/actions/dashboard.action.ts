import { dashboardConstants } from '@/constants/dashboard.constant';

interface GetDashboardStatsAction {
   type: typeof dashboardConstants.GET_DASHBOARD_STATS;
}

interface GetDashboardAnalyticsAction {
   type: typeof dashboardConstants.GET_DASHBOARD_ANALYTICS;
}

const getDashboardStats = (): GetDashboardStatsAction => ({
   type: dashboardConstants.GET_DASHBOARD_STATS,
});

const getDashboardAnalytics = (): GetDashboardAnalyticsAction => ({
   type: dashboardConstants.GET_DASHBOARD_ANALYTICS,
});

export const dashboardActions = {
   getDashboardStats,
   getDashboardAnalytics,
};
