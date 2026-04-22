import { auditLogConstants } from '@/constants/auditLog.constant';
import { AuditLogFilters, GetAuditLogsAction } from '@/types';

const getAuditLogs = (data?: AuditLogFilters): GetAuditLogsAction => ({
   type: auditLogConstants.GET_AUDIT_LOGS,
   data,
});

export const auditLogActions = {
   getAuditLogs,
};
