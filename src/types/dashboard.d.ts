export interface DashboardStats {
   totalItems: number;
   totalRequests: number;
   totalReports: number;
   dueReturns: number;
   itemsByCondition: { condition: string; count: string }[];
   requestsByStatus: { status: string; count: string }[];
   recentRequests: unknown[];
}

export interface RequestTrendItem {
   month: string;
   count: number;
}

export interface UpcomingSchedule {
   id: number;
   title: string;
   description: string;
   scheduledDate: string;
}

export interface DashboardGeneratorLog {
   id: number;
   nameOfMeeting: string;
   generatorType: string;
   onTime: string;
   offTime: string;
   hoursUsed: number;
   faultDetected: boolean;
   createdAt: string;
}

export interface GeneratorStats {
   totalLogs: number;
   totalHours: number;
   avgHours: number;
   faultCount: number;
   dueForServiceCount: number;
   recentLogs: {
      id: number;
      hoursUsed: number;
      onTime: string;
      offTime: string;
      faultDetected: boolean;
      generatorType: string;
      createdAt: string;
   }[];
}

export interface DashboardAnalytics {
   totalUsers: number;
   totalItemUnits: number;
   itemAvailability: { available: string; total: string };
   requestTrend: { month: string; count: string }[];
   complaintsByStatus: { status: string; count: string }[];
   generatorStats: GeneratorStatsData;
   maintenanceCostTrend: { month: string; count: string; totalCost: string }[];
   upcomingSchedules: {
      id: number;
      title: string;
      description: string;
      scheduledDate: string;
      scheduleStatus: string;
   }[];
   recentMaintenanceLogs: {
      id: number;
      maintenanceDate: string;
      description: string;
      costOfMaintenance: string;
      artisanName: string;
   }[];
   topDepartments: { departmentId: string; count: string }[];
}

export interface DashboardState {
   IsFetchingDashboardStats: boolean;
   IsFetchingDashboardAnalytics: boolean;
   dashboardStats: DashboardStats | null;
   dashboardAnalytics: DashboardAnalytics | null;
}
