import { combineReducers } from 'redux';
import { requestConstants } from '@/constants';
import { Action, LoadingState, Request, RequestAction } from '@/types';

type RequestsListState = Request[];

const IsCreatingRequest = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case requestConstants.REQUEST_CREATE_REQUEST:
      return true;
    case requestConstants.CREATE_REQUEST_SUCCESS:
    case requestConstants.CREATE_REQUEST_ERROR:
      return false;
    default:
      return state;
  }
};

const IsRequestingRequests = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case requestConstants.REQUEST_GET_ALL_REQUESTS:
      return true;
    case requestConstants.GET_ALL_REQUESTS_SUCCESS:
    case requestConstants.GET_ALL_REQUESTS_ERROR:
      return false;
    default:
      return state;
  }
};

const allRequestsList = (
  state: RequestsListState = [],
  action: RequestAction
): RequestsListState => {
  switch (action.type) {
    case requestConstants.GET_ALL_REQUESTS_SUCCESS:
      return action.requests?.items ?? state;
    default:
      return state;
  }
};

// const pagination = (
//   state: PaginationState = null,
//   action: Action
// ): PaginationState => {
//   switch (action.type) {
//     case eventConstants.GET_ALL_EVENTS_SUCCESS:
//       return action.pagination ?? state;
//     default:
//       return state;
//   }
// };

export interface RootState {
  IsCreatingRequest: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  IsRequestingRequests: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  allRequestsList: (
    state: RequestsListState | undefined,
    action: RequestAction
  ) => RequestsListState;
  //   pagination: PaginationState;
}

const rootReducer = combineReducers<RootState>({
  IsCreatingRequest,
  IsRequestingRequests,
  allRequestsList,
  //   pagination,
});

export default rootReducer;
