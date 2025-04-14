import { maintenanceConstants } from '@/constants';

interface GetMaintenanceLogsAction {
  type: typeof maintenanceConstants.GET_MAINTENANCE_LOGS;
}
export interface SearchMaintenanceLogAction {
  type: typeof maintenanceConstants.SEARCH_MAINTENANCE_LOG;
  data: { text: string };
}

const getMaintenanceLogs = (): GetMaintenanceLogsAction => ({
  type: maintenanceConstants.GET_MAINTENANCE_LOGS,
});

const searchMaintenanceLog = (data: {
  text: string;
}): SearchMaintenanceLogAction => ({
  type: maintenanceConstants.SEARCH_MAINTENANCE_LOG,
  data,
});

export const maintenanceActions = {
  getMaintenanceLogs,
  searchMaintenanceLog,
};
