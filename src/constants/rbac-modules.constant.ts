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
   | 'manage';

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
];
