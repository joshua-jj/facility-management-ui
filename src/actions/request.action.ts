import { RequestForm } from '@/types';
import { requestConstants } from '@/constants';

export interface CreateRequestAction {
  type: typeof requestConstants.CREATE_REQUEST;
  data: RequestForm;
}

interface GetAllRequestsAction {
  type: typeof requestConstants.GET_ALL_REQUESTS;
}

export interface GetDepartmentRequestsAction {
  type: typeof requestConstants.GET_DEPARTMENT_REQUESTS;
  data: { departmentId: number };
}

const createRequest = (data: RequestForm): CreateRequestAction => ({
  type: requestConstants.CREATE_REQUEST,
  data,
});

const getAllRequests = (): GetAllRequestsAction => ({
  type: requestConstants.GET_ALL_REQUESTS,
});

const getDepartmentRequests = (data: {
  departmentId: number;
}): GetDepartmentRequestsAction => ({
  type: requestConstants.GET_DEPARTMENT_REQUESTS,
  data,
});

export const requestActions = {
  createRequest,
  getAllRequests,
  getDepartmentRequests,
};
