export interface RequestConstants {
  REQUEST_CREATE_REQUEST: string;
  CREATE_REQUEST_SUCCESS: string;
  CREATE_REQUEST_ERROR: string;

  REQUEST_GET_ALL_REQUESTS: string;
  GET_ALL_REQUESTS_SUCCESS: string;
  GET_ALL_REQUESTS_ERROR: string;

  REQUEST_GET_DEPARTMENT_REQUESTS: string;
  GET_DEPARTMENT_REQUESTS_SUCCESS: string;
  GET_DEPARTMENT_REQUESTS_ERROR: string;

  REQUEST_GET_ASSIGNED_REQUESTS: string;
  GET_ASSIGNED_REQUESTS_SUCCESS: string;
  GET_ASSIGNED_REQUESTS_ERROR: string;

  REQUEST_UPDATE_REQUEST_STATUS: string;
  UPDATE_REQUEST_STATUS_SUCCESS: string;
  UPDATE_REQUEST_STATUS_ERROR: string;

  REQUEST_ASSIGN_REQUEST: string;
  ASSIGN_REQUEST_SUCCESS: string;
  ASSIGN_REQUEST_ERROR: string;

  REQUEST_RELEASE_REQUEST_ITEMS: string;
  RELEASE_REQUEST_ITEMS_SUCCESS: string;
  RELEASE_REQUEST_ITEMS_ERROR: string;

  REQUEST_RETURN_REQUEST_ITEMS: string;
  RETURN_REQUEST_ITEMS_SUCCESS: string;
  RETURN_REQUEST_ITEMS_ERROR: string;

  CREATE_REQUEST: string;
  GET_ALL_REQUESTS: string;
  GET_DEPARTMENT_REQUESTS: string;
  GET_ASSIGNED_REQUESTS: string;

  UPDATE_REQUEST_STATUS: string;
  ASSIGN_REQUEST: string;
  RELEASE_REQUEST_ITEMS: string;
  RETURN_REQUEST_ITEMS: string;

  REQUEST_URI: string;
}

export interface RequestForm {
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  isMinistry: boolean;
  ministryName: string;
  isChurch?: boolean;
  churchName?: string;
  requesterDepartmentId: number | undefined;
  locationOfUse: string;
  // durationOfUse: string;
  dateOfReturn: string;
  descriptionOfRequest: string;
  //   items: [
  //     {
  //       storeId: number;
  //       itemId: number;
  //       quantityLeased: number;
  //     //   quantityLeased?: number;
  //       conditionBeforeLease: string;
  //     },
  //   ];
}

export interface UpdateStatusForm {
  requestId: string;
  status: string;
}

export interface AssignRequestForm {
  requestId: number;
  userId: number;
}

type SelectedUnit = {
  serialNumber: string;
  condition: string;
};

export interface ReleaseItemsForm {
  requestId: number;
  // userId: number;
  items: Array<{
    itemId: number;
    // storeId: string;
    quantityLeased?: number;
    quantityReleased: number;
    quantityReturned?: number;
    leasedDate?: string;
    returnedDate?: string;
    units: SelectedUnit[];
  }>;
}

export interface Request {
  id: number;
  requesterName: string;
  createdBy: string;
  requesterEmail: string;
  requesterHodEmail: string;
  requesterHodPhone: string;
  requesterPhone: string;
  requestStatus: string;
  isMinistry: boolean;
  ministryName: string;
  isChurch?: boolean;
  churchName?: string;
  requesterDepartmentId: number | undefined;
  requesterDepartment: string;
  locationOfUse: string;
  durationOfUse: string;
  dateOfReturn: string;
  descriptionOfRequest: string;
  createdAt: string;
  updatedAt: string;
  status: number;
  summary?: {
    id: number;
    requestStatus: string;
    status: string;
  };
}
export interface RequestState {
  requests: Request[];
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
  request: Request | null;
  requestForm: RequestForm;
  pagination: PaginationState;
  loadingState: LoadingState;
  paginationState: PaginationState;
}
export interface RequestAction {
  type: string;
  // requests?: Request[];
  requests: {
    items: Request[];
  };
  request?: Request;
  message?: string;
  error?: string;
  loading?: boolean;
  success?: boolean;
  requestForm?: RequestForm;
  pagination?: PaginationState;
  loadingState?: LoadingState;
  paginationState?: PaginationState;
}
