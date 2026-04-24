import { PaginationState } from './maintenance';

export interface IncidenceLogConstants {
   REQUEST_GET_INCIDENCE_LOGS: string;
   GET_INCIDENCE_LOGS_SUCCESS: string;
   GET_INCIDENCE_LOGS_ERROR: string;

   REQUEST_CREATE_INCIDENCE_LOG: string;
   CREATE_INCIDENCE_LOG_SUCCESS: string;
   CREATE_INCIDENCE_LOG_ERROR: string;

   REQUEST_UPDATE_INCIDENCE_LOG: string;
   UPDATE_INCIDENCE_LOG_SUCCESS: string;
   UPDATE_INCIDENCE_LOG_ERROR: string;

   REQUEST_DELETE_INCIDENCE_LOG: string;
   DELETE_INCIDENCE_LOG_SUCCESS: string;
   DELETE_INCIDENCE_LOG_ERROR: string;

   GET_INCIDENCE_LOGS: string;
   CREATE_INCIDENCE_LOG: string;
   UPDATE_INCIDENCE_LOG: string;
   DELETE_INCIDENCE_LOG: string;

   INCIDENCE_LOG_URI: string;
}

export interface IncidenceLogForm {
   id?: number;
   incidenceDate: string;
   locationId: number;
   departmentId: number;
   incidents: string[];
   conclusions: string[];
   actionsTaken: string[];
   reportedBy: string;
   reportedByUserId?: number;
}

export interface IncidenceLog {
   id: number;
   incidenceDate: string;
   location: { id: number; name: string };
   department: { id: number; name: string };
   incidents: string[];
   conclusions: string[];
   actionsTaken: string[];
   reportedBy: string;
   reportedByUserId?: number | null;
   createdAt: string;
   createdBy: string;
   updatedAt?: string;
   updatedBy?: string;
   status: string;
}

export interface IncidenceLogState {
   IsRequestingIncidenceLogs: boolean;
   IsCreatingIncidenceLog: boolean;
   allIncidenceLogsList: IncidenceLog[];
   pagination: PaginationState;
}
