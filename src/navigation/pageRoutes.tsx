import {
  DashboardIcon,
  DepartmentsIcon,
  GeneratorLogIcon,
  ItemsIcon,
  MaintenanceLog,
  ReportsIcon,
  RequestsIcon,
  StoreIcon,
  UsersIcon,
} from '@/components/Icons';

export const pageRoutes = [
  {
    id: 1,
    label: 'dashboard',
    link: '/admin/dashboard',
    icon: <DashboardIcon />,
    allowedRoles: [5, 1, 2, 3, 4],
  },
  {
    id: 2,
    label: 'requests',
    link: '/admin/requests',
    icon: <RequestsIcon />,
    allowedRoles: [5, 1, 3, 4],
  },
  {
    id: 3,
    label: 'items',
    link: '/admin/items',
    icon: <ItemsIcon />,
    allowedRoles: [5, 1, 2, 3, 4],
  },
  {
    id: 4,
    label: 'store',
    link: '/admin/store',
    icon: <StoreIcon />,
    allowedRoles: [5, 1],
  },
  {
    id: 5,
    label: 'departments',
    link: '/admin/departments',
    icon: <DepartmentsIcon />,
    allowedRoles: [5, 1],
  },
  {
    id: 6,
    label: 'maintenance log',
    link: '/admin/maintenance-log',
    icon: <MaintenanceLog />,
    allowedRoles: [5, 1, 4],
  },
  {
    id: 7,
    label: 'generator log',
    link: '/admin/generator-log',
    icon: <GeneratorLogIcon />,
    allowedRoles: [5, 1, 4],
  },
  {
    id: 8,
    label: 'reports',
    link: '/admin/reports',
    icon: <ReportsIcon />,
    allowedRoles: [5, 1, 4],
  },
  {
    id: 8,
    label: 'users management',
    link: '/admin/users',
    icon: <UsersIcon />,
    allowedRoles: [5, 1],
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
    default:
      return '';
  }
};
