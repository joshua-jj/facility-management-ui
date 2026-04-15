import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/router';
import { RootState } from '@/redux/reducers';
import { appActions, generatorActions } from '@/actions';
import { GeneratorLog } from '@/types';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import StatusChip from '@/components/StatusChip';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import AddGeneratorLog from '@/components/Modals/AddGeneratorLog';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import { ADMIN_ROLES } from '@/constants/roles.constant';
import { exportToCsv } from '@/utilities/exportCsv';
import ExportModal from '@/components/ExportModal';
import { generatorConstants } from '@/constants';
import { getObjectFromStorage } from '@/utilities/helpers';
import { authConstants } from '@/constants';
import axios from 'axios';

const EDIT_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

const VIEW_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
   </svg>
);

const GeneratorLogs = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const [showAddModal, setShowAddModal] = useState(false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [editData, setEditData] = useState<GeneratorLog | null>(null);
   const [showExportModal, setShowExportModal] = useState(false);
   const [isExporting, setIsExporting] = useState(false);
   const [filterValues, setFilterValues] = useState<Record<string, string>>({});

   const { IsRequestingGeneratorLogs, allGeneratorLogsList, pagination } = useSelector(
      (s: RootState) => s.generator,
   );

   const { meta } = pagination;
   const { currentPage, itemsPerPage, totalItems, totalPages } = meta;

   useEffect(() => {
      dispatch(generatorActions.getGeneratorLogs() as unknown as UnknownAction);
   }, [dispatch]);

   const handleSearch = useCallback(
      (query: string) => {
         if (!query) {
            dispatch(generatorActions.getGeneratorLogs() as unknown as UnknownAction);
         } else {
            dispatch(
               generatorActions.searchGeneratorLog({ text: query }) as unknown as UnknownAction,
            );
         }
      },
      [dispatch],
   );

   const handleUpdate = (data: GeneratorLog) => {
      setEditData(data);
      setShowEditModal(true);
   };

   const handleChangePage = (page: number) => {
      dispatch(generatorActions.getGeneratorLogs({ page }) as unknown as UnknownAction);
   };

   const handleFilterChange = (key: string, value: string) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
   };

   const handleExport = async (from: string, to: string) => {
      setIsExporting(true);
      try {
         const user = await getObjectFromStorage(authConstants.USER_KEY);
         let uri = `${generatorConstants.GENERATOR_URI}/export`;
         const params: string[] = [];
         if (from) params.push(`from=${from}`);
         if (to) params.push(`to=${to}`);
         if (params.length > 0) uri += `?${params.join('&')}`;

         const resp = await axios.get(uri, {
            headers: {
               Accept: 'application/json',
               Authorization: user?.token ? `Bearer ${user.token}` : '',
            },
         });

         const rows = resp.data?.data ?? [];
         if (rows.length === 0) {
            dispatch(appActions.setSnackBar({ type: 'warning', message: 'No records found for the selected range.', variant: 'warning' }) as unknown as UnknownAction);
            return;
         }

         exportToCsv('Generator Logs', rows, [
            { key: 'meeting', header: 'Meeting Name', format: (v) => (v as { name?: string })?.name ?? String(v ?? '') },
            { key: 'generatorType', header: 'Generator Type' },
            { key: 'location', header: 'Location', format: (v) => (v as { name?: string })?.name ?? String(v ?? '') },
            { key: 'onTime', header: 'On Time', format: (v) => (v ? format(parseISO(String(v)), 'yyyy-MM-dd h:mm a') : '') },
            { key: 'offTime', header: 'Off Time', format: (v) => (v ? format(parseISO(String(v)), 'yyyy-MM-dd h:mm a') : '') },
            { key: 'engineStartHours', header: 'Engine Start Hours' },
            { key: 'engineOffHours', header: 'Engine Off Hours' },
            { key: 'dieselLevelOn', header: 'Diesel Level On' },
            { key: 'dieselLevelOff', header: 'Diesel Level Off' },
            { key: 'dueForService', header: 'Due For Service', format: (v) => (v ? 'Yes' : 'No') },
            { key: 'faultDetected', header: 'Fault Detected', format: (v) => (v ? 'Yes' : 'No') },
            { key: 'faultDescription', header: 'Fault Description' },
            { key: 'remark', header: 'Remark' },
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

   const formatTime = (value: unknown): string => {
      if (!value) return '--';
      try {
         return format(parseISO(String(value)), 'h:mm a');
      } catch {
         return '--';
      }
   };

   const calculateHoursUsed = (onTime: string, offTime: string): string => {
      if (!onTime || !offTime) return '--';
      try {
         const on = parseISO(onTime);
         const off = parseISO(offTime);
         const diffMs = off.getTime() - on.getTime();
         if (diffMs < 0) return '--';
         const hours = Math.floor(diffMs / (1000 * 60 * 60));
         const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
         return `${hours}h ${minutes}m`;
      } catch {
         return '--';
      }
   };

   const getActions = (row: GeneratorLog): ActionMenuItem[] => [
      {
         label: 'View',
         icon: VIEW_ICON,
         onClick: () => router.push(`/admin/generator-log/${row.id}`),
      },
      {
         label: 'Edit',
         icon: EDIT_ICON,
         onClick: () => handleUpdate(row),
      },
   ];

   const filters: FilterDef[] = [
      {
         key: 'status',
         label: 'Status',
         options: [
            { value: 'A', label: 'Active' },
            { value: 'I', label: 'Inactive' },
         ],
      },
   ];

   const filteredData = (allGeneratorLogsList ?? []).filter((log: GeneratorLog) => {
      if (filterValues.status) {
         const logStatus = String((log as unknown as Record<string, unknown>).status ?? '');
         if (logStatus !== filterValues.status) return false;
      }
      return true;
   });

   const columns: Column<GeneratorLog>[] = [
      {
         key: 'meeting',
         header: 'Meeting Name',
         render: (_value, row) => <span>{row.meeting?.name ?? row.nameOfMeeting ?? '--'}</span>,
      },
      { key: 'generatorType', header: 'Generator Type' },
      {
         key: 'location',
         header: 'Location',
         render: (_value, row) => <span>{row.location?.name ?? row.meetingLocation ?? '--'}</span>,
      },
      {
         key: 'onTime',
         header: 'On Time',
         render: (value) => <span>{formatTime(value)}</span>,
      },
      {
         key: 'offTime',
         header: 'Off Time',
         render: (value) => <span>{formatTime(value)}</span>,
      },
      {
         key: 'engineStartHours',
         header: 'Hours Used',
         render: (_value, row) => <span>{calculateHoursUsed(row.onTime, row.offTime)}</span>,
      },
      {
         key: 'remark',
         header: 'Fault',
         render: (value) => {
            const remark = String(value ?? '').trim();
            if (!remark) return <StatusChip status="good" />;
            return <StatusChip status="bad" />;
         },
      },
      {
         key: 'status' as keyof GeneratorLog,
         header: 'Status',
         align: 'center',
         render: (value) => <StatusChip status={String(value ?? '')} />,
      },
      {
         key: 'createdBy' as keyof GeneratorLog,
         header: 'Created By',
      },
      {
         key: 'updatedBy' as keyof GeneratorLog,
         header: 'Modified By',
         render: (value) => <span>{String(value || '\u2014')}</span>,
      },
      {
         key: 'updatedAt' as keyof GeneratorLog,
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
      <PrivateRoute allowedRoles={ADMIN_ROLES}>
         <Layout title="Generator Logs">
            <PageHeader
               title="Generator Logs"
               subtitle="Track generator usage and faults"
               action={
                  <ActionButton onClick={() => setShowAddModal(true)}>Add Log</ActionButton>
               }
            />

            <DataTable
               columns={columns}
               data={filteredData}
               loading={IsRequestingGeneratorLogs}
               onSearch={handleSearch}
               onExport={() => setShowExportModal(true)}
               searchPlaceholder="Search generator logs..."
               filters={filters}
               filterValues={filterValues}
               onFilterChange={handleFilterChange}
               pagination={
                  totalPages > 1
                     ? { currentPage, totalItems, itemsPerPage, totalPages }
                     : undefined
               }
               onPageChange={handleChangePage}
               emptyTitle="No generator logs found"
               emptyDescription="Get started by adding your first generator log."
            />

            <ExportModal
               open={showExportModal}
               onClose={() => setShowExportModal(false)}
               onExport={handleExport}
               loading={isExporting}
               title="Export Generator Logs"
            />

            {showAddModal && (
               <AddGeneratorLog
                  className="text-start w-full cursor-pointer"
                  open={showAddModal}
                  onClose={() => setShowAddModal(false)}
               />
            )}

            {showEditModal && (
               <AddGeneratorLog
                  className="text-start w-full cursor-pointer"
                  generatorLog={editData}
                  open={showEditModal}
                  onClose={() => setShowEditModal(false)}
               />
            )}
         </Layout>
      </PrivateRoute>
   );
};

export default GeneratorLogs;
