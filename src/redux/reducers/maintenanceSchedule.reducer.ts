import { combineReducers } from 'redux';
import { maintenanceScheduleConstants } from '@/constants/maintenanceSchedule.constant';
import { Action, LoadingState } from '@/types';
import { MaintenanceSchedule } from '@/types/maintenanceSchedule';

interface MaintenanceScheduleAction extends Action {
  schedules: MaintenanceSchedule[];
}

const IsRequestingMaintenanceSchedules = (
  state: LoadingState = false,
  action: Action,
): LoadingState => {
  switch (action.type) {
    case maintenanceScheduleConstants.REQUEST_GET_ALL_MAINTENANCE_SCHEDULES:
      return true;
    case maintenanceScheduleConstants.GET_ALL_MAINTENANCE_SCHEDULES_SUCCESS:
    case maintenanceScheduleConstants.GET_ALL_MAINTENANCE_SCHEDULES_ERROR:
      return false;
    default:
      return state;
  }
};

const IsCreatingMaintenanceSchedule = (
  state: LoadingState = false,
  action: Action,
): LoadingState => {
  switch (action.type) {
    case maintenanceScheduleConstants.REQUEST_CREATE_MAINTENANCE_SCHEDULE:
      return true;
    case maintenanceScheduleConstants.CREATE_MAINTENANCE_SCHEDULE_SUCCESS:
    case maintenanceScheduleConstants.CREATE_MAINTENANCE_SCHEDULE_ERROR:
      return false;
    default:
      return state;
  }
};

const allMaintenanceSchedulesList = (
  state: MaintenanceSchedule[] = [],
  action: MaintenanceScheduleAction,
): MaintenanceSchedule[] => {
  switch (action.type) {
    case maintenanceScheduleConstants.GET_ALL_MAINTENANCE_SCHEDULES_SUCCESS:
      return action.schedules ?? state;
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  IsRequestingMaintenanceSchedules,
  IsCreatingMaintenanceSchedule,
  allMaintenanceSchedulesList,
});

export default rootReducer;
