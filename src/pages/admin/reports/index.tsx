import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { UnknownAction } from 'redux';
import { format, parseISO } from 'date-fns';
import { RootState } from '@/redux/reducers';
import { appActions, reportActions } from '@/actions';
import { Report } from '@/types';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import StatusChip from '@/components/StatusChip';
import PageHeader from '@/components/PageHeader';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import { ALL_DATA_ROLES } from '@/constants/roles.constant';
import { exportToCsv } from '@/utilities/exportCsv';
import ExportModal from '@/components/ExportModal';
import { getObjectFromStorage } from '@/utilities/helpers';
import { PhoneDisplay } from '@/components/FormatValue';
import { authConstants, reportConstants } from '@/constants';
import axios from 'axios';

const VIEW_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

const Reports = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const [showExportModal, setShowExportModal] = useState(false);
   const [isExporting, setIsExporting] = useState(false);
   const [filterValues, setFilterValues] = useState<Record<string, string>>({});
   const [searchQuery, setSearchQuery] = useState('');
   const [currentPage, setCurrentPage] = useState(1);
   const { IsRequestingReports, allReportsList, pagination } = useSelector((s: RootState) => s.report);
   const meta = pagination?.meta ?? null;

   useEffect(() => {
      dispatch(reportActions.getReports({
         page: currentPage,
         limit: 10,
         search: searchQuery || undefined,
         complaintStatus: filterValues.complaintStatus || undefined,
         attendedTo: filterValues.attendedTo !== undefined && filterValues.attendedTo !== ''
            ? filterValues.attendedTo === 'true'
            : undefined,
      }) as unknown as UnknownAction);
   }, [dispatch, currentPage, searchQuery, filterValues]);

   const handleSearch = (query: string) => {
      setSearchQuery(query);
      setCurrentPage(1);
   };

   const handlePageChange = (page: number) => setCurrentPage(page);

   const handleExport = async (from: string, to: string) => {
      setIsExporting(true);
      try {
         const user = await getObjectFromStorage(authConstants.USER_KEY);
         let uri = `${reportConstants.REPORT_URI}/export`;
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

         exportToCsv('Reports', rows, [
            { key: 'complainerName', header: 'Complainer Name' },
            { key: 'complaintSubject', header: 'Subject' },
            { key: 'complainerEmail', header: 'Email' },
            { key: 'complainerPhone', header: 'Phone' },
            { key: 'createdAt', header: 'Date', format: (v) => (v ? format(parseISO(String(v)), 'yyyy-MM-dd') : '') },
            { key: 'status', header: 'Status', format: (v) => (v ? String(v) : 'Pending') },
         ], { from: from || undefined, to: to || undefined });

         setShowExportModal(false);
      } catch {
         dispatch(appActions.setSnackBar({ type: 'error', message: 'Failed to export. Please try again.', variant: 'error' }) as unknown as UnknownAction);
      } finally {
         setIsExporting(false);
      }
   };

   const handleFilterChange = (key: string, value: string) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
   };

   const filters: FilterDef[] = useMemo(
      () => [
         {
            key: 'complaintStatus',
            label: 'Status',
            options: [
               { value: 'Pending', label: 'Pending' },
               { value: 'In Progress', label: 'In Progress' },
               { value: 'Resolved', label: 'Resolved' },
               { value: 'Closed', label: 'Closed' },
            ],
         },
         {
            key: 'attendedTo',
            label: 'Attended',
            options: [
               { value: 'true', label: 'Yes' },
               { value: 'false', label: 'No' },
            ],
         },
      ],
      [],
   );

   // Server-side filtered — data returned directly from the API
   const filteredReports = useMemo(() => allReportsList ?? [], [allReportsList]);

   const getActions = (row: Report): ActionMenuItem[] => [
      {
         label: 'View',
         icon: VIEW_ICON,
         onClick: () => router.push(`/admin/reports/${row.id}`),
      },
   ];

   const columns: Column<Report>[] = [
      { key: 'complainerName', header: 'Complainer Name' },
      { key: 'complaintSubject', header: 'Subject' },
      { key: 'complainerEmail', header: 'Email' },
      {
         key: 'complainerPhone',
         header: 'Phone',
         render: (value) => <PhoneDisplay value={String(value ?? '')} />,
      },
      {
         key: 'createdAt',
         header: 'Date',
         render: (value) => (
            <span>{value ? format(parseISO(String(value)), 'MMM d, yyyy') : '--'}</span>
         ),
      },
      {
         key: 'status',
         header: 'Status',
         render: (value) => {
            const statusStr = value ? String(value) : 'Pending';
            return <StatusChip status={statusStr} />;
         },
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

   return (
      <PrivateRoute allowedRoles={ALL_DATA_ROLES}>
         <Layout title="Reports">
            <PageHeader title="Reports" subtitle="View and manage complaint reports" />

            <DataTable
               columns={columns}
               data={filteredReports}
               loading={IsRequestingReports}
               onSearch={handleSearch}
               onExport={() => setShowExportModal(true)}
               onRefresh={() => dispatch(reportActions.getReports({ page: currentPage, search: searchQuery || undefined, complaintStatus: filterValues.complaintStatus || undefined, attendedTo: filterValues.attendedTo !== undefined && filterValues.attendedTo !== '' ? filterValues.attendedTo === 'true' : undefined }) as unknown as UnknownAction)}
               searchPlaceholder="Search by name, subject, email..."
               filters={filters}
               filterValues={filterValues}
               onFilterChange={handleFilterChange}
               pagination={meta ? { currentPage: meta.currentPage, totalItems: meta.totalItems, itemsPerPage: meta.itemsPerPage, totalPages: meta.totalPages } : undefined}
               onPageChange={handlePageChange}
               emptyTitle="No reports found"
               emptyDescription="There are no complaint reports to display."
            />

            <ExportModal
               open={showExportModal}
               onClose={() => setShowExportModal(false)}
               onExport={handleExport}
               loading={isExporting}
               title="Export Reports"
            />
         </Layout>
      </PrivateRoute>
   );
};

export default Reports;
