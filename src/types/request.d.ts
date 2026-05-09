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
  VERIFY_REQUEST_TOKEN_URI: string;
}

/**
 * v2 submission payload shape — multi-department capable.
 *
 * The legacy v1 shape used a single header-level `requesterDepartmentId`
 * plus an `items: { storeId, itemId, quantityLeased, conditionBeforeLease
 * }[]` array. v2 drops the header-level department entirely and gives
 * each item row its own `departmentId`. The server groups items by
 * `departmentId` to decide whether to write a flat row or a parent +
 * children tree.
 */
export interface RequestFormItem {
  departmentId: number;
  itemId: number;
  quantity: number;
}

export interface RequestForm {
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  isMinistry: boolean;
  ministryName: string;
  isChurch?: boolean;
  churchName?: string;
  // Requester's *own* department (kept for backward compat with the v1
  // payload field name on the server). Distinct from per-row department.
  requesterOwnDepartmentId?: number;
  requesterHodName?: string;
  requesterHodEmail?: string;
  requesterHodPhone?: string;
  locationOfUse: string;
  durationOfUse?: string;
  dateOfCollection: string;
  dateOfReturn: string;
  descriptionOfRequest: string;
  items: RequestFormItem[];
}

export interface UpdateStatusForm {
  requestId: string;
  status: string;
  /**
   * Optional decline reason. Phase 3 of the multi-department-requests
   * spec added a `{ reason?: string }` body on the decline endpoint —
   * the reason is rendered alongside the declined child on subsequent
   * detail-page views (see Multi-Department Requests Spec §4 / §11
   * Phase 6). Approve calls leave this undefined.
   */
  reason?: string;
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

/**
 * Audit-trail fields the API attaches to a Request (or each child of a
 * parent) once an HOD has acted. The fulfillment / collection / return
 * fields are only meaningful on flat rows or on a parent — a child never
 * advances past APPROVED / DECLINED.
 */
export interface RequestAudit {
  /** Items in this row's snapshot — children carry their own subset. */
  items?: Array<{
    id: number;
    itemId: number;
    itemName: string;
    quantityLeased: string;
    quantityReleased: string;
    quantityReturned: number;
    storeName?: string;
    conditionBeforeLease?: string;
    unitIds?: (number | string)[];
    units?: Array<{
      serialNumber: string;
      condition?: string;
      storeId?: number | null;
      storeName?: string | null;
    }>;
  }>;
  assigneeName?: string;
  collectedDate?: string;
  completedDate?: string;
  // Approval audit — Phase 3 multi-dept-requests. Populated on a child
  // (or flat row) the moment its HOD approves / declines. Parents never
  // carry these directly; their state is derived from children.
  approvedByUserId?: number | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  declinedByUserId?: number | null;
  declinedByName?: string | null;
  declinedAt?: string | null;
  declineReason?: string | null;
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
  // Multi-department tree wiring (Phase 3 detail endpoint).
  // - `parentId` is null on flat rows / parents, set on children.
  // - `fulfillingDepartmentId` is the department whose HOD owns the
  //   approve/decline decision for this row. On a parent it's null.
  // - `children` populates only on a parent detail response.
  // - `parent` populates only on a child detail response (read-only
  //   summary used by the UI to render the "Part of Request #PARENT_ID"
  //   banner — see Multi-Department Requests Spec §5.2).
  parentId?: number | null;
  // Listing-only field — derived from `parentId` server-side. Drives the
  // "Type" column on the requests table.
  requestType?: 'MAIN' | 'SUB';
  fulfillingDepartmentId?: number | null;
  fulfillingDepartmentName?: string | null;
  children?: Request[];
  parent?: Request;
  audit?: RequestAudit;
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
