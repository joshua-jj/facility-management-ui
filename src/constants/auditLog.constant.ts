import { appConstants } from './app.constant';

export const auditLogConstants = {
   REQUEST_GET_AUDIT_LOGS: 'REQUEST_GET_AUDIT_LOGS',
   GET_AUDIT_LOGS_SUCCESS: 'GET_AUDIT_LOGS_SUCCESS',
   GET_AUDIT_LOGS_FAILURE: 'GET_AUDIT_LOGS_FAILURE',

   GET_AUDIT_LOGS: 'GET_AUDIT_LOGS',

   AUDIT_LOGS_URI: `${appConstants.BASE_URI}audit-logs`,
};
