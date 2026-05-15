import {
  BellIcon,
  CalendarIcon,
  DashboardIcon,
  DepartmentsIcon,
  GeneratorLogIcon,
  IncidenceLogIcon,
  ItemsIcon,
  MaintenanceLog,
  MapPinIcon,
  ReportsIcon,
  RequestsIcon,
  SettingsIcon,
  StoreIcon,
  UsersIcon,
} from '@/components/Icons';
import { Permission } from '@/constants/permissions.enum';

export interface PageRoute {
  id: number;
  label: string;
  link: string;
  icon: React.ReactNode;
  /**
   * Permissions required for the route. Wire-format `subject:action`
   * strings — see `src/utilities/permissions.ts`. The Sidebar admits
   * the route when the user has ANY of these (OR semantics — the
   * first match wins). For pages that should require multiple
   * capabilities, gate inside the page itself.
   */
  permissions: readonly string[];
  section?: string;
  /**
   * When true, only users who belong to the Facility department see
   * this route. This is a *department* check, not a capability — kept
   * as a flag because it can't be expressed as a permission. The
   * Sidebar combines it with the permission check.
   */
  requiresFacilityTeam?: boolean;
}

/**
 * Sidebar visibility, driven by capability strings (not role ids).
 * Multi-role users automatically see the union of every hat's
 * permissions — that's where the OR-of-hats bug used to bite.
 *
 * Subjects map to the `RBAC_MODULES` slugs on the API. Actions match
 * the `PermissionAction` enum (read/write/...). `subject:manage`
 * implicitly grants every action — `usePermission().can(...)` honours
 * that, so e.g. SUPER_ADMINs holding `requests:manage` pass any
 * `requests:read` check.
 */
export const pageRoutes: PageRoute[] = [
  {
    id: 1,
    label: 'dashboard',
    link: '/admin/dashboard',
    icon: <DashboardIcon />,
    permissions: [Permission.DASHBOARD_READ],
  },
  {
    id: 13,
    label: 'analytics',
    link: '/admin/analytics',
    icon: <DashboardIcon />,
    permissions: [Permission.ANALYTICS_READ],
  },
  {
    id: 2,
    label: 'requests',
    link: '/admin/requests',
    icon: <RequestsIcon />,
    permissions: [Permission.REQUESTS_READ],
  },
  {
    id: 3,
    label: 'items',
    link: '/admin/items',
    icon: <ItemsIcon />,
    permissions: [Permission.ITEMS_READ],
  },
  {
    id: 4,
    label: 'stores',
    link: '/admin/store',
    icon: <StoreIcon />,
    permissions: [Permission.STORES_READ],
  },
  {
    id: 5,
    label: 'departments',
    link: '/admin/departments',
    icon: <DepartmentsIcon />,
    permissions: [Permission.DEPARTMENTS_READ],
  },
  {
    id: 6,
    label: 'meeting locations',
    link: '/admin/meeting-locations',
    icon: <MapPinIcon />,
    permissions: [Permission.MEETING_LOCATIONS_READ],
  },
  {
    id: 12,
    label: 'meetings',
    link: '/admin/meetings',
    icon: <CalendarIcon />,
    permissions: [Permission.MEETINGS_READ],
  },
  {
    id: 7,
    label: 'maintenance logs',
    link: '/admin/maintenance-log',
    icon: <MaintenanceLog />,
    permissions: [Permission.MAINTENANCE_LOGS_READ],
  },
  {
    id: 8,
    label: 'generator logs',
    link: '/admin/generator-log',
    icon: <GeneratorLogIcon />,
    // Capability-wise anyone with `generator-logs:read` sees the route,
    // but the link itself is still Facility-team only because the
    // operational data is Facility-owned. Back-office (any user with
    // `generator-logs:manage`) bypasses the dept check via the Sidebar
    // filter.
    permissions: [Permission.GENERATOR_LOGS_READ],
    requiresFacilityTeam: true,
  },
  {
    id: 11,
    label: 'incidence logs',
    link: '/admin/incidence-log',
    icon: <IncidenceLogIcon />,
    permissions: [Permission.INCIDENCE_LOGS_READ],
  },
  {
    id: 9,
    label: 'complaints',
    link: '/admin/reports',
    icon: <ReportsIcon />,
    permissions: [Permission.COMPLAINTS_READ],
  },
  {
    id: 10,
    label: 'users management',
    link: '/admin/users',
    icon: <UsersIcon />,
    permissions: [Permission.USERS_READ],
  },
  {
    id: 14,
    label: 'notifications',
    link: '/admin/notifications',
    icon: <BellIcon />,
    // SA-only delivery tracking + retry surface (spec
    // 2026-05-14-notification-tracking-and-retry-design §6.7). The
    // capability is seeded to SUPER_ADMIN by default; grant via the
    // settings/access UI rather than a code change here when other
    // roles need it.
    permissions: [Permission.NOTIFICATIONS_ADMIN],
    section: 'account',
  },
  {
    id: 99,
    label: 'settings',
    link: '/admin/settings/profile',
    icon: <SettingsIcon />,
    // Settings is "every authenticated user" — any role lands somewhere
    // here (profile + security at minimum). Use `dashboard:read` as the
    // canonical "authenticated" gate; every preset role holds it.
    permissions: [Permission.DASHBOARD_READ],
    section: 'account',
  },
];

export const getPageNames = (link: string) => {
  switch (link) {
    case '/admin/dashboard':
      return 'dashboard';
    case '/admin/analytics':
      return 'analytics';
    case '/admin/requests':
      return 'requests';
    case '/admin/request/[id]':
      return 'requests';
    case '/admin/items':
      return 'items';
    case '/admin/item/[id]':
      return 'items';
    case '/admin/store':
      return 'store';
    case '/admin/departments':
      return 'departments';
    case '/admin/meeting-locations':
      return 'meeting locations';
    case '/admin/meetings':
      return 'meetings';
    case '/admin/maintenance-log':
      return 'maintenance log';
    case '/admin/generator-log':
      return 'generator log';
    case '/admin/reports':
      return 'reports';
    case '/admin/users':
      return 'user management';
    case '/admin/notifications':
      return 'notifications';
    case '/admin/settings/access':
      return 'roles & permissions';
    case '/admin/settings/access/roles/new':
      return 'roles & permissions';
    case '/admin/settings/access/roles/[id]':
      return 'roles & permissions';
    case '/admin/settings/access/roles/[id]/users':
      return 'roles & permissions';
    case '/admin/settings/profile':
      return 'account settings';
    case '/admin/settings/workflows':
      return 'workflows';
    case '/admin/settings/workflows/[subject]':
      return 'workflows';
    default:
      return '';
  }
};
