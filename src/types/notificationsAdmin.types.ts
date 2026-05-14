/**
 * UI types for the SA-only notification delivery admin surface.
 *
 * Mirrors the API DTOs at
 * `facility-management-api/src/core/notification/dto/notification-delivery.dto.ts`
 * and the list response shape from `NotificationService.listAdmin()`. Keep
 * the two in lockstep — a renamed field on the API without a matching
 * change here will silently render `undefined` in the table.
 */

export enum EmailStatus {
   SENT = 'SENT',
   FAILED = 'FAILED',
   PERMANENTLY_FAILED = 'PERMANENTLY_FAILED',
   ABANDONED = 'ABANDONED',
}

export interface NotificationRecipient {
   /** Discriminator: `user` rows have a `userId`; `guest` rows do not. */
   type: 'user' | 'guest';
   email: string;
   name: string | null;
   userId: number | null;
}

export interface NotificationEntityRef {
   /** Snake/lower-case entity slug used by the API (e.g. `request`, `maintenance_log`). */
   type: string;
   id: number;
}

export interface NotificationDelivery {
   id: number;
   recipient: NotificationRecipient;
   entity: NotificationEntityRef;
   eventType: string;
   emailStatus: EmailStatus;
   emailAttemptCount: number;
   /** ISO-8601 timestamp; `null` if the row has never been attempted. */
   emailLastAttemptAt: string | null;
   /** Truncated provider error from the last failed attempt. */
   emailLastError: string | null;
   /** ISO-8601 timestamp the cron is allowed to retry next; `null` once terminal. */
   emailNextAttemptAt: string | null;
   link: string;
   createdAt: string;
}

export interface NotificationDeliveriesPageMeta {
   totalItems: number;
   itemCount: number;
   itemsPerPage: number;
   totalPages: number;
   currentPage: number;
}

export interface NotificationDeliveriesPage {
   data: NotificationDelivery[];
   meta: NotificationDeliveriesPageMeta;
}

/**
 * Query params accepted by `GET /notification/admin`. All optional —
 * the API defaults to `page=1`, `limit=25`, no status filter.
 *
 * `status` is sent as a comma-separated CSV by the saga.
 * `from` / `to` are ISO date strings (`yyyy-MM-dd`).
 */
export interface NotificationDeliveriesQuery {
   page?: number;
   limit?: number;
   status?: EmailStatus[];
   from?: string;
   to?: string;
   search?: string;
   entityType?: string;
}
