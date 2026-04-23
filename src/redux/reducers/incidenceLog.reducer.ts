import { combineReducers } from 'redux';
import { incidenceLogConstants } from '@/constants';
import { IncidenceLog } from '@/types/incidenceLog';

interface Action {
   type: string;
   logs?: {
      items: IncidenceLog[];
      links: { [k: string]: string | number | null };
      meta: {
         currentPage: number;
         itemCount: number;
         itemsPerPage: number;
         totalItems: number;
         totalPages: number;
      };
   };
}

const defaultMeta = {
   currentPage: 1,
   itemCount: 0,
   itemsPerPage: 10,
   totalItems: 0,
   totalPages: 0,
};

const IsRequestingIncidenceLogs = (state = false, action: Action): boolean => {
   switch (action.type) {
      case incidenceLogConstants.REQUEST_GET_INCIDENCE_LOGS:
         return true;
      case incidenceLogConstants.GET_INCIDENCE_LOGS_SUCCESS:
      case incidenceLogConstants.GET_INCIDENCE_LOGS_ERROR:
         return false;
      default:
         return state;
   }
};

const IsCreatingIncidenceLog = (state = false, action: Action): boolean => {
   switch (action.type) {
      case incidenceLogConstants.REQUEST_CREATE_INCIDENCE_LOG:
      case incidenceLogConstants.REQUEST_UPDATE_INCIDENCE_LOG:
         return true;
      case incidenceLogConstants.CREATE_INCIDENCE_LOG_SUCCESS:
      case incidenceLogConstants.CREATE_INCIDENCE_LOG_ERROR:
      case incidenceLogConstants.UPDATE_INCIDENCE_LOG_SUCCESS:
      case incidenceLogConstants.UPDATE_INCIDENCE_LOG_ERROR:
         return false;
      default:
         return state;
   }
};

const allIncidenceLogsList = (state: IncidenceLog[] = [], action: Action): IncidenceLog[] => {
   switch (action.type) {
      case incidenceLogConstants.GET_INCIDENCE_LOGS_SUCCESS:
         return action.logs?.items ?? [];
      default:
         return state;
   }
};

const pagination = (
   state = { links: {}, meta: defaultMeta },
   action: Action,
) => {
   switch (action.type) {
      case incidenceLogConstants.GET_INCIDENCE_LOGS_SUCCESS:
         return {
            links: action.logs?.links ?? {},
            meta: action.logs?.meta ?? defaultMeta,
         };
      default:
         return state;
   }
};

export default combineReducers({
   IsRequestingIncidenceLogs,
   IsCreatingIncidenceLog,
   allIncidenceLogsList,
   pagination,
});
