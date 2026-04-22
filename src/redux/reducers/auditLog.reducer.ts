import { combineReducers } from 'redux';
import { auditLogConstants } from '@/constants/auditLog.constant';
import { AuditLogEvent, AuditLogMeta } from '@/types';

interface Action {
   type: string;
   items?: AuditLogEvent[];
   meta?: AuditLogMeta | null;
   error?: string;
}

const defaultMeta: AuditLogMeta = {
   totalItems: 0,
   itemCount: 0,
   itemsPerPage: 20,
   totalPages: 1,
   currentPage: 1,
};

const items = (state: AuditLogEvent[] = [], action: Action): AuditLogEvent[] => {
   switch (action.type) {
      case auditLogConstants.GET_AUDIT_LOGS_SUCCESS:
         return action.items ?? [];
      default:
         return state;
   }
};

const meta = (state: AuditLogMeta = defaultMeta, action: Action): AuditLogMeta => {
   switch (action.type) {
      case auditLogConstants.GET_AUDIT_LOGS_SUCCESS:
         return action.meta ?? defaultMeta;
      default:
         return state;
   }
};

const IsFetchingAuditLogs = (state = false, action: Action): boolean => {
   switch (action.type) {
      case auditLogConstants.REQUEST_GET_AUDIT_LOGS:
         return true;
      case auditLogConstants.GET_AUDIT_LOGS_SUCCESS:
      case auditLogConstants.GET_AUDIT_LOGS_FAILURE:
         return false;
      default:
         return state;
   }
};

const error = (state: string | null = null, action: Action): string | null => {
   switch (action.type) {
      case auditLogConstants.REQUEST_GET_AUDIT_LOGS:
         return null;
      case auditLogConstants.GET_AUDIT_LOGS_FAILURE:
         return action.error ?? 'Failed to fetch audit logs';
      default:
         return state;
   }
};

export default combineReducers({
   items,
   meta,
   IsFetchingAuditLogs,
   error,
});
