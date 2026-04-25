import {
  CalendarIcon,
  DashboardIcon,
  DepartmentsIcon,
  GeneratorLogIcon,
  ItemsIcon,
  MaintenanceLog,
  MapPinIcon,
  ReportsIcon,
  RequestsIcon,
  SettingsIcon,
  StoreIcon,
  UsersIcon,
} from '@/components/Icons';
import { RoleId } from '@/constants/roles.constant';

export interface PageRoute {
  id: number;
  label: string;
  link: string;
  icon: React.ReactNode;
  allowedRoles: readonly number[];
  section?: string;
  /**
   * When true, non-backoffice roles (HOD / MEMBER) are only shown this
   * route if they belong to the Facility department. Super Admin and
   * Admin always see Facility-scoped routes because they own the app.
   */
  requiresFacilityTeam?: boolean;
}

/**
 * Sidebar visibility per the Roles & Permissions spec:
 * - SUPER_ADMIN + ADMIN: see everything
 * - HOD: Requests, Items, Maintenance Logs, Incidence Logs
 *        (filtered to their department on the server)
 * - MEMBER: Requests, Maintenance Logs, Generator Logs, Incidence Logs,
 *           Complaints (filtered to me/my assignments on the server)
 * - OFFICE / USER: only account settings
 */
export const pageRoutes: PageRoute[] = [
  {
    id: 1,
    label: 'dashboard',
    link: '/admin/dashboard',
    icon: <DashboardIcon />,
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.ADMIN],
  },
  {
    id: 2,
    label: 'requests',
    link: '/admin/requests',
    icon: <RequestsIcon />,
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.ADMIN, RoleId.HOD, RoleId.MEMBER],
  },
  {
    id: 3,
    label: 'items',
    link: '/admin/items',
    icon: <ItemsIcon />,
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.ADMIN, RoleId.HOD],
  },
  {
    id: 4,
    label: 'stores',
    link: '/admin/store',
    icon: <StoreIcon />,
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.ADMIN],
  },
  {
    id: 5,
    label: 'departments',
    link: '/admin/departments',
    icon: <DepartmentsIcon />,
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.ADMIN],
  },
  {
    id: 6,
    label: 'meeting locations',
    link: '/admin/meeting-locations',
    icon: <MapPinIcon />,
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.ADMIN],
  },
  {
    id: 12,
    label: 'meetings',
    link: '/admin/meetings',
    icon: <CalendarIcon />,
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.ADMIN],
  },
  {
    id: 7,
    label: 'maintenance logs',
    link: '/admin/maintenance-log',
    icon: <MaintenanceLog />,
    // Per spec: every HOD sees Maintenance Logs (read-only on their own
    // department's items). Facility HOD/Members see all. The list-endpoint
    // auto-scope handles per-department filtering for non-Facility HODs.
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.ADMIN, RoleId.HOD, RoleId.MEMBER],
  },
  {
    id: 8,
    label: 'generator logs',
    link: '/admin/generator-log',
    icon: <GeneratorLogIcon />,
    // Generator logs are Facility-only. Members see them everywhere.
    // HODs only see them if they're the Facility HOD — `requiresFacilityTeam`
    // gates that in the Sidebar filter.
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.ADMIN, RoleId.HOD, RoleId.MEMBER],
    requiresFacilityTeam: true,
  },
  {
    id: 11,
    label: 'incidence logs',
    link: '/admin/incidence-log',
    icon: <ReportsIcon />,
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.ADMIN, RoleId.HOD, RoleId.MEMBER],
  },
  {
    id: 9,
    label: 'complaints',
    link: '/admin/reports',
    icon: <ReportsIcon />,
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.ADMIN, RoleId.MEMBER],
  },
  {
    id: 10,
    label: 'users management',
    link: '/admin/users',
    icon: <UsersIcon />,
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.ADMIN],
  },
  {
    id: 99,
    label: 'settings',
    link: '/admin/settings/profile',
    icon: <SettingsIcon />,
    allowedRoles: [
      RoleId.SUPER_ADMIN,
      RoleId.ADMIN,
      RoleId.OFFICE,
      RoleId.HOD,
      RoleId.MEMBER,
      RoleId.USER,
    ],
    section: 'account',
  },
];

export const getPageNames = (link: string) => {
  switch (link) {
    case '/admin/dashboard':
      return 'dashboard';
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
    default:
      return '';
  }
};
