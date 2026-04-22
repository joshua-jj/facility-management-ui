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
   { slug: 'reports', label: 'Reports' },
   { slug: 'users', label: 'User Management' },
   { slug: 'roles', label: 'Roles & Permissions' },
   { slug: 'audit-logs', label: 'Audit Logs' },
   { slug: 'complaints', label: 'Complaints' },
] as const;

export type ModuleSlug = (typeof RBAC_MODULES)[number]['slug'];

export type PermissionAction = 'read' | 'write' | 'delete';
export const PERMISSION_ACTIONS: PermissionAction[] = ['read', 'write', 'delete'];
