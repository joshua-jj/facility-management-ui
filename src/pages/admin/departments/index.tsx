import Layout from '@/components/Layout';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import ListStatsStrip from '@/components/ListStatsStrip';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { RootState } from '@/redux/reducers';
import { appActions, departmentActions } from '@/actions';
import { UnknownAction } from 'redux';
import { Department } from '@/types';
import AddDepartment from '@/components/Modals/AddDepartment';
import PrivateRoute from '@/components/PrivateRoute';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ADMIN_ROLES } from '@/constants/roles.constant';
import { exportToCsv } from '@/utilities/exportCsv';
import ExportModal from '@/components/ExportModal';
import { getObjectFromStorage } from '@/utilities/helpers';
import { PhoneDisplay } from '@/components/FormatValue';
import { authConstants, departmentConstants } from '@/constants';
import { AppEmitter } from '@/controllers/EventEmitter';
import axios from 'axios';

const PAGE_LIMIT = 10;

const VIEW_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
   </svg>
);

const EDIT_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
   </svg>
);

const DEACTIVATE_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
   </svg>
);

const ACTIVATE_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
   </svg>
);

const Departments = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const [searchQuery, setSearchQuery] = useState('');
   const [showExportModal, setShowExportModal] = useState(false);
   const [isExporting, setIsExporting] = useState(false);
   const [filterValues, setFilterValues] = useState<Record<string, string>>({});
   const [currentPage, setCurrentPage] = useState(1);
   const [editDepartment, setEditDepartment] = useState<Department | null>(null);
   const [showEditModal, setShowEditModal] = useState(false);
   const [pendingDeactivate, setPendingDeactivate] = useState<Department | null>(null);

   const { IsRequestingDepartments, allDepartmentsList, pagination } = useSelector((s: RootState) => s.department);
   const { meta } = pagination;

   const fetchDepartments = useCallback((page: number) => {
      dispatch(departmentActions.getAllDepartments({
         page,
         limit: PAGE_LIMIT,
         search: searchQuery || undefined,
         status: filterValues.status || undefined,
         hasHod: filterValues.hasHod || undefined,
      }) as unknown as UnknownAction);
   }, [dispatch, searchQuery, filterValues]);

   useEffect(() => {
      fetchDepartments(currentPage);
   }, [fetchDepartments, currentPage]);

   // Re-fetch current page after any mutation (create, update, activate, deactivate)
   useEffect(() => {
      const events = [
         departmentConstants.CREATE_DEPARTMENT_SUCCESS,
         departmentConstants.UPDATE_DEPARTMENT_SUCCESS,
         departmentConstants.ACTIVATE_DEPARTMENT_SUCCESS,
         departmentConstants.DEACTIVATE_DEPARTMENT_SUCCESS,
      ];
      const listeners = events.map((evt) =>
         AppEmitter.addListener(evt, () => fetchDepartments(currentPage)),
      );
      return () => listeners.forEach((l) => l.remove());
   }, [currentPage, fetchDepartments]);

   const handlePageChange = (page: number) => {
      setCurrentPage(page);
   };

   const handleSearch = (query: string) => {
      setSearchQuery(query);
      setCurrentPage(1);
   };

   const handleFilterChange = (key: string, value: string) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
   };

   const filteredDepartments = useMemo(() => allDepartmentsList ?? [], [allDepartmentsList]);

   const filters: FilterDef[] = useMemo(
      () => [
         {
            key: 'status',
            label: 'Status',
            options: [
               { value: 'A', label: 'Active' },
               { value: 'I', label: 'Inactive' },
            ],
         },
         {
            key: 'hasHod',
            label: 'Has HOD',
            options: [
               { value: 'Y', label: 'Yes' },
               { value: 'N', label: 'No' },
            ],
         },
      ],
      [],
   );

   const handleExport = async (from: string, to: string) => {
      setIsExporting(true);
      try {
         const user = await getObjectFromStorage(authConstants.USER_KEY);
         let uri = `${departmentConstants.DEPARTMENT_URI}/export`;
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

         exportToCsv('Departments', rows, [
            { key: 'name', header: 'Department Name' },
            { key: 'hodName', header: 'HOD Name' },
            { key: 'hodEmail', header: 'HOD Email' },
            { key: 'hodPhone', header: 'HOD Phone' },
            { key: 'createdBy', header: 'Created By' },
            { key: 'createdAt', header: 'Created At', format: (v) => (v ? format(parseISO(String(v)), 'yyyy-MM-dd') : '') },
         ], { from: from || undefined, to: to || undefined });

         setShowExportModal(false);
      } catch {
         dispatch(appActions.setSnackBar({ type: 'error', message: 'Failed to export. Please try again.', variant: 'error' }) as unknown as UnknownAction);
      } finally {
         setIsExporting(false);
      }
   };

   const handleToggleStatus = (row: Department) => {
      const isActive = String(row.status).toUpperCase() === 'A' || String(row.status).toUpperCase() === 'ACTIVE';
      if (isActive) {
         setPendingDeactivate(row);
      } else {
         dispatch(departmentActions.activateDepartment(row.id) as unknown as UnknownAction);
      }
   };

   const confirmDeactivate = () => {
      if (!pendingDeactivate) return;
      dispatch(
         departmentActions.deactivateDepartment(pendingDeactivate.id) as unknown as UnknownAction,
      );
      setPendingDeactivate(null);
   };

   const getActions = (row: Department): ActionMenuItem[] => {
      const isActive = String(row.status).toUpperCase() === 'A' || String(row.status).toUpperCase() === 'ACTIVE';
      return [
         {
            label: 'View',
            icon: VIEW_ICON,
            onClick: () => router.push(`/admin/departments/${row.id}`),
         },
         {
            label: 'Edit',
            icon: EDIT_ICON,
            onClick: () => { setEditDepartment(row); setShowEditModal(true); },
         },
         {
            label: isActive ? 'Deactivate' : 'Activate',
            icon: isActive ? DEACTIVATE_ICON : ACTIVATE_ICON,
            onClick: () => handleToggleStatus(row),
         },
      ];
   };

   const columns: Column<Department>[] = [
      {
         key: 'name',
         header: 'Department Name',
         render: (_, row) => <span className="font-medium text-[#0F2552] dark:text-white/85">{row.name}</span>,
      },
      {
         key: 'hodName',
         header: 'HOD Name',
      },
      {
         key: 'hodEmail',
         header: 'Email',
      },
      {
         key: 'hodPhone',
         header: 'Phone',
         render: (value) => <PhoneDisplay value={String(value ?? '')} />,
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
         header: 'Action',
         width: '50px',
         align: 'center',
         render: (_, row) => <ActionMenu items={getActions(row)} />,
      },
   ];

   const activeCount = filteredDepartments.filter(
      (d) => String(d.status).toUpperCase() === 'A' || String(d.status).toUpperCase() === 'ACTIVE',
   ).length;
   const hodCount = filteredDepartments.filter((d) => !!d.hodName).length;

   return (
      <PrivateRoute allowedRoles={ADMIN_ROLES}>
         <Layout title="Departments">
            <PageHeader
               subtitle="Manage facility departments and their heads"
               action={
                  <AddDepartment className="text-start w-full cursor-pointer">
                     <ActionButton variant="primary">+ Add Department</ActionButton>
                  </AddDepartment>
               }
            />

            <ListStatsStrip
               tiles={[
                  { label: 'Total', value: meta.totalItems, hint: 'Departments' },
                  { label: 'Active', value: activeCount, accent: '#10B981', hint: 'On this page' },
                  { label: 'With HOD', value: hodCount, hint: 'Heads assigned' },
                  { label: 'Page', value: `${meta.currentPage} / ${Math.max(meta.totalPages, 1)}` },
               ]}
            />

            <DataTable
               columns={columns}
               data={filteredDepartments}
               loading={IsRequestingDepartments}
               onSearch={handleSearch}
               onExport={() => setShowExportModal(true)}
               onRefresh={() => fetchDepartments(currentPage)}
               searchPlaceholder="Search departments..."
               filters={filters}
               filterValues={filterValues}
               onFilterChange={handleFilterChange}
               pagination={{
                  currentPage: meta.currentPage,
                  totalItems: meta.totalItems,
                  itemsPerPage: meta.itemsPerPage,
                  totalPages: meta.totalPages,
               }}
               onPageChange={handlePageChange}
               emptyTitle="No departments found"
               emptyDescription="Get started by adding your first department."
            />

            <ExportModal
               open={showExportModal}
               onClose={() => setShowExportModal(false)}
               onExport={handleExport}
               loading={isExporting}
               title="Export Departments"
            />

            <ConfirmDialog
               open={pendingDeactivate !== null}
               onClose={() => setPendingDeactivate(null)}
               onConfirm={confirmDeactivate}
               title={
                  pendingDeactivate
                     ? `Deactivate department "${pendingDeactivate.name}"?`
                     : ''
               }
               description="It will no longer be available for assignments. You can reactivate it later."
               confirmLabel="Deactivate"
               tone="danger"
            />

            {editDepartment && (
               <AddDepartment
                  initialData={editDepartment}
                  open={showEditModal}
                  onClose={() => { setShowEditModal(false); setEditDepartment(null); }}
               />
            )}
         </Layout>
      </PrivateRoute>
   );
};

export default Departments;
