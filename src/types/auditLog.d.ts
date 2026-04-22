export interface AuditLogEvent {
   id: string;
   source: 'request' | 'item' | 'complaint';
   actor: string | null;
   entityType: string;
   entityId: number;
   action: string;
   occurredAt: string;
}

export interface AuditLogMeta {
   totalItems: number;
   itemCount: number;
   itemsPerPage: number;
   totalPages: number;
   currentPage: number;
}

export interface AuditLogFilters {
   from?: string;
   to?: string;
   entityType?: 'Request' | 'Item' | 'Complaint';
   action?: string;
   actor?: string;
   q?: string;
   page?: number;
   limit?: number;
}

export interface GetAuditLogsAction {
   type: string;
   data?: AuditLogFilters;
}
