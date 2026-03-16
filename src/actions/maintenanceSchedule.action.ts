import { MaintenanceScheduleForm } from '@/types/maintenanceSchedule';

export interface GetAllMaintenanceSchedulesAction {
  type: string;
  data?: { page?: number };
}

export interface CreateMaintenanceScheduleAction {
  type: string;
  data: MaintenanceScheduleForm;
}

export interface UpdateMaintenanceScheduleAction {
  type: string;
  data: MaintenanceScheduleForm & { id: number };
}

const getAllMaintenanceSchedules = (data?: { page?: number }): GetAllMaintenanceSchedulesAction => ({
  type: 'GET_ALL_MAINTENANCE_SCHEDULES',
  data,
});

const createMaintenanceSchedule = (data: MaintenanceScheduleForm): CreateMaintenanceScheduleAction => ({
  type: 'CREATE_MAINTENANCE_SCHEDULE',
  data,
});

const updateMaintenanceSchedule = (data: MaintenanceScheduleForm & { id: number }): UpdateMaintenanceScheduleAction => ({
  type: 'UPDATE_MAINTENANCE_SCHEDULE',
  data,
});

export const maintenanceScheduleActions = {
  getAllMaintenanceSchedules,
  createMaintenanceSchedule,
  updateMaintenanceSchedule,
};
