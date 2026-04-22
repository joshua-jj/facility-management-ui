import { combineReducers } from 'redux';
import { securityConstants } from '@/constants/security.constant';
import { LoginEvent, UserSession } from '@/types';

interface Action {
   type: string;
   sessions?: UserSession[];
   events?: LoginEvent[];
   sessionId?: number;
   message?: string;
   error?: string;
}

const sessions = (state: UserSession[] = [], action: Action): UserSession[] => {
   switch (action.type) {
      case securityConstants.GET_SESSIONS_SUCCESS:
         return action.sessions ?? [];
      case securityConstants.REVOKE_SESSION_SUCCESS:
         return state.filter((s) => s.id !== action.sessionId);
      case securityConstants.REVOKE_ALL_SESSIONS_SUCCESS:
         return [];
      default:
         return state;
   }
};

const loginHistory = (state: LoginEvent[] = [], action: Action): LoginEvent[] => {
   switch (action.type) {
      case securityConstants.GET_LOGIN_HISTORY_SUCCESS:
         return action.events ?? [];
      default:
         return state;
   }
};

const IsFetchingSessions = (state = false, action: Action): boolean => {
   switch (action.type) {
      case securityConstants.REQUEST_GET_SESSIONS:
         return true;
      case securityConstants.GET_SESSIONS_SUCCESS:
      case securityConstants.GET_SESSIONS_FAILURE:
         return false;
      default:
         return state;
   }
};

const IsRevokingSession = (state = false, action: Action): boolean => {
   switch (action.type) {
      case securityConstants.REQUEST_REVOKE_SESSION:
      case securityConstants.REQUEST_REVOKE_ALL_SESSIONS:
         return true;
      case securityConstants.REVOKE_SESSION_SUCCESS:
      case securityConstants.REVOKE_SESSION_FAILURE:
      case securityConstants.REVOKE_ALL_SESSIONS_SUCCESS:
      case securityConstants.REVOKE_ALL_SESSIONS_FAILURE:
         return false;
      default:
         return state;
   }
};

const IsFetchingLoginHistory = (state = false, action: Action): boolean => {
   switch (action.type) {
      case securityConstants.REQUEST_GET_LOGIN_HISTORY:
         return true;
      case securityConstants.GET_LOGIN_HISTORY_SUCCESS:
      case securityConstants.GET_LOGIN_HISTORY_FAILURE:
         return false;
      default:
         return state;
   }
};

const error = (state: string | null = null, action: Action): string | null => {
   switch (action.type) {
      case securityConstants.GET_SESSIONS_FAILURE:
      case securityConstants.REVOKE_SESSION_FAILURE:
      case securityConstants.REVOKE_ALL_SESSIONS_FAILURE:
      case securityConstants.GET_LOGIN_HISTORY_FAILURE:
         return action.error ?? 'Security action failed';
      case securityConstants.REQUEST_GET_SESSIONS:
      case securityConstants.REQUEST_GET_LOGIN_HISTORY:
         return null;
      default:
         return state;
   }
};

export default combineReducers({
   sessions,
   loginHistory,
   IsFetchingSessions,
   IsRevokingSession,
   IsFetchingLoginHistory,
   error,
});
