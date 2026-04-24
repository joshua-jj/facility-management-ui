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
import { RoleId, ALL_DATA_ROLES } from '@/constants/roles.constant';

export interface PageRoute {
  id: number;
  label: string;
  link: string;
  icon: React.ReactNode;
  allowedRoles: readonly number[];
  section?: string;
  /**
   * Restrict visibility so a user with roleId=HOD only sees the route if they
   * are HOD of the Facility department specifically. Super Admins and Members
   * (when present in allowedRoles) bypass this check — it only gates the HOD
   * role. Requires the Sidebar to have loaded the department list.
   */
  facilityHodOnly?: boolean;
}

export const pageRoutes: PageRoute[] = [
  {
    id: 1,
    label: 'dashboard',
    link: '/admin/dashboard',
    icon: <DashboardIcon />,
    allowedRoles: ALL_DATA_ROLES,
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
    allowedRoles: ALL_DATA_ROLES,
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
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.HOD, RoleId.MEMBER],
    facilityHodOnly: true,
  },
  {
    id: 8,
    label: 'generator logs',
    link: '/admin/generator-log',
    icon: <GeneratorLogIcon />,
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.HOD, RoleId.MEMBER],
    facilityHodOnly: true,
  },
  {
    id: 11,
    label: 'incidence logs',
    link: '/admin/incidence-log',
    icon: <ReportsIcon />,
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.HOD, RoleId.MEMBER],
    facilityHodOnly: true,
  },
  {
    id: 9,
    label: 'complaints',
    link: '/admin/reports',
    icon: <ReportsIcon />,
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.HOD, RoleId.MEMBER],
    facilityHodOnly: true,
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
