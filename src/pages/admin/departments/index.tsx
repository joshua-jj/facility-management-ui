import Layout from '@/components/Layout';
import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { RootState } from '@/redux/reducers';
import { appActions, departmentActions } from '@/actions';
import { UnknownAction } from 'redux';
import { Department } from '@/types';
import AddDepartment from '@/components/Modals/AddDepartment';
import PrivateRoute from '@/components/PrivateRoute';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import { ADMIN_ROLES } from '@/constants/roles.constant';
import { exportToCsv } from '@/utilities/exportCsv';
import ExportModal from '@/components/ExportModal';
import { getObjectFromStorage } from '@/utilities/helpers';
import { PhoneDisplay } from '@/components/FormatValue';
import { authConstants, departmentConstants } from '@/constants';
import axios from 'axios';

const PAGE_LIMIT = 10;

const VIEW_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
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

   const { IsRequestingDepartments, allDepartmentsList, pagination } = useSelector((s: RootState) => s.department);
   const { meta } = pagination;

   useEffect(() => {
      dispatch(departmentActions.getAllDepartments({
         page: currentPage,
         limit: PAGE_LIMIT,
         search: searchQuery || undefined,
         status: filterValues.status || undefined,
         hasHod: filterValues.hasHod || undefined,
      }) as unknown as UnknownAction);
   }, [dispatch, currentPage, searchQuery, filterValues]);

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

   const getActions = (row: Department): ActionMenuItem[] => [
      {
         label: 'View',
         icon: VIEW_ICON,
         onClick: () => router.push(`/admin/departments/${row.id}`),
      },
   ];

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
         key: 'itemCount',
         header: 'Items Count',
         align: 'center',
         render: (_, row) => (
            <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
               {row.itemCount ?? 0}
            </span>
         ),
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
         render: (_, row) => <ActionMenu items={getActions(row)} />,
      },
   ];

   return (
      <PrivateRoute allowedRoles={ADMIN_ROLES}>
         <Layout title="Departments">
            <PageHeader
               title="Departments"
               subtitle={`${meta.totalItems} department${meta.totalItems !== 1 ? 's' : ''}`}
               action={
                  <AddDepartment className="text-start w-full cursor-pointer">
                     <ActionButton variant="primary">+ Add Department</ActionButton>
                  </AddDepartment>
               }
            />

            <DataTable
               columns={columns}
               data={filteredDepartments}
               loading={IsRequestingDepartments}
               onSearch={handleSearch}
               onExport={() => setShowExportModal(true)}
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
         </Layout>
      </PrivateRoute>
   );
};

export default Departments;
