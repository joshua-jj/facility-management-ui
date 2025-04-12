export interface RequestConstants {
  REQUEST_CREATE_REQUEST: string;
  CREATE_REQUEST_SUCCESS: string;
  CREATE_REQUEST_ERROR: string;

  CREATE_REQUEST: string;

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
  durationOfUse: string;
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
export interface Request {
  id: number;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  isMinistry: boolean;
  ministryName: string;
  isChurch?: boolean;
  churchName?: string;
  requesterDepartmentId: number | undefined;
  locationOfUse: string;
  durationOfUse: string;
  dateOfReturn: string;
  descriptionOfRequest: string;
  createdAt: string;
  updatedAt: string;
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
  data?: Request[];
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
