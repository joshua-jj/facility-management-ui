import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import { UnknownAction } from 'redux';

import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import StatusChip from '@/components/StatusChip';
import PageHeader from '@/components/PageHeader';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import { RootState } from '@/redux/reducers';
import { appActions, requestActions } from '@/actions';
import { RoleId } from '@/constants/roles.constant';
import { exportToCsv } from '@/utilities/exportCsv';
import ExportModal from '@/components/ExportModal';
import { getObjectFromStorage } from '@/utilities/helpers';
import { authConstants, requestConstants } from '@/constants';
import axios from 'axios';
import type { Request } from '@/types';

const VIEW_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

const Requests = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const [searchQuery, setSearchQuery] = useState('');
   const [filterValues, setFilterValues] = useState<Record<string, string>>({});
   const [showExportModal, setShowExportModal] = useState(false);
   const [isExporting, setIsExporting] = useState(false);

   const { userDetails } = useSelector((s: RootState) => s.user);
   const { IsRequestingRequests, allRequestsList, pagination } = useSelector(
      (s: RootState) => s.request,
   );
   const { meta } = pagination;
   const { currentPage, totalItems, itemsPerPage, totalPages } = meta;

   const fetchRequests = useCallback(
      (page?: number) => {
         if (userDetails?.roleId === RoleId.HOD) {
            dispatch(
               requestActions.getDepartmentRequests({
                  departmentId: userDetails?.departmentId ?? 0,
                  ...(page && { page }),
               }) as unknown as UnknownAction,
            );
         } else if (userDetails?.roleId === RoleId.MEMBER) {
            dispatch(
               requestActions.getAssignedRequests({
                  userId: userDetails?.id ?? 0,
                  ...(page && { page }),
               }) as unknown as UnknownAction,
            );
         } else {
            dispatch(
               requestActions.getAllRequests(
                  page ? { page } : undefined,
               ) as unknown as UnknownAction,
            );
         }
      },
      [dispatch, userDetails],
   );

   useEffect(() => {
      fetchRequests();
   }, [fetchRequests]);

   const handleChangePage = (page: number) => {
      fetchRequests(page);
   };

   const handleRowClick = (row: Request) => {
      router.push(
         { pathname: '/admin/request/[id]', query: { id: row.id } },
         `/admin/request/${row.id}`,
      );
   };

   const handleSearch = (query: string) => {
      setSearchQuery(query);
   };

   const handleFilterChange = (key: string, value: string) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
   };

   const handleExport = async (from: string, to: string) => {
      setIsExporting(true);
      try {
         const user = await getObjectFromStorage(authConstants.USER_KEY);
         let uri = `${requestConstants.REQUEST_URI}/export`;
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

         exportToCsv('Requests', rows, [
            { key: 'requesterName', header: 'Requester Name' },
            { key: 'requesterEmail', header: 'Email' },
            { key: 'requesterPhone', header: 'Phone' },
            { key: 'ministryName', header: 'Ministry' },
            { key: 'location', header: 'Location' },
            { key: 'dateOfReturn', header: 'Return Date', format: (v) => (v ? format(parseISO(String(v)), 'yyyy-MM-dd') : '') },
            { key: 'requestStatus', header: 'Status' },
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

   const isPulseStatus = (status: string) => {
      const lower = status?.toLowerCase();
      return lower === 'assigned' || lower === 'pending';
   };

   const formatReturnDate = (value: unknown) => {
      try {
         return format(parseISO(String(value)), 'MMM dd, yyyy');
      } catch {
         return '\u2014';
      }
   };

   const getActions = (row: Request): ActionMenuItem[] => [
      {
         label: 'View',
         icon: VIEW_ICON,
         onClick: () =>
            router.push(
               { pathname: '/admin/request/[id]', query: { id: row.id } },
               `/admin/request/${row.id}`,
            ),
      },
   ];

   const filters: FilterDef[] = [
      {
         key: 'status',
         label: 'Status',
         options: [
            { value: 'Pending', label: 'Pending' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Assigned', label: 'Assigned' },
            { value: 'Collected', label: 'Collected' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Declined', label: 'Declined' },
         ],
      },
   ];

   const filteredRequests = (allRequestsList ?? []).filter((req: Request) => {
      if (searchQuery) {
         const query = searchQuery.toLowerCase();
         const matchesSearch =
            req.requesterName?.toLowerCase().includes(query) ||
            req.requesterEmail?.toLowerCase().includes(query) ||
            req.ministryName?.toLowerCase().includes(query) ||
            req.churchName?.toLowerCase().includes(query) ||
            req.requestStatus?.toLowerCase().includes(query);
         if (!matchesSearch) return false;
      }
      if (filterValues.status) {
         if (req.requestStatus !== filterValues.status) return false;
      }
      return true;
   });

   const columns: Column<Request>[] = [
      {
         key: 'requesterName',
         header: 'Requester Name',
         width: '18%',
      },
      {
         key: 'requesterEmail',
         header: 'Email',
         width: '20%',
         render: (value: unknown) => (
            <span className="text-gray-600 dark:text-gray-400 truncate block max-w-[200px]">
               {String(value ?? '')}
            </span>
         ),
      },
      {
         key: 'ministryName',
         header: 'Ministry / Church',
         width: '18%',
         render: (_value: unknown, row: Request) => (
            <span className="text-gray-700 dark:text-gray-300">
               {row.isChurch ? row.churchName : row.ministryName || '\u2014'}
            </span>
         ),
      },
      {
         key: 'dateOfReturn',
         header: 'Return Date',
         width: '14%',
         render: (value: unknown) => (
            <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
               {formatReturnDate(value)}
            </span>
         ),
      },
      {
         key: 'requestStatus',
         header: 'Status',
         width: '14%',
         align: 'center',
         render: (value: unknown) => (
            <StatusChip
               status={String(value ?? '')}
               pulse={isPulseStatus(String(value ?? ''))}
            />
         ),
      },
      {
         key: 'createdBy',
         header: 'Created By',
      },
      {
         key: 'updatedBy',
         header: 'Modified By',
         render: (value: unknown) => <span>{String(value || '\u2014')}</span>,
      },
      {
         key: 'updatedAt',
         header: 'Modified At',
         render: (value: unknown) => {
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
         render: (_value: unknown, row: Request) => <ActionMenu items={getActions(row)} />,
      },
   ];

   return (
      <PrivateRoute>
         <Layout title="Requests">
            <div className="space-y-6">
               <PageHeader title="Requests" />

               <div
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200
                     dark:border-gray-700/60 shadow-sm overflow-hidden"
               >
                  <DataTable<Request>
                     columns={columns}
                     data={filteredRequests}
                     loading={IsRequestingRequests}
                     onSearch={handleSearch}
                     onExport={() => setShowExportModal(true)}
                     searchPlaceholder="Search by name, email, or status..."
                     onRowClick={handleRowClick}
                     filters={filters}
                     filterValues={filterValues}
                     onFilterChange={handleFilterChange}
                     pagination={{
                        currentPage,
                        totalItems,
                        itemsPerPage,
                        totalPages,
                     }}
                     onPageChange={handleChangePage}
                     emptyTitle="No requests found"
                  />
               </div>
            </div>

            <ExportModal
               open={showExportModal}
               onClose={() => setShowExportModal(false)}
               onExport={handleExport}
               loading={isExporting}
               title="Export Requests"
            />
         </Layout>
      </PrivateRoute>
   );
};

export default Requests;
