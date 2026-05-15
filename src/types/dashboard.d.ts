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
   id: number;
   nameOfMeeting: string;
   generatorType: string;
   onTime: string;
   offTime: string;
   hoursUsed: number;
   faultDetected: boolean;
   createdAt: string;
}

export interface SparklinePoint {
   date: string;
   count: number;
}

export interface TopDepartmentByRequests {
   departmentId: number;
   departmentName: string;
   count: number;
}

export interface TopRequestedItem {
   itemId: number;
   itemName: string;
   count: number;
}

export interface TopArtisanByCost {
   artisanName: string;
   totalCost: number;
   logCount: number;
}

export interface GeneratorTrendPoint {
   date: string;
   hours: number;
}

export interface GeneratorFaultPoint {
   date: string;
   count: number;
}

export interface GeneratorStats {
   totalLogs: number;
   avgHours: number;
   faultCount: number;
   dueForServiceCount: number;
   recentLogs: DashboardGeneratorLog[];
   hoursUsedTrend?: GeneratorTrendPoint[];
   faultFrequency?: GeneratorFaultPoint[];
   /** Count of generator logs per period-date — powers the "Generator Usage" chart. */
   usageCountTrend?: GeneratorFaultPoint[];
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
   // Sparkline fields — period-aware (week=7d, month=30d, year=12mo).
   // `requestsSparkline` is per-bucket request counts.
   // `itemsSparkline` is the cumulative ACTIVE item stock at end of bucket
   //    (running total, not per-bucket new-items count).
   requestsSparkline?: SparklinePoint[];
   itemsSparkline?: SparklinePoint[];
   reportsSparkline?: SparklinePoint[];
   usersSparkline?: SparklinePoint[];
   /**
    * Sum of `actualQuantity` for ACTIVE items as of the end of the
    * selected period — the authoritative "Items Tracked" KPI scalar.
    * Prefer this over deriving from `itemsSparkline` since the
    * sparkline may be empty/zeroed when no items were created in
    * the window even though stock exists.
    */
   itemsTracked?: number;
   // Top-N leaderboards
   topDepartmentsByRequests?: TopDepartmentByRequests[];
   topRequestedItems?: TopRequestedItem[];
   topArtisansByCost?: TopArtisanByCost[];
   // 90-day heatmap
   requestVolumeHeatmap?: SparklinePoint[];
}