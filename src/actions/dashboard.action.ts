export interface GetDashboardStatsAction {
   type: string;
}

export interface GetDashboardAnalyticsAction {
   type: string;
}

const getDashboardStats = (): GetDashboardStatsAction => ({
   type: 'GET_DASHBOARD_STATS',
});

const getDashboardAnalytics = (): GetDashboardAnalyticsAction => ({
   type: 'GET_DASHBOARD_ANALYTICS',
});

export const dashboardActions = {
   getDashboardStats,
   getDashboardAnalytics,
};
