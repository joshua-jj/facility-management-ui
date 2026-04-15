import {
  DashboardIcon,
  DepartmentsIcon,
  GeneratorLogIcon,
  ItemsIcon,
  MaintenanceLog,
  MapPinIcon,
  ReportsIcon,
  RequestsIcon,
  StoreIcon,
  UsersIcon,
} from '@/components/Icons';
import { RoleId, ALL_DATA_ROLES, ADMIN_ROLES } from '@/constants/roles.constant';

export const pageRoutes = [
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
    id: 7,
    label: 'maintenance logs',
    link: '/admin/maintenance-log',
    icon: <MaintenanceLog />,
    allowedRoles: ADMIN_ROLES,
  },
  {
    id: 8,
    label: 'generator logs',
    link: '/admin/generator-log',
    icon: <GeneratorLogIcon />,
    allowedRoles: ADMIN_ROLES,
  },
  {
    id: 9,
    label: 'reports',
    link: '/admin/reports',
    icon: <ReportsIcon />,
    allowedRoles: ADMIN_ROLES,
  },
  {
    id: 10,
    label: 'users management',
    link: '/admin/users',
    icon: <UsersIcon />,
    allowedRoles: [RoleId.SUPER_ADMIN, RoleId.ADMIN],
  },
  {
    id: 11,
    label: 'account settings',
    link: '/admin/account-settings',
    icon: <UsersIcon />,
    allowedRoles: ALL_DATA_ROLES,
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
    case '/admin/maintenance-log':
      return 'maintenance log';
    case '/admin/generator-log':
      return 'generator log';
    case '/admin/reports':
      return 'reports';
    case '/admin/users':
      return 'user management';
    case '/admin/account-settings':
      return 'account settings';
    default:
      return '';
  }
};
