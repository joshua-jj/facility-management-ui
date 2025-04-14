export interface MaintenanceConstants {
  REQUEST_GET_MAINTENANCE_LOGS: string;
  GET_MAINTENANCE_LOGS_SUCCESS: string;
  GET_MAINTENANCE_LOGS_ERROR: string;

  GET_MAINTENANCE_LOGS: string;

  MAINTENANCE_URI: string;
}
export interface MaintenanceForm {
  maintenanceName: string;
  maintenanceStatus: string;
  maintenanceType: string;
  maintenanceDescription: string;
  maintenanceDate: string;
  maintenanceDuration: number;
}
export interface MaintenanceLog {
  id: number;
  servicedItem: string;
  artisanName: string;
  artisanPhone: string;
  description: string;
  maintenanceDate: string;
  costOfMaintenance: number;
  createdAt: string;
  updatedAt: string;
  status: number;
}
export interface MaintenanceState {
  maintenanceLogs: MaintenanceLog[];
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
  maintenanceLog: MaintenanceLog | null;
  maintenanceForm: MaintenanceForm;
  pagination: PaginationState;
  loadingState: LoadingState;
  paginationState: PaginationState;
}
export interface MaintenanceAction {
  type: string;
  data?: MaintenanceLog[];
  maintenanceLog?: MaintenanceLog;
  message?: string;
  error?: string;
  loading?: boolean;
  success?: boolean;
  maintenanceForm?: MaintenanceForm;
  pagination?: PaginationState;
  loadingState?: LoadingState;
  paginationState?: PaginationState;
  maintenanceLogs?: MaintenanceLog[];
  maintenanceLog?: MaintenanceLog;
  maintenanceFormData?: MaintenanceForm;
  maintenanceName?: string;
  maintenanceStatus?: string;
  maintenanceType?: string;
  maintenanceDescription?: string;
  maintenanceDate?: string;
  maintenanceDuration?: number;
}
