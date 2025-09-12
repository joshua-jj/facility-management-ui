export interface MaintenanceConstants {
  REQUEST_GET_MAINTENANCE_LOGS: string;
  GET_MAINTENANCE_LOGS_SUCCESS: string;
  GET_MAINTENANCE_LOGS_ERROR: string;

  REQUEST_SEARCH_MAINTENANCE_LOG: string;
  SEARCH_MAINTENANCE_LOG_SUCCESS: string;
  SEARCH_MAINTENANCE_LOG_ERROR: string;

  REQUEST_CREATE_MAINTENANCE_LOG: string;
  CREATE_MAINTENANCE_LOG_SUCCESS: string;
  CREATE_MAINTENANCE_LOG_ERROR: string;

  GET_MAINTENANCE_LOGS: string;
  SEARCH_MAINTENANCE_LOG: string;
  CREATE_MAINTENANCE_LOG: string;

  MAINTENANCE_URI: string;
}
export interface PaginationState {
  links: { [key: string]: string | number | null };
  meta: {
    currentPage: number;
    itemCount: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}
export interface MaintenanceForm {
  artisanName: string;
  artisanPhone: string;
  servicedItem: string;
  description: string;
  maintenanceDate: string;
  signature: string;
  costOfMaintenance: number;
}
export interface MaintenanceLog {
  id: number;
  servicedItem: string;
  serviceItemName: string;
  artisanName: string;
  artisanPhone: string;
  description: string;
  maintenanceDate: string;
  costOfMaintenance: number;
  signature: string;
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
