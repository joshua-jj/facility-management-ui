import { maintenanceConstants } from '@/constants';
import { MaintenanceForm } from '@/types';

interface GetMaintenanceLogsAction {
  type: typeof maintenanceConstants.GET_MAINTENANCE_LOGS;
}
export interface CreateMaintenanceLogAction {
  type: typeof maintenanceConstants.CREATE_MAINTENANCE_LOG;
  data: MaintenanceForm;
}

export interface SearchMaintenanceLogAction {
  type: typeof maintenanceConstants.SEARCH_MAINTENANCE_LOG;
  data: { text: string };
}

const getMaintenanceLogs = (): GetMaintenanceLogsAction => ({
  type: maintenanceConstants.GET_MAINTENANCE_LOGS,
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
