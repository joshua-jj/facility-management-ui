import { DashboardIcon, DepartmentsIcon, GeneratorLogIcon, ItemsIcon, MaintenanceLog, ReportsIcon, RequestsIcon, StoreIcon } from "@/components/Icons";

export const pageRoutes = [
    {id: 1, label: "dashboard", link: '/admin/dashboard', icon: <DashboardIcon />},
    {id: 2, label: "requests", link: '/admin/requests', icon: <RequestsIcon />},
    {id: 3, label: "items", link: '/admin/items', icon: <ItemsIcon />},
    {id: 4, label: "store", link: '/admin/store', icon: <StoreIcon />},
    {id: 5, label: "departments", link: '/admin/departments', icon: <DepartmentsIcon />},
    {id: 6, label: "maintenance log", link: '/admin/maintenance-log', icon: <MaintenanceLog />},
    {id: 7, label: "generator log", link: '/admin/generator-log', icon: <GeneratorLogIcon />},
    {id: 8, label: "reports", link: '/admin/reports', icon: <ReportsIcon />},
];
