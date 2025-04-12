import { MaintenanceConstants } from '@/types';
import { appConstants } from './app.constant';

const maintenance: string = 'maintenance-log';

export const maintenanceConstants: MaintenanceConstants = {
  REQUEST_GET_MAINTENANCE_LOGS: 'REQUEST_GET_MAINTENANCE_LOGS',
  GET_MAINTENANCE_LOGS_SUCCESS: 'GET_MAINTENANCE_LOGS_SUCCESS',
  GET_MAINTENANCE_LOGS_ERROR: 'GET_MAINTENANCE_LOGS_ERROR',

  GET_MAINTENANCE_LOGS: 'GET_MAINTENANCE_LOGS',

  MAINTENANCE_URI: `${appConstants.BASE_URI}${maintenance}`,
};
