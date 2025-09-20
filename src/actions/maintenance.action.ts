import { maintenanceConstants } from '@/constants';
import { MaintenanceForm } from '@/types';

export interface GetMaintenanceLogsAction {
  type: typeof maintenanceConstants.GET_MAINTENANCE_LOGS;
  data?: { page: number };
}
export interface CreateMaintenanceLogAction {
  type: typeof maintenanceConstants.CREATE_MAINTENANCE_LOG;
  data: MaintenanceForm;
}

export interface SearchMaintenanceLogAction {
  type: typeof maintenanceConstants.SEARCH_MAINTENANCE_LOG;
  data: { text: string };
}

const getMaintenanceLogs = (data?: {
  page: number;
}): GetMaintenanceLogsAction => ({
  type: maintenanceConstants.GET_MAINTENANCE_LOGS,
  data,
});

const createMaintenanceLog = (
  data: MaintenanceForm
): CreateMaintenanceLogAction => ({
  type: maintenanceConstants.CREATE_MAINTENANCE_LOG,
  data,
});

const searchMaintenanceLog = (data: {
  text: string;
}): SearchMaintenanceLogAction => ({
  type: maintenanceConstants.SEARCH_MAINTENANCE_LOG,
  data,
});

export const maintenanceActions = {
  getMaintenanceLogs,
  createMaintenanceLog,
  searchMaintenanceLog,
};
