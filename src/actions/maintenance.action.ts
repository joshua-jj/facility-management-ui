import { maintenanceConstants } from '@/constants';

interface GetMaintenanceLogsAction {
  type: typeof maintenanceConstants.GET_MAINTENANCE_LOGS;
}

const getMaintenanceLogs = (): GetMaintenanceLogsAction => ({
  type: maintenanceConstants.GET_MAINTENANCE_LOGS,
});

export const maintenanceActions = {
  getMaintenanceLogs,
};
