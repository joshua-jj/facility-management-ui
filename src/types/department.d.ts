export interface DepartmentConstants {
  REQUEST_GET_ALL_DEPARTMENTS: string;
  GET_ALL_DEPARTMENTS_SUCCESS: string;
  GET_ALL_DEPARTMENTS_ERROR: string;

  REQUEST_CREATE_DEPARTMENT: string;
  CREATE_DEPARTMENT_SUCCESS: string;
  CREATE_DEPARTMENT_ERROR: string;

  GET_ALL_DEPARTMENTS: string;
  CREATE_DEPARTMENT: string;

  DEPARTMENT_URI: string;
}
export interface DepartmentForm {
  // hodEmail: string;
  // hodName: string;
  // hodPhone: string;
  name: string;
}

export interface Department {
  id: number;
  hodEmail: string;
  hodName: string;
  hodPhone: string;
  name: string;
  itemCount: number;
  status?: string;
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
  paginationState: PaginationState;
  loadingState: LoadingState;
}
