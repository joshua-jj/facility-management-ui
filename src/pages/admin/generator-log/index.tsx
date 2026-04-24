import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { format, parseISO, subDays, startOfMonth, startOfYear } from 'date-fns';
import { useRouter } from 'next/router';
import { RootState } from '@/redux/reducers';
import { appActions, generatorActions, meetingActions, meetingLocationActions } from '@/actions';
import { GeneratorLog } from '@/types';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import StatusChip from '@/components/StatusChip';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import AddGeneratorLog from '@/components/Modals/AddGeneratorLog';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import { ADMIN_ROLES } from '@/constants/roles.constant';
import { exportToXlsx } from '@/utilities/exportXlsx';
import ExportModal from '@/components/ExportModal';
import { generatorConstants } from '@/constants';
import { getObjectFromStorage } from '@/utilities/helpers';
import { authConstants } from '@/constants';
import { AppEmitter } from '@/controllers/EventEmitter';
import axios from 'axios';

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
   const { allMeetingsList } = useSelector((s: RootState) => s.meeting);
   const { allMeetingLocationsList } = useSelector((s: RootState) => s.meetingLocation);

   const { meta } = pagination;
   const { currentPage, itemsPerPage, totalItems, totalPages } = meta;

   const buildFilterParams = useCallback((values: Record<string, string>) => {
      const { status, meetingId, locationId, dueForService, faultDetected, dateRange } = values;
      const dateParams = dateRange ? resolveDateRange(dateRange) : {};
      return {
         ...(status ? { status } : {}),
         ...(meetingId ? { meetingId } : {}),
         ...(locationId ? { locationId } : {}),
         ...(dueForService ? { dueForService } : {}),
         ...(faultDetected ? { faultDetected } : {}),
         ...dateParams,
      };
   }, []);

   useEffect(() => {
      dispatch(generatorActions.getGeneratorLogs() as unknown as UnknownAction);
      // Fetch meetings and locations for filter dropdowns
      dispatch(meetingActions.getMeetings({ limit: 200 }) as unknown as UnknownAction);
      dispatch(meetingLocationActions.getMeetingLocations({ limit: 200 }) as unknown as UnknownAction);
   }, [dispatch]);

   // Re-fetch current page after any mutation
   useEffect(() => {
      const events = [
         generatorConstants.CREATE_GENERATOR_LOG_SUCCESS,
         generatorConstants.UPDATE_GENERATOR_LOG_SUCCESS,
      ];
      const listeners = events.map((evt) =>
         AppEmitter.addListener(evt, () =>
            dispatch(generatorActions.getGeneratorLogs({ page: currentPage, ...buildFilterParams(filterValues) }) as unknown as UnknownAction),
         ),
      );
      return () => listeners.forEach((l) => l.remove());
   }, [currentPage, filterValues, buildFilterParams, dispatch]);

   const handleSearch = useCallback(
      (query: string) => {
         if (!query) {
            dispatch(generatorActions.getGeneratorLogs(buildFilterParams(filterValues)) as unknown as UnknownAction);
         } else {
            dispatch(
               generatorActions.searchGeneratorLog({ text: query }) as unknown as UnknownAction,
            );
         }
      },
      [dispatch, filterValues, buildFilterParams],
   );

   const handleUpdate = (data: GeneratorLog) => {
      setEditData(data);
      setShowEditModal(true);
   };

   const handleChangePage = (page: number) => {
      dispatch(generatorActions.getGeneratorLogs({ page, ...buildFilterParams(filterValues) }) as unknown as UnknownAction);
   };

   const handleFilterChange = (key: string, value: string) => {
      const newValues = { ...filterValues, [key]: value };
      setFilterValues(newValues);
      dispatch(generatorActions.getGeneratorLogs({ page: 1, ...buildFilterParams(newValues) }) as unknown as UnknownAction);
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

         exportToXlsx('Generator Logs', rows, [
            { key: 'meeting', header: 'Meeting Name', format: (v) => (v as { name?: string })?.name ?? '' },
            { key: 'location', header: 'Location', format: (v) => (v as { name?: string })?.name ?? '' },
            { key: 'generatorType', header: 'Generator Type' },
            { key: 'onTime', header: 'On Time', width: 22, format: (v) => (v ? new Date(String(v)) : '') },
            { key: 'offTime', header: 'Off Time', width: 22, format: (v) => (v ? new Date(String(v)) : '') },
            { key: 'hoursUsed', header: 'Hours Used' },
            { key: 'engineStartHours', header: 'Engine Start Hours' },
            { key: 'engineOffHours', header: 'Engine Off Hours' },
            {
               key: 'dieselLevelOn',
               header: 'Diesel Level On',
               format: (v, row) => {
                  if (v == null || v === '') return '';
                  const unit = (row as { dieselUnit?: string }).dieselUnit === 'percentage' ? '%' : 'Litres';
                  return `${v} ${unit}`;
               },
            },
            {
               key: 'dieselLevelOff',
               header: 'Diesel Level Off',
               format: (v, row) => {
                  if (v == null || v === '') return '';
                  const unit = (row as { dieselUnit?: string }).dieselUnit === 'percentage' ? '%' : 'Litres';
                  return `${v} ${unit}`;
               },
            },
            { key: 'lastServiceHour', header: 'Last Service Hour' },
            { key: 'nextServiceHour', header: 'Next Service Hour' },
            { key: 'dueForService', header: 'Due For Service', format: (v) => (v ? 'Yes' : 'No') },
            { key: 'oilFilterDueForReplacement', header: 'Oil Filter Due', format: (v) => (v ? 'Yes' : 'No') },
            { key: 'lastOilFilterReplacement', header: 'Last Oil Filter Replacement', width: 22, format: (v) => (v ? new Date(String(v)) : '') },
            { key: 'faultDetected', header: 'Fault Detected', format: (v) => (v ? 'Yes' : 'No') },
            { key: 'faultDescription', header: 'Fault Description', width: 30 },
            { key: 'remark', header: 'Remark', width: 30 },
            { key: 'createdBy', header: 'Created By' },
            { key: 'createdAt', header: 'Created Date', width: 22, format: (v) => (v ? new Date(String(v)) : '') },
         ]);

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

   const meetingOptions = useMemo(
      () => (allMeetingsList ?? []).map((m) => ({ value: String(m.id), label: m.name })),
      [allMeetingsList],
   );

   const locationOptions = useMemo(
      () => (allMeetingLocationsList ?? []).map((l) => ({ value: String(l.id), label: l.name })),
      [allMeetingLocationsList],
   );

   const filters: FilterDef[] = useMemo(() => [
      {
         key: 'status',
         label: 'All Statuses',
         options: [
            { value: 'A', label: 'Active' },
            { value: 'I', label: 'Inactive' },
         ],
      },
      {
         key: 'meetingId',
         label: 'All Meetings',
         options: meetingOptions,
      },
      {
         key: 'locationId',
         label: 'All Locations',
         options: locationOptions,
      },
      {
         key: 'dueForService',
         label: 'Due For Service',
         options: [
            { value: 'Y', label: 'Yes' },
            { value: 'N', label: 'No' },
         ],
      },
      {
         key: 'faultDetected',
         label: 'Fault Detected',
         options: [
            { value: 'Y', label: 'Yes' },
            { value: 'N', label: 'No' },
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
   ], [meetingOptions, locationOptions]);

   // Data is already server-filtered; no client-side filter needed
   const filteredData = allGeneratorLogsList ?? [];

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
               onRefresh={() => dispatch(generatorActions.getGeneratorLogs({ page: currentPage, ...buildFilterParams(filterValues) }) as unknown as UnknownAction)}
               searchPlaceholder="Search generator logs..."
               filters={filters}
               filterValues={filterValues}
               onFilterChange={handleFilterChange}
               pagination={{ currentPage, totalItems, itemsPerPage, totalPages }}
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
