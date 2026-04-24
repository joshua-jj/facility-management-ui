import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { format, parseISO, subDays, startOfMonth, startOfYear } from 'date-fns';
import { useRouter } from 'next/router';
import { RootState } from '@/redux/reducers';
import { appActions, maintenanceActions } from '@/actions';
import { MaintenanceLog } from '@/types';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import StatusChip from '@/components/StatusChip';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import AddMaintenanceLog from '@/components/Modals/AddMaintenanceLog';
import { RoleId } from '@/constants/roles.constant';
import { usePermissions } from '@/hooks/usePermissions';
import { getObjectFromStorage } from '@/utilities/helpers';
import { CurrencyDisplay, PhoneDisplay } from '@/components/FormatValue';
import { exportToCsv } from '@/utilities/exportCsv';
import ExportModal from '@/components/ExportModal';
import { maintenanceConstants, authConstants } from '@/constants';
import { AppEmitter } from '@/controllers/EventEmitter';
import axios from 'axios';

const EDIT_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
   </svg>
);

const VIEW_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
   </svg>
);

// Converts a preset range label to { dateFrom, dateTo } ISO strings
const resolveDateRange = (preset: string): { dateFrom?: string; dateTo?: string } => {
   const today = new Date();
   const fmt = (d: Date) => d.toISOString().split('T')[0];
   switch (preset) {
      case 'last7':
         return { dateFrom: fmt(subDays(today, 7)), dateTo: fmt(today) };
      case 'last30':
         return { dateFrom: fmt(subDays(today, 30)), dateTo: fmt(today) };
      case 'thisMonth':
         return { dateFrom: fmt(startOfMonth(today)), dateTo: fmt(today) };
      case 'thisYear':
         return { dateFrom: fmt(startOfYear(today)), dateTo: fmt(today) };
      default:
         return {};
   }
};

const filters: FilterDef[] = [
   {
      key: 'status',
      label: 'All Statuses',
      options: [
         { value: 'A', label: 'Active' },
         { value: 'I', label: 'Inactive' },
      ],
   },
   {
      key: 'dateRange',
      label: 'All Dates',
      options: [
         { value: 'last7', label: 'Last 7 days' },
         { value: 'last30', label: 'Last 30 days' },
         { value: 'thisMonth', label: 'This month' },
         { value: 'thisYear', label: 'This year' },
      ],
   },
];

