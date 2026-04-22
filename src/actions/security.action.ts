import { securityConstants } from '@/constants/security.constant';
import {
   GetLoginHistoryAction,
   GetSessionsAction,
   RevokeAllSessionsAction,
   RevokeSessionAction,
} from '@/types';

const getSessions = (): GetSessionsAction => ({
   type: securityConstants.GET_SESSIONS,
});

const revokeSession = (sessionId: number): RevokeSessionAction => ({
   type: securityConstants.REVOKE_SESSION,
   data: { sessionId },
});

const revokeAllSessions = (): RevokeAllSessionsAction => ({
   type: securityConstants.REVOKE_ALL_SESSIONS,
});

const getLoginHistory = (limit?: number): GetLoginHistoryAction => ({
   type: securityConstants.GET_LOGIN_HISTORY,
   data: limit != null ? { limit } : undefined,
});

export const securityActions = {
   getSessions,
   revokeSession,
   revokeAllSessions,
   getLoginHistory,
};
