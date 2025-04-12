import { combineReducers } from 'redux';
import { maintenanceConstants } from '@/constants';
import { LoadingState, MaintenanceLog, MaintenanceAction } from '@/types';

type MaintenanceLogsState = MaintenanceLog[];

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

const allMaintenanceLogsList = (
  state: MaintenanceLogsState = [],
  action: MaintenanceAction
): MaintenanceLogsState => {
  switch (action.type) {
    case maintenanceConstants.GET_MAINTENANCE_LOGS_SUCCESS:
      return action.data ?? state;
    default:
      return state;
  }
};

export interface RootState {
  IsRequestingMaintenanceLogs: (
    state: LoadingState | undefined,
    action: MaintenanceAction
  ) => LoadingState;
  allMaintenanceLogsList: (
    state: MaintenanceLogsState | undefined,
    action: MaintenanceAction
  ) => MaintenanceLogsState;
}

const rootReducer = combineReducers<RootState>({
  IsRequestingMaintenanceLogs,
  allMaintenanceLogsList,
});

export default rootReducer;
