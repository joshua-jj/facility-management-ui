export interface NotificationDto {
   id: number;
   userId: number;
   type: string;
   title: string;
   body: string | null;
   actorName: string | null;
   actorUserId: number | null;
   entityType: string;
   entityId: number;
   link: string;
   readAt: string | null;
   assignedToMe: boolean;
   createdAt: string;
}

export interface NotificationListResponse {
   items: NotificationDto[];
   nextCursor: string | null;
   unreadCount: number;
}

export interface NotificationListQuery {
   limit?: number;
   cursor?: string;
   unreadOnly?: boolean;
   assignedToMe?: boolean;
}

export interface NotificationState {
   items: NotificationDto[];
   unreadCount: number;
   nextCursor: string | null;
   isLoading: boolean;
   isStreamConnected: boolean;
   error: string | null;
}
