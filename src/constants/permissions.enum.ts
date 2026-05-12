/**
 * Wire-format permission strings used by the UI when gating UI elements
 * on capability — `can(...)`, `canAny([...])`, `<RoleGuard permission=...>`,
 * `<PrivateRoute permissions={[...]}>`, route metadata in `pageRoutes.tsx`.
 *
 * Mirrors the API's `Permission` enum at
 * `facility-management-api/src/common/enums/permission.enum.ts`. Keep
 * the two in lockstep when adding a new capability — they share the wire
 * format, so a renamed enum value on one side without the other will
 * silently fail the capability check.
 *
 * Call sites use the constant instead of inlining a string:
 *
 *   can(Permission.REQUESTS_RELEASE)        // ✅ refactor-safe
 *   can('requests:release')                 // ❌ hard-coded literal
 */
export enum Permission {
   // ── Dashboard ─────────────────────────────────────────────────────
   DASHBOARD_READ = 'dashboard:read',
   DASHBOARD_WRITE = 'dashboard:write',
   DASHBOARD_MANAGE = 'dashboard:manage',

   // ── Requests ──────────────────────────────────────────────────────
   REQUESTS_READ = 'requests:read',
   REQUESTS_WRITE = 'requests:write',
   REQUESTS_DELETE = 'requests:delete',
   REQUESTS_APPROVE = 'requests:approve',
   REQUESTS_DECLINE = 'requests:decline',
   REQUESTS_ASSIGN = 'requests:assign',
   REQUESTS_RELEASE = 'requests:release',
   REQUESTS_RETURN = 'requests:return',
   REQUESTS_MANAGE = 'requests:manage',

   // ── Items ─────────────────────────────────────────────────────────
   ITEMS_READ = 'items:read',
   ITEMS_WRITE = 'items:write',
   ITEMS_DELETE = 'items:delete',
   ITEMS_MANAGE = 'items:manage',

   // ── Stores ────────────────────────────────────────────────────────
   STORES_READ = 'stores:read',
   STORES_WRITE = 'stores:write',
   STORES_DELETE = 'stores:delete',
   STORES_MANAGE = 'stores:manage',

   // ── Departments ───────────────────────────────────────────────────
   DEPARTMENTS_READ = 'departments:read',
   DEPARTMENTS_WRITE = 'departments:write',
   DEPARTMENTS_DELETE = 'departments:delete',
   DEPARTMENTS_MANAGE = 'departments:manage',

   // ── Meetings & meeting locations ──────────────────────────────────
   MEETINGS_READ = 'meetings:read',
   MEETINGS_WRITE = 'meetings:write',
   MEETINGS_DELETE = 'meetings:delete',
   MEETINGS_MANAGE = 'meetings:manage',
   MEETING_LOCATIONS_READ = 'meeting-locations:read',
   MEETING_LOCATIONS_WRITE = 'meeting-locations:write',
   MEETING_LOCATIONS_DELETE = 'meeting-locations:delete',
   MEETING_LOCATIONS_MANAGE = 'meeting-locations:manage',

   // ── Maintenance logs ──────────────────────────────────────────────
   MAINTENANCE_LOGS_READ = 'maintenance-logs:read',
   MAINTENANCE_LOGS_WRITE = 'maintenance-logs:write',
   MAINTENANCE_LOGS_DELETE = 'maintenance-logs:delete',
   MAINTENANCE_LOGS_MANAGE = 'maintenance-logs:manage',

   // ── Generator logs ────────────────────────────────────────────────
   GENERATOR_LOGS_READ = 'generator-logs:read',
   GENERATOR_LOGS_WRITE = 'generator-logs:write',
   GENERATOR_LOGS_DELETE = 'generator-logs:delete',
   GENERATOR_LOGS_MANAGE = 'generator-logs:manage',

   // ── Incidence logs ────────────────────────────────────────────────
   INCIDENCE_LOGS_READ = 'incidence-logs:read',
   INCIDENCE_LOGS_WRITE = 'incidence-logs:write',
   INCIDENCE_LOGS_DELETE = 'incidence-logs:delete',
   INCIDENCE_LOGS_MANAGE = 'incidence-logs:manage',

   // ── Complaints ────────────────────────────────────────────────────
   COMPLAINTS_READ = 'complaints:read',
   COMPLAINTS_WRITE = 'complaints:write',
   COMPLAINTS_DELETE = 'complaints:delete',
   COMPLAINTS_ASSIGN = 'complaints:assign',
   COMPLAINTS_RESOLVE = 'complaints:resolve',
   COMPLAINTS_MANAGE = 'complaints:manage',

   // ── Analytics & reports ───────────────────────────────────────────
   ANALYTICS_READ = 'analytics:read',
   ANALYTICS_MANAGE = 'analytics:manage',
   REPORTS_READ = 'reports:read',
   REPORTS_MANAGE = 'reports:manage',

   // ── User & role administration ────────────────────────────────────
   USERS_READ = 'users:read',
   USERS_WRITE = 'users:write',
   USERS_DELETE = 'users:delete',
   USERS_MANAGE = 'users:manage',
   ROLES_READ = 'roles:read',
   ROLES_WRITE = 'roles:write',
   ROLES_DELETE = 'roles:delete',
   ROLES_MANAGE = 'roles:manage',

   // ── Audit logs ────────────────────────────────────────────────────
   AUDIT_LOGS_READ = 'audit-logs:read',
   AUDIT_LOGS_MANAGE = 'audit-logs:manage',
}
