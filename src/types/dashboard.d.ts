export interface RequestsByStatus {
   status: string;
   count: number;
}

export interface ItemsByCondition {
   condition: string;
   count: number;
}

export interface DashboardStats {
   totalRequests: number;
   dueReturns: number;
   totalReports: number;
   totalItems: number;
   requestsByStatus: RequestsByStatus[];
   itemsByCondition: ItemsByCondition[];
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
   hoursUsed: number;
   onTime: boolean;
}

export interface GeneratorStats {
   totalLogs: number;
   avgHours: number;
   faultCount: number;
   dueForServiceCount: number;
   recentLogs: DashboardGeneratorLog[];
}

export interface ComplaintByStatus {
   status: string;
   count: number;
}

export interface MaintenanceCostTrendItem {
   month: string;
   totalCost: string;
}

export interface DashboardMaintenanceLog {
   id: number;
   artisanName: string;
   description: string;
   costOfMaintenance: string;
   maintenanceDate: string;
}

export interface ItemAvailability {
   available: number;
   unavailable: number;
}

export interface DashboardAnalytics {
   totalUsers: number;
   totalItemUnits: number;
   itemAvailability: ItemAvailability;
   requestTrend: RequestTrendItem[];
   upcomingSchedules: UpcomingSchedule[];
   generatorStats: GeneratorStats;
   complaintsByStatus: ComplaintByStatus[];
   maintenanceCostTrend: MaintenanceCostTrendItem[];
   recentMaintenanceLogs: DashboardMaintenanceLog[];
}
