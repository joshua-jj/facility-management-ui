import Layout from '@/components/Layout';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import { exportToXlsx } from '@/utilities/exportXlsx';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { meetingLocationActions } from '@/actions/meetingLocation.action';
import { UnknownAction } from 'redux';
import { MeetingLocation } from '@/types/meetingLocation';
import AddMeetingLocation from '@/components/Modals/AddMeetingLocation';
import ListStatsStrip from '@/components/ListStatsStrip';
import PrivateRoute from '@/components/PrivateRoute';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import { ADMIN_ROLES } from '@/constants/roles.constant';
import { meetingLocationConstants } from '@/constants/meetingLocation.constant';
import { AppEmitter } from '@/controllers/EventEmitter';

const PAGE_LIMIT = 10;

const VIEW_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
   </svg>
);

const EDIT_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
   </svg>
);

const DEACTIVATE_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
   </svg>
);

const MeetingLocations = () => {
   const dispatch = useDispatch();
   const [searchQuery, setSearchQuery] = useState('');
   const [filterValues, setFilterValues] = useState<Record<string, string>>({});
   const [modalOpen, setModalOpen] = useState(false);
   const [editTarget, setEditTarget] = useState<MeetingLocation | null>(null);
   const [currentPage, setCurrentPage] = useState(1);

   const { IsRequestingMeetingLocations, allMeetingLocationsList, pagination } = useSelector(
      (s: RootState) => s.meetingLocation,
   );
   const { meta } = pagination;

   const fetchMeetingLocations = useCallback((page: number) => {
      dispatch(meetingLocationActions.getMeetingLocations({
         page,
         limit: PAGE_LIMIT,
         search: searchQuery || undefined,
         status: filterValues.status || undefined,
      }) as unknown as UnknownAction);
   }, [dispatch, searchQuery, filterValues]);

   useEffect(() => {
      fetchMeetingLocations(currentPage);
   }, [fetchMeetingLocations, currentPage]);

   // Re-fetch current page after any mutation
   useEffect(() => {
      const events = [
         meetingLocationConstants.CREATE_MEETING_LOCATION_SUCCESS,
         meetingLocationConstants.UPDATE_MEETING_LOCATION_SUCCESS,
         meetingLocationConstants.DELETE_MEETING_LOCATION_SUCCESS,
      ];
      const listeners = events.map((evt) =>
         AppEmitter.addListener(evt, () => fetchMeetingLocations(currentPage)),
      );
      return () => listeners.forEach((l) => l.remove());
   }, [currentPage, fetchMeetingLocations]);

   const handlePageChange = (page: number) => {
      setCurrentPage(page);
   };

   const handleSearch = (query: string) => {
      setSearchQuery(query);
      setCurrentPage(1);
   };

   const filteredLocations = useMemo(() => allMeetingLocationsList ?? [], [allMeetingLocationsList]);

   const handleFilterChange = (key: string, value: string) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
   };

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
      ],
      [],
   );

   const handleExport = () => {
      exportToXlsx('Meeting Locations', filteredLocations as unknown as Record<string, unknown>[], [
         { key: 'name', header: 'Name' },
         { key: 'createdBy', header: 'Created By' },
         { key: 'createdAt', header: 'Created Date', width: 22, format: (v) => (v ? new Date(String(v)) : '') },
         { key: 'status', header: 'Status' },
      ]);
   };

   const openCreate = () => {
      setEditTarget(null);
      setModalOpen(true);
   };

   const openEdit = (row: MeetingLocation) => {
      setEditTarget(row);
      setModalOpen(true);
   };

   const closeModal = () => {
      setModalOpen(false);
      setEditTarget(null);
   };

   const handleDeactivate = (row: MeetingLocation) => {
      if (!window.confirm(`Deactivate meeting location "${row.name}"? It will be moved to inactive status.`)) return;
      dispatch(meetingLocationActions.deleteMeetingLocation(row.id) as unknown as UnknownAction);
   };

   const openView = (row: MeetingLocation) => {
      setEditTarget(row);
      setModalOpen(true);
   };

   const getActions = (row: MeetingLocation): ActionMenuItem[] => [
      {
         label: 'View',
         icon: VIEW_ICON,
         onClick: () => openView(row),
      },
      {
         label: 'Edit',
         icon: EDIT_ICON,
         onClick: () => openEdit(row),
      },
      {
         label: 'Deactivate',
         icon: DEACTIVATE_ICON,
         onClick: () => handleDeactivate(row),
         variant: 'danger',
      },
   ];

   const columns: Column<MeetingLocation>[] = [
      {
         key: 'name',
         header: 'Name',
         render: (_, row) => <span className="font-medium text-[#0F2552] dark:text-white/85">{row.name}</span>,
      },
      {
         key: 'createdBy',
         header: 'Created By',
         render: (value) => <span>{String(value || '\u2014')}</span>,
      },
      {
         key: 'createdAt',
         header: 'Created Date',
         render: (value) => {
            if (!value) return <span>{'\u2014'}</span>;
            try {
               return <span>{format(parseISO(String(value)), 'MMM d, yyyy')}</span>;
            } catch {
               return <span>{'\u2014'}</span>;
            }
         },
      },
      {
         key: 'status',
         header: 'Status',
         render: (value) => {
            const isActive =
               String(value).toUpperCase() === 'A' || String(value).toUpperCase() === 'ACTIVE';
            return (
               <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                     isActive
                        ? 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-white/8 dark:text-white/40'
                  }`}
               >
                  {isActive ? 'Active' : 'Inactive'}
               </span>
            );
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

   const activeLocationCount = filteredLocations.filter(
      (l) => String(l.status).toUpperCase() === 'A' || String(l.status).toUpperCase() === 'ACTIVE',
   ).length;
   const inactiveLocationCount = filteredLocations.length - activeLocationCount;

   return (
      <PrivateRoute allowedRoles={ADMIN_ROLES}>
         <Layout title="Meeting Locations">
            <PageHeader
               title="Meeting Locations"
               subtitle="Manage the venues available for meetings"
               action={
                  <ActionButton variant="primary" onClick={openCreate}>
                     + Add Location
                  </ActionButton>
               }
            />

            <ListStatsStrip
               tiles={[
                  { label: 'Total', value: meta.totalItems, hint: 'Locations' },
                  { label: 'Active', value: activeLocationCount, accent: '#10B981', hint: 'On this page' },
                  { label: 'Inactive', value: inactiveLocationCount, accent: '#EF4444', hint: 'On this page' },
                  { label: 'Page', value: `${meta.currentPage} / ${Math.max(meta.totalPages, 1)}` },
               ]}
            />

            <DataTable
               columns={columns}
               data={filteredLocations}
               loading={IsRequestingMeetingLocations}
               onSearch={handleSearch}
               onExport={handleExport}
               onRefresh={() => fetchMeetingLocations(currentPage)}
               searchPlaceholder="Search meeting locations..."
               filters={filters}
               filterValues={filterValues}
               onFilterChange={handleFilterChange}
               emptyTitle="No meeting locations found"
               emptyDescription="Get started by adding your first meeting location."
               pagination={{
                  currentPage: meta.currentPage,
                  totalItems: meta.totalItems,
                  itemsPerPage: meta.itemsPerPage,
                  totalPages: meta.totalPages,
               }}
               onPageChange={handlePageChange}
            />

            <AddMeetingLocation open={modalOpen} onClose={closeModal} initialData={editTarget} />
         </Layout>
      </PrivateRoute>
   );
};

export default MeetingLocations;