const MaintenanceLogs = () => {
   const dispatch = useDispatch();
   const { isBackOffice, isHod, isMember, isAuthor, isFacilityTeam } = usePermissions();
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);
   const router = useRouter();
   const [showAddModal, setShowAddModal] = useState(false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [editData, setEditData] = useState<MaintenanceLog | null>(null);
   const [showExportModal, setShowExportModal] = useState(false);
   const [isExporting, setIsExporting] = useState(false);
   const [filterValues, setFilterValues] = useState<Record<string, string>>({});

   const { IsRequestingMaintenanceLogs, allMaintenanceLogsList, pagination } = useSelector(
      (s: RootState) => s.maintenance,
   );

   const { meta } = pagination;
   const { currentPage, itemsPerPage, totalItems, totalPages } = meta;

   const buildFilterParams = useCallback((values: Record<string, string>) => {
      const { status, dateRange } = values;
      const dateParams = dateRange ? resolveDateRange(dateRange) : {};
      return {
         ...(status ? { status } : {}),
         ...dateParams,
      };
   }, []);

   // Maintenance logs are Facility-team territory. Super Admin / Admin
   // always have access; HOD / MEMBER are only allowed in when they
   // belong to the Facility department. Wait for the department list
   // to load before redirecting so we don't bounce the page on a
   // transient empty state.
   const departmentsLoaded = (allDepartmentsList?.length ?? 0) > 0;
   const isScopedRole = isHod || isMember;
   const blockedFromFacilityPage = isScopedRole && departmentsLoaded && !isFacilityTeam;
   useEffect(() => {
      if (blockedFromFacilityPage) {
         router.replace('/admin/dashboard');
      }
   }, [blockedFromFacilityPage, router]);

   useEffect(() => {
      dispatch(maintenanceActions.getMaintenanceLogs() as unknown as UnknownAction);
   }, [dispatch]);

   // Re-fetch current page after any mutation
   useEffect(() => {
      const listener = AppEmitter.addListener(maintenanceConstants.CREATE_MAINTENANCE_LOG_SUCCESS, () =>
         dispatch(maintenanceActions.getMaintenanceLogs({ page: currentPage, ...buildFilterParams(filterValues) }) as unknown as UnknownAction),
      );
      return () => listener.remove();
   }, [currentPage, filterValues, buildFilterParams, dispatch]);

   const handleSearch = useCallback(
      (query: string) => {
         if (!query) {
            dispatch(maintenanceActions.getMaintenanceLogs(buildFilterParams(filterValues)) as unknown as UnknownAction);
         } else {
            dispatch(maintenanceActions.searchMaintenanceLog({ text: query }) as unknown as UnknownAction);
         }
      },
      [dispatch, filterValues, buildFilterParams],
   );

   const handleUpdate = (data: MaintenanceLog) => {
      setEditData(data);
      setShowEditModal(true);
   };

   const handleChangePage = (page: number) => {
      dispatch(maintenanceActions.getMaintenanceLogs({ page, ...buildFilterParams(filterValues) }) as unknown as UnknownAction);
   };

   const handleFilterChange = (key: string, value: string) => {
      const newValues = { ...filterValues, [key]: value };
      setFilterValues(newValues);
      dispatch(maintenanceActions.getMaintenanceLogs({ page: 1, ...buildFilterParams(newValues) }) as unknown as UnknownAction);
   };

   // Data is already server-filtered; no client-side filter needed
   const filteredData = allMaintenanceLogsList ?? [];

   const handleExport = async (from: string, to: string) => {
      setIsExporting(true);
      try {
         const user = await getObjectFromStorage(authConstants.USER_KEY);
         let uri = `${maintenanceConstants.MAINTENANCE_URI}/export`;
         const params: string[] = [];
         if (from) params.push(`from=${from}`);
         if (to) params.push(`to=${to}`);
         if (params.length > 0) uri += `?${params.join('&')}`;

         const resp = await axios.get(uri, {
            headers: { Accept: 'application/json', Authorization: user?.token ? `Bearer ${user.token}` : '' },
         });

         const rows = resp.data?.data ?? [];
         if (rows.length === 0) {
            dispatch(appActions.setSnackBar({ type: 'warning', message: 'No records found for the selected range.', variant: 'warning' }) as unknown as UnknownAction);
            return;
         }

         exportToCsv('Maintenance Logs', rows, [
            { key: 'servicedItem', header: 'Serviced Item ID' },
            { key: 'description', header: 'Description' },
            { key: 'costOfMaintenance', header: 'Cost' },
            { key: 'artisanName', header: 'Artisan Name' },
            { key: 'artisanPhone', header: 'Artisan Phone' },
            { key: 'signature', header: 'Signature' },
            { key: 'maintenanceDate', header: 'Maintenance Date', format: (v) => (v ? format(parseISO(String(v)), 'yyyy-MM-dd') : '') },
            { key: 'createdBy', header: 'Created By' },
            { key: 'createdAt', header: 'Created Date', format: (v) => (v ? format(parseISO(String(v)), 'yyyy-MM-dd') : '') },
         ], { from: from || undefined, to: to || undefined });

         setShowExportModal(false);
      } catch {
         dispatch(appActions.setSnackBar({ type: 'error', message: 'Failed to export. Please try again.', variant: 'error' }) as unknown as UnknownAction);
      } finally {
         setIsExporting(false);
      }
   };

   const getActions = (row: MaintenanceLog): ActionMenuItem[] => {
      const actions: ActionMenuItem[] = [
         {
            label: 'View',
            icon: VIEW_ICON,
            onClick: () => router.push(`/admin/maintenance-log/${row.id}`),
         },
      ];
      // Per spec: SUPER_ADMIN / ADMIN can always edit. MEMBER can only edit
      // logs they created. HOD is strictly view-only.
      const canEdit = isBackOffice || (isMember && isAuthor(row as unknown as { createdBy?: string }));
      if (canEdit) {
         actions.push({
            label: 'Edit',
            icon: EDIT_ICON,
            onClick: () => handleUpdate(row),
         });
      }
      return actions;
   };

   const columns: Column<MaintenanceLog>[] = [
      {
         key: 'serviceItemName',
         header: 'Serviced Item',
         render: (value) => <span className="font-medium">{String(value || '—')}</span>,
      },
      {
         key: 'costOfMaintenance',
         header: 'Cost',
         render: (value) => <CurrencyDisplay value={value as number} />,
      },
      { key: 'artisanName', header: 'Artisan' },
      {
         key: 'artisanPhone',
         header: 'Phone',
         render: (value) => <PhoneDisplay value={String(value ?? '')} />,
      },
      {
         key: 'maintenanceDate',
         header: 'Date',
         render: (value) => (
            <span>{value ? format(parseISO(String(value)), 'MMM d, yyyy') : '—'}</span>
         ),
      },
      {
         key: 'status',
         header: 'Status',
         render: (value) => <StatusChip status={String(value ?? 'A')} />,
      },
      {
         key: 'createdBy',
         header: 'Created By',
      },
      {
         key: 'updatedBy',
         header: 'Modified By',
         render: (value) => <span>{String(value || '\u2014')}</span>,
      },
      {
         key: 'updatedAt',
         header: 'Modified At',
         render: (value) => {
            if (!value) return <span>{'\u2014'}</span>;
            try { return <span>{format(parseISO(String(value)), 'MMM d, yyyy')}</span>; }
            catch { return <span>{'\u2014'}</span>; }
         },
      },
      {
         key: 'id',
         header: '',
         width: '50px',
         align: 'center',
         render: (_value, row) => <ActionMenu items={getActions(row)} />,
      },
   ];

   if (blockedFromFacilityPage) {
      // Redirect is in-flight from the effect above; render nothing to
      // avoid a flash of the data table for a user who shouldn't see it.
      return null;
   }

   return (
      <PrivateRoute allowedRoles={[RoleId.SUPER_ADMIN, RoleId.ADMIN, RoleId.HOD, RoleId.MEMBER]}>
         <Layout title="Maintenance Logs">
            <PageHeader
               subtitle="Track facility maintenance activities"
               action={
                  isHod ? null : (
                     <ActionButton onClick={() => setShowAddModal(true)}>Add Log</ActionButton>
                  )
               }
            />

            <DataTable
               columns={columns}
               data={filteredData}
               loading={IsRequestingMaintenanceLogs}
               onSearch={handleSearch}
               onExport={() => setShowExportModal(true)}
               onRefresh={() => dispatch(maintenanceActions.getMaintenanceLogs({ page: currentPage, ...buildFilterParams(filterValues) }) as unknown as UnknownAction)}
               searchPlaceholder="Search maintenance logs..."
               filters={filters}
               filterValues={filterValues}
               onFilterChange={handleFilterChange}
               pagination={{ currentPage, totalItems, itemsPerPage, totalPages }}
               onPageChange={handleChangePage}
               emptyTitle="No maintenance logs found"
               emptyDescription="Get started by adding your first maintenance log."
            />

            <ExportModal
               open={showExportModal}
               onClose={() => setShowExportModal(false)}
               onExport={handleExport}
               loading={isExporting}
               title="Export Maintenance Logs"
            />

            {showAddModal && (
               <AddMaintenanceLog className="hidden" open={showAddModal} onClose={() => setShowAddModal(false)} />
            )}
            {showEditModal && (
               <AddMaintenanceLog className="hidden" maintenanceData={editData} open={showEditModal} onClose={() => setShowEditModal(false)} />
            )}
         </Layout>
      </PrivateRoute>
   );
};

export default MaintenanceLogs;
