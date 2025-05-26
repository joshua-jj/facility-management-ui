import {
  AssignRequestForm,
  ReleaseItemsForm,
  RequestForm,
  UpdateStatusForm,
} from '@/types';
import { requestConstants } from '@/constants';

export interface CreateRequestAction {
  type: typeof requestConstants.CREATE_REQUEST;
  data: RequestForm;
}

export interface GetAllRequestsAction {
  type: typeof requestConstants.GET_ALL_REQUESTS;
  data?: { page: number };
}

export interface GetDepartmentRequestsAction {
  type: typeof requestConstants.GET_DEPARTMENT_REQUESTS;
  data: { departmentId: number; page?: number };
}

export interface GetAssignedRequestsAction {
  type: typeof requestConstants.GET_ASSIGNED_REQUESTS;
  data: { userId: number; page?: number };
}

export interface UpdateRequestStatusAction {
  type: typeof requestConstants.UPDATE_REQUEST_STATUS;
  data: UpdateStatusForm;
}

export interface AssignRequestAction {
  type: typeof requestConstants.ASSIGN_REQUEST;
  data: AssignRequestForm;
}

export interface ReturnItemsAction {
  type: typeof requestConstants.RETURN_REQUEST_ITEMS;
  data: ReleaseItemsForm;
}

export interface ReleaseItemsAction {
  type: typeof requestConstants.RELEASE_REQUEST_ITEMS;
  data: ReleaseItemsForm;
}

const createRequest = (data: RequestForm): CreateRequestAction => ({
  type: requestConstants.CREATE_REQUEST,
  data,
});

const getAllRequests = (data?: { page: number }): GetAllRequestsAction => ({
  type: requestConstants.GET_ALL_REQUESTS,
  data,
});

const getDepartmentRequests = (data: {
  departmentId: number;
  page?: number;
}): GetDepartmentRequestsAction => ({
  type: requestConstants.GET_DEPARTMENT_REQUESTS,
  data,
});

const getAssignedRequests = (data: {
  userId: number;
  page?: number;
}): GetAssignedRequestsAction => ({
  type: requestConstants.GET_ASSIGNED_REQUESTS,
  data,
});

const updateRequestStatus = (
  data: UpdateStatusForm
): UpdateRequestStatusAction => ({
  type: requestConstants.UPDATE_REQUEST_STATUS,
  data,
});

const assignRequest = (data: AssignRequestForm): AssignRequestAction => ({
  type: requestConstants.ASSIGN_REQUEST,
  data,
});

const releaseRequestItems = (data: ReleaseItemsForm): ReleaseItemsAction => ({
  type: requestConstants.RELEASE_REQUEST_ITEMS,
  data,
});

const returnRequestItems = (data: ReleaseItemsForm): ReturnItemsAction => ({
  type: requestConstants.RETURN_REQUEST_ITEMS,
  data,
});

export const requestActions = {
  createRequest,
  getAllRequests,
  getDepartmentRequests,
  getAssignedRequests,
  updateRequestStatus,
  assignRequest,
  releaseRequestItems,
  returnRequestItems,
};
