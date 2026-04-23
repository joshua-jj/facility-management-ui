import { incidenceLogConstants } from '@/constants';
import { IncidenceLogForm } from '@/types/incidenceLog';

export interface IncidenceLogFilters {
   page?: number;
   limit?: number;
   search?: string;
   status?: string;
   locationId?: number;
   departmentId?: number;
   dateFrom?: string;
   dateTo?: string;
}

export interface GetIncidenceLogsAction {
   type: typeof incidenceLogConstants.GET_INCIDENCE_LOGS;
   data?: IncidenceLogFilters;
}
export interface CreateIncidenceLogAction {
   type: typeof incidenceLogConstants.CREATE_INCIDENCE_LOG;
   data: IncidenceLogForm;
}
export interface UpdateIncidenceLogAction {
   type: typeof incidenceLogConstants.UPDATE_INCIDENCE_LOG;
   data: IncidenceLogForm;
}
export interface DeleteIncidenceLogAction {
   type: typeof incidenceLogConstants.DELETE_INCIDENCE_LOG;
   id: number;
}

const getIncidenceLogs = (data?: IncidenceLogFilters): GetIncidenceLogsAction => ({
   type: incidenceLogConstants.GET_INCIDENCE_LOGS,
   data,
});
const createIncidenceLog = (data: IncidenceLogForm): CreateIncidenceLogAction => ({
   type: incidenceLogConstants.CREATE_INCIDENCE_LOG,
   data,
});
const updateIncidenceLog = (data: IncidenceLogForm): UpdateIncidenceLogAction => ({
   type: incidenceLogConstants.UPDATE_INCIDENCE_LOG,
   data,
});
const deleteIncidenceLog = (id: number): DeleteIncidenceLogAction => ({
   type: incidenceLogConstants.DELETE_INCIDENCE_LOG,
   id,
});

export const incidenceLogActions = {
   getIncidenceLogs,
   createIncidenceLog,
   updateIncidenceLog,
   deleteIncidenceLog,
};
