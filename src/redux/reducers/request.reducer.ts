import { combineReducers } from 'redux';
import { requestConstants } from '@/constants';
import { Action, LoadingState, PaginationState, Request } from '@/types';
import { updateObject } from '@/utilities/reducerUtility';

type RequestsListState = Request[];

interface AllRequestsAction extends Action {
  requests: {
    items: Request[];
    links: { [key: string]: string | number | null };
    meta: {
      currentPage: number;
      itemCount: number;
      itemsPerPage: number;
      totalItems: number;
      totalPages: number;
    };
  };
  request: Request[];
}

// Workflow Rules Module (Phase 3) — server-side action gates.
// `null` is the load-bearing sentinel: the hook treats it as "no
// server verdict yet, fall back to local computation". An empty
// array means "engine evaluated and returned no available actions"
// (e.g. terminal states like Completed) — semantically different
// from "haven't asked yet".
type ServerActionRow = {
  action: string;
  toState?: string;
  transitionId?: number;
};
type ServerActionsState = ServerActionRow[] | null;

interface ServerActionsAction extends Action {
  actions?: ServerActionRow[];
}

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

const IsUpdatingRequestStatus = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case requestConstants.REQUEST_UPDATE_REQUEST_STATUS:
      return true;
    case requestConstants.UPDATE_REQUEST_STATUS_SUCCESS:
    case requestConstants.UPDATE_REQUEST_STATUS_ERROR:
      return false;
    default:
      return state;
  }
};

const IsAssigningRequest = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case requestConstants.REQUEST_ASSIGN_REQUEST:
      return true;
    case requestConstants.ASSIGN_REQUEST_SUCCESS:
    case requestConstants.ASSIGN_REQUEST_ERROR:
      return false;
    default:
      return state;
  }
};

const IsReleasingRequestItems = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case requestConstants.REQUEST_RELEASE_REQUEST_ITEMS:
      return true;
    case requestConstants.RELEASE_REQUEST_ITEMS_SUCCESS:
    case requestConstants.RELEASE_REQUEST_ITEMS_ERROR:
      return false;
    default:
      return state;
  }
};

const IsReturningRequestItems = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case requestConstants.REQUEST_RETURN_REQUEST_ITEMS:
      return true;
    case requestConstants.RETURN_REQUEST_ITEMS_SUCCESS:
    case requestConstants.RETURN_REQUEST_ITEMS_ERROR:
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
    case requestConstants.REQUEST_GET_DEPARTMENT_REQUESTS:
    case requestConstants.REQUEST_GET_ASSIGNED_REQUESTS:
      return true;
    case requestConstants.GET_ALL_REQUESTS_SUCCESS:
    case requestConstants.GET_ALL_REQUESTS_ERROR:
    case requestConstants.GET_DEPARTMENT_REQUESTS_SUCCESS:
    case requestConstants.GET_DEPARTMENT_REQUESTS_ERROR:
    case requestConstants.GET_ASSIGNED_REQUESTS_SUCCESS:
    case requestConstants.GET_ASSIGNED_REQUESTS_ERROR:
      return false;
    default:
      return state;
  }
};

const allRequestsList = (
  state: RequestsListState = [],
  action: AllRequestsAction
): RequestsListState => {
  switch (action.type) {
    case requestConstants.GET_ALL_REQUESTS_SUCCESS:
      return action.requests?.items ?? state;
    case requestConstants.GET_DEPARTMENT_REQUESTS_SUCCESS:
      return action.requests?.items ?? state;
    case requestConstants.GET_ASSIGNED_REQUESTS_SUCCESS:
      return action.requests?.items ?? state;
    default:
      return state;
  }
};

const pagination = (
  state: PaginationState = {
    links: {
      first: null,
      last: null,
      next: null,
      previous: null,
    },
    meta: {
      currentPage: 0,
      itemCount: 0,
      itemsPerPage: 0,
      totalItems: 0,
      totalPages: 0,
    },
  },
  action: AllRequestsAction
): PaginationState => {
  switch (action.type) {
    case requestConstants.GET_ALL_REQUESTS_SUCCESS: {
      const { links, meta } = action.requests;
      const result = {
        links,
        meta,
      };

      return updateObject(state, result);
    }
    case requestConstants.GET_DEPARTMENT_REQUESTS_SUCCESS: {
      const { links, meta } = action.requests;
      const result = {
        links,
        meta,
      };

      return updateObject(state, result);
    }
    case requestConstants.GET_ASSIGNED_REQUESTS_SUCCESS: {
      const { links, meta } = action.requests;
      const result = {
        links,
        meta,
      };

      return updateObject(state, result);
    }
    default:
      return state;
  }
};

const serverActions = (
  state: ServerActionsState = null,
  action: ServerActionsAction
): ServerActionsState => {
  switch (action.type) {
    case requestConstants.GET_REQUEST_ACTIONS_SUCCESS:
      // Server has spoken — store the array verbatim (may be empty).
      return action.actions ?? [];
    case requestConstants.GET_REQUEST_ACTIONS_FAILURE:
    case requestConstants.RESET_REQUEST_ACTIONS:
    // Reset when a new detail-page load starts so the hook falls
    // back to local computation until the fresh fetch lands. The
    // page dispatches getRequestActions immediately after, so the
    // null window is only one render frame in practice.
    case requestConstants.REQUEST_GET_REQUEST_ACTIONS:
      return null;
    default:
      return state;
  }
};

export interface RootState {
  IsCreatingRequest: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  IsUpdatingRequestStatus: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  IsAssigningRequest: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  IsReleasingRequestItems: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  IsReturningRequestItems: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  IsRequestingRequests: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  allRequestsList: (
    state: RequestsListState | undefined,
    action: AllRequestsAction
  ) => RequestsListState;
  pagination: (
    state: PaginationState | undefined,
    action: AllRequestsAction
  ) => PaginationState;
  serverActions: (
    state: ServerActionsState | undefined,
    action: ServerActionsAction
  ) => ServerActionsState;
}

const rootReducer = combineReducers<RootState>({
  IsCreatingRequest,
  IsUpdatingRequestStatus,
  IsAssigningRequest,
  IsReleasingRequestItems,
  IsReturningRequestItems,
  IsRequestingRequests,
  allRequestsList,
  pagination,
  serverActions,
});

export default rootReducer;
