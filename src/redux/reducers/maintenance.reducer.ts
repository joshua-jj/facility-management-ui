import { combineReducers } from 'redux';
import { maintenanceConstants } from '@/constants';
import {
  LoadingState,
  MaintenanceLog,
  Action,
  MaintenanceAction,
  PaginationState,
} from '@/types';
import { updateObject } from '@/utilities/reducerUtility';

type MaintenanceLogsState = MaintenanceLog[];

interface AllMaintenanceLogsAction extends Action {
  logs: {
    items: MaintenanceLog[];
    links: { [key: string]: string | number | null };
    meta: {
      currentPage: number;
      itemCount: number;
      itemsPerPage: number;
      totalItems: number;
      totalPages: number;
    };
  };
  log: MaintenanceLog[];
}

const IsRequestingMaintenanceLogs = (
  state: LoadingState = false,
  action: MaintenanceAction
): LoadingState => {
  switch (action.type) {
    case maintenanceConstants.REQUEST_GET_MAINTENANCE_LOGS:
      return true;
    case maintenanceConstants.GET_MAINTENANCE_LOGS_SUCCESS:
    case maintenanceConstants.GET_MAINTENANCE_LOGS_ERROR:
      return false;
    default:
      return state;
  }
};

const IsCreatingMaintenanceLog = (
  state: LoadingState = false,
  action: MaintenanceAction
): LoadingState => {
  switch (action.type) {
    case maintenanceConstants.REQUEST_CREATE_MAINTENANCE_LOG:
      return true;
    case maintenanceConstants.CREATE_MAINTENANCE_LOG_SUCCESS:
    case maintenanceConstants.CREATE_MAINTENANCE_LOG_ERROR:
      return false;
    default:
      return state;
  }
};

const IsSearchingMaintenanceLog = (
  state: LoadingState = false,
  action: MaintenanceAction
): LoadingState => {
  switch (action.type) {
    case maintenanceConstants.REQUEST_SEARCH_MAINTENANCE_LOG:
      return true;
    case maintenanceConstants.SEARCH_MAINTENANCE_LOG_SUCCESS:
    case maintenanceConstants.SEARCH_MAINTENANCE_LOG_ERROR:
      return false;
    default:
      return state;
  }
};

const allMaintenanceLogsList = (
  state: MaintenanceLogsState = [],
  action: AllMaintenanceLogsAction
): MaintenanceLogsState => {
  switch (action.type) {
    case maintenanceConstants.GET_MAINTENANCE_LOGS_SUCCESS:
      return action.logs?.items ?? state;
    case maintenanceConstants.SEARCH_MAINTENANCE_LOG_SUCCESS:
      return action.log ?? state;
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
  action: AllMaintenanceLogsAction
): PaginationState => {
  switch (action.type) {
    case maintenanceConstants.GET_MAINTENANCE_LOGS_SUCCESS: {
      const { links, meta } = action.logs;
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

export interface RootState {
  IsRequestingMaintenanceLogs: (
    state: LoadingState | undefined,
    action: MaintenanceAction
  ) => LoadingState;
  IsCreatingMaintenanceLog: (
    state: LoadingState | undefined,
    action: MaintenanceAction
  ) => LoadingState;
  IsSearchingMaintenanceLog: (
    state: LoadingState | undefined,
    action: MaintenanceAction
  ) => LoadingState;
  allMaintenanceLogsList: (
    state: MaintenanceLogsState | undefined,
    action: AllMaintenanceLogsAction
  ) => MaintenanceLogsState;
  pagination: (
    state: PaginationState | undefined,
    action: AllMaintenanceLogsAction
  ) => PaginationState;
}

const rootReducer = combineReducers<RootState>({
  IsRequestingMaintenanceLogs,
  IsCreatingMaintenanceLog,
  IsSearchingMaintenanceLog,
  allMaintenanceLogsList,
  pagination,
});

export default rootReducer;
