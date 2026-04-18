import Layout from '@/components/Layout';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import { exportToXlsx } from '@/utilities/exportXlsx';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { meetingActions } from '@/actions/meeting.action';
import { meetingLocationActions } from '@/actions/meetingLocation.action';
import { UnknownAction } from 'redux';
import { Meeting } from '@/types/meeting';
import AddMeeting from '@/components/Modals/AddMeeting';
import PrivateRoute from '@/components/PrivateRoute';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import { ADMIN_ROLES } from '@/constants/roles.constant';
import { meetingConstants } from '@/constants/meeting.constant';
import { AppEmitter } from '@/controllers/EventEmitter';

const PAGE_LIMIT = 10;

const EDIT_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
   </svg>
);

const DELETE_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
   </svg>
);

const Meetings = () => {
   const dispatch = useDispatch();
   const [searchQuery, setSearchQuery] = useState('');
   const [filterValues, setFilterValues] = useState<Record<string, string>>({});
   const [modalOpen, setModalOpen] = useState(false);
   const [editTarget, setEditTarget] = useState<Meeting | null>(null);
   const [currentPage, setCurrentPage] = useState(1);

   const { IsRequestingMeetings, allMeetingsList, pagination } = useSelector(
      (s: RootState) => s.meeting,
   );
   const { allMeetingLocationsList } = useSelector((s: RootState) => s.meetingLocation);
   const { meta } = pagination;

   useEffect(() => {
      // Fetch all locations (unpaginated) for the locationId filter dropdown
      dispatch(meetingLocationActions.getMeetingLocations() as unknown as UnknownAction);
   }, [dispatch]);

   const fetchMeetings = useCallback((page: number) => {
      dispatch(meetingActions.getMeetings({
         page,
         limit: PAGE_LIMIT,
         search: searchQuery || undefined,
         status: filterValues.status || undefined,
         locationId: filterValues.locationId || undefined,
      }) as unknown as UnknownAction);
   }, [dispatch, searchQuery, filterValues]);

   useEffect(() => {
      fetchMeetings(currentPage);
   }, [fetchMeetings, currentPage]);

   // Re-fetch current page after any mutation
   useEffect(() => {
      const events = [
         meetingConstants.CREATE_MEETING_SUCCESS,
         meetingConstants.UPDATE_MEETING_SUCCESS,
         meetingConstants.DELETE_MEETING_SUCCESS,
      ];
      const listeners = events.map((evt) =>
         AppEmitter.addListener(evt, () => fetchMeetings(currentPage)),
      );
      return () => listeners.forEach((l) => l.remove());
   }, [currentPage, fetchMeetings]);

   const handlePageChange = (page: number) => {
      setCurrentPage(page);
   };

   const handleSearch = (query: string) => {
      setSearchQuery(query);
      setCurrentPage(1);
   };

   const filteredMeetings = useMemo(() => allMeetingsList ?? [], [allMeetingsList]);

   const handleFilterChange = (key: string, value: string) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
   };

   const locationOptions = useMemo(
      () => (allMeetingLocationsList ?? []).map((loc) => ({ value: String(loc.id), label: loc.name })),
      [allMeetingLocationsList],
   );

   const filters: FilterDef[] = useMemo(
      () => [
         {
            key: 'locationId',
            label: 'Location',
            options: locationOptions,
         },
         {
            key: 'status',
            label: 'Status',
            options: [
               { value: 'A', label: 'Active' },
               { value: 'I', label: 'Inactive' },
            ],
         },
      ],
      [locationOptions],
   );

   const handleExport = () => {
      exportToXlsx('Meetings', filteredMeetings as unknown as Record<string, unknown>[], [
         { key: 'name', header: 'Name' },
         { key: 'location', header: 'Default Location', format: (v) => (v as { name?: string })?.name ?? '' },
         { key: 'createdBy', header: 'Created By' },
         { key: 'createdAt', header: 'Created Date', width: 22, format: (v) => (v ? new Date(String(v)) : '') },
         { key: 'status', header: 'Status' },
      ]);
   };

   const openCreate = () => {
      setEditTarget(null);
      setModalOpen(true);
   };

   const openEdit = (row: Meeting) => {
      setEditTarget(row);
      setModalOpen(true);
   };

   const closeModal = () => {
      setModalOpen(false);
      setEditTarget(null);
   };

   const handleDelete = (row: Meeting) => {
      if (!window.confirm(`Delete meeting "${row.name}"? This cannot be undone.`)) return;
      dispatch(meetingActions.deleteMeeting(row.id) as unknown as UnknownAction);
   };

   const getActions = (row: Meeting): ActionMenuItem[] => [
      {
         label: 'Edit',
         icon: EDIT_ICON,
         onClick: () => openEdit(row),
      },
      {
         label: 'Delete',
         icon: DELETE_ICON,
         onClick: () => handleDelete(row),
         variant: 'danger',
      },
   ];

   const columns: Column<Meeting>[] = [
      {
         key: 'name',
         header: 'Name',
         render: (_, row) => <span className="font-medium text-[#0F2552] dark:text-white/85">{row.name}</span>,
      },
      {
         key: 'location',
         header: 'Default Location',
         render: (_, row) => <span>{row.location?.name ?? '\u2014'}</span>,
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

   return (
      <PrivateRoute allowedRoles={ADMIN_ROLES}>
         <Layout title="Meetings">
            <PageHeader
               title="Meetings"
               subtitle={`${meta.totalItems} meeting${meta.totalItems !== 1 ? 's' : ''}`}
               action={
                  <ActionButton variant="primary" onClick={openCreate}>
                     + Add Meeting
                  </ActionButton>
               }
            />

            <DataTable
               columns={columns}
               data={filteredMeetings}
               loading={IsRequestingMeetings}
               onSearch={handleSearch}
               onExport={handleExport}
               onRefresh={() => fetchMeetings(currentPage)}
               searchPlaceholder="Search meetings..."
               filters={filters}
               filterValues={filterValues}
               onFilterChange={handleFilterChange}
               emptyTitle="No meetings found"
               emptyDescription="Get started by adding your first meeting."
               pagination={{
                  currentPage: meta.currentPage,
                  totalItems: meta.totalItems,
                  itemsPerPage: meta.itemsPerPage,
                  totalPages: meta.totalPages,
               }}
               onPageChange={handlePageChange}
            />

            <AddMeeting open={modalOpen} onClose={closeModal} initialData={editTarget} />
         </Layout>
      </PrivateRoute>
   );
};

export default Meetings;
