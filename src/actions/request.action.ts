import { RequestForm } from '@/types';
import { requestConstants } from '@/constants';

interface CreateRequestAction {
  type: typeof requestConstants.CREATE_REQUEST;
  data: RequestForm;
}

const createRequest = (data: RequestForm): CreateRequestAction => ({
  type: requestConstants.CREATE_REQUEST,
  data,
});

export const requestActions = {
  createRequest,
};
