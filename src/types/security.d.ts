export interface UserSession {
   id: number;
   userAgent: string | null;
   ipAddress: string | null;
   lastActiveAt: string | null;
   createdAt: string;
}

export interface LoginEvent {
   id: number;
   success: boolean;
   ipAddress: string | null;
   userAgent: string | null;
   failureReason: string | null;
   createdAt: string;
}

export interface GetSessionsAction {
   type: string;
}

export interface RevokeSessionAction {
   type: string;
   data: { sessionId: number };
}

export interface RevokeAllSessionsAction {
   type: string;
}

export interface GetLoginHistoryAction {
   type: string;
   data?: { limit?: number };
}
