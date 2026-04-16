import { dashboardConstants } from '@/constants/dashboard.constant';

interface GetDashboardStatsAction {
   type: typeof dashboardConstants.GET_DASHBOARD_STATS;
}

interface GetDashboardAnalyticsAction {
   type: typeof dashboardConstants.GET_DASHBOARD_ANALYTICS;
   period?: string;
}

const getDashboardStats = (): GetDashboardStatsAction => ({
   type: dashboardConstants.GET_DASHBOARD_STATS,
});

const getDashboardAnalytics = (period?: string): GetDashboardAnalyticsAction => ({
   type: dashboardConstants.GET_DASHBOARD_ANALYTICS,
   period,
});

export const dashboardActions = {
   getDashboardStats,
   getDashboardAnalytics,
};