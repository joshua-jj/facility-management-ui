export interface DepartmentConstants {
  REQUEST_GET_ALL_DEPARTMENTS: string;
  GET_ALL_DEPARTMENTS_SUCCESS: string;
  GET_ALL_DEPARTMENTS_ERROR: string;

  REQUEST_CREATE_DEPARTMENT: string;
  CREATE_DEPARTMENT_SUCCESS: string;
  CREATE_DEPARTMENT_ERROR: string;

  REQUEST_GET_UNPAGINATED_DEPARTMENTS: string;
  GET_UNPAGINATED_DEPARTMENTS_SUCCESS: string;
  GET_UNPAGINATED_DEPARTMENTS_ERROR: string;

  GET_ALL_DEPARTMENTS: string;
  GET_UNPAGINATED_DEPARTMENTS: string;
  CREATE_DEPARTMENT: string;

  UPDATE_DEPARTMENT: string;
  REQUEST_UPDATE_DEPARTMENT: string;
  UPDATE_DEPARTMENT_SUCCESS: string;
  UPDATE_DEPARTMENT_ERROR: string;

  ACTIVATE_DEPARTMENT: string;
  REQUEST_ACTIVATE_DEPARTMENT: string;
  ACTIVATE_DEPARTMENT_SUCCESS: string;
  ACTIVATE_DEPARTMENT_ERROR: string;

  DEACTIVATE_DEPARTMENT: string;
  REQUEST_DEACTIVATE_DEPARTMENT: string;
  DEACTIVATE_DEPARTMENT_SUCCESS: string;
  DEACTIVATE_DEPARTMENT_ERROR: string;

  DEPARTMENT_URI: string;
}
export interface DepartmentForm {
  name: string;
  hodName?: string;
  hodEmail?: string;
  hodPhone?: string;
}

export interface Department {
  id: number;
  hodEmail: string;
  hodName: string;
  hodPhone: string;
  name: string;
  itemCount: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
export interface DepartmentState {
  departments: Department[];
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
  department: Department | null;
  departmentForm: DepartmentForm;
  pagination: PaginationState;
  loadingState: LoadingState;
}
