export const RBAC_MODULES = [
   { slug: 'dashboard', label: 'Dashboard' },
   { slug: 'requests', label: 'Requests' },
   { slug: 'items', label: 'Items' },
   { slug: 'stores', label: 'Stores' },
   { slug: 'departments', label: 'Departments' },
   { slug: 'meetings', label: 'Meetings' },
   { slug: 'meeting-locations', label: 'Meeting Locations' },
   { slug: 'maintenance-logs', label: 'Maintenance Logs' },
   { slug: 'generator-logs', label: 'Generator Logs' },
   { slug: 'incidence-logs', label: 'Incidence Logs' },
   { slug: 'analytics', label: 'Analytics' },
   { slug: 'reports', label: 'Reports' },
   { slug: 'users', label: 'User Management' },
   { slug: 'roles', label: 'Roles & Permissions' },
   { slug: 'audit-logs', label: 'Audit Logs' },
   { slug: 'complaints', label: 'Complaints' },
   // Sync with API's RBAC_MODULES (api: src/common/constants/rbac-modules.constant.ts).
   // Added 2026-05-22 after the role customizer showed no Notifications/Outbox
   // sections — the API has these modules but the UI's parallel copy
   // was never updated.
   { slug: 'notifications', label: 'Notifications' },
   { slug: 'outbox', label: 'Outbox' },
] as const;

export type ModuleSlug = (typeof RBAC_MODULES)[number]['slug'];

/**
 * Every action the API recognises. Kept in lockstep with the API's
 * `PermissionAction` enum at `src/common/enums/permission-action.enum.ts`.
 *
 * The order here drives the on-screen left-to-right order of the
 * action chips in the Roles editor — keep the read/write/delete CRUD
 * trio first (they're universal), then the workflow verbs.
 */
export type PermissionAction =
   | 'read'
   | 'write'
   | 'delete'
   | 'approve'
   | 'decline'
   | 'assign'
   | 'release'
   | 'return'
   | 'resolve'
   | 'manage'
   // Module-specific verbs the API exposes only for certain subjects.
   // PermissionGrid skips actions that don't have a matching permission
   // row, so these don't pollute other modules' chip strips:
   //   - 'admin'    : notifications:admin (notification delivery ops UI)
   //   - 'download' : reports:download    (Daily Report PDF export)
   | 'admin'
   | 'download';

export const PERMISSION_ACTIONS: PermissionAction[] = [
   'read',
   'write',
   'delete',
   'approve',
   'decline',
   'assign',
   'release',
   'return',
   'resolve',
   'manage',
   'admin',
   'download',
];
