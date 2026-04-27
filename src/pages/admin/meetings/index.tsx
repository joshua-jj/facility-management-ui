import Layout from '@/components/Layout';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
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
import ListStatsStrip from '@/components/ListStatsStrip';
import PrivateRoute from '@/components/PrivateRoute';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ADMIN_ROLES } from '@/constants/roles.constant';
import { meetingConstants } from '@/constants/meeting.constant';
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

const Meetings = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const [searchQuery, setSearchQuery] = useState('');
   const [filterValues, setFilterValues] = useState<Record<string, string>>({});
   const [modalOpen, setModalOpen] = useState(false);
   const [editTarget, setEditTarget] = useState<Meeting | null>(null);
   const [currentPage, setCurrentPage] = useState(1);
   const [pendingDeactivate, setPendingDeactivate] = useState<Meeting | null>(null);

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

   const handleDeactivate = (row: Meeting) => {
      setPendingDeactivate(row);
   };

   const confirmDeactivate = () => {
      if (!pendingDeactivate) return;
      dispatch(
         meetingActions.deleteMeeting(pendingDeactivate.id) as unknown as UnknownAction,
      );
      setPendingDeactivate(null);
   };

   const openView = (row: Meeting) => {
      router.push(`/admin/meetings/${row.id}`);
   };

   const getActions = (row: Meeting): ActionMenuItem[] => [
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

   const activeMeetingCount = filteredMeetings.filter(
      (m) => String(m.status).toUpperCase() === 'A' || String(m.status).toUpperCase() === 'ACTIVE',
   ).length;
   const uniqueLocationCount = new Set(
      filteredMeetings.map((m) => m.location?.id).filter(Boolean),
   ).size;

   return (
      <PrivateRoute allowedRoles={ADMIN_ROLES}>
         <Layout title="Meetings">
            <PageHeader
               subtitle="Manage scheduled meetings across facility locations"
               action={
                  <ActionButton variant="primary" onClick={openCreate}>
                     + Add Meeting
                  </ActionButton>
               }
            />

            <ListStatsStrip
               tiles={[
                  { label: 'Total', value: meta.totalItems, hint: 'Meetings' },
                  { label: 'Active', value: activeMeetingCount, accent: '#10B981', hint: 'On this page' },
                  { label: 'Locations', value: uniqueLocationCount, hint: 'Unique on this page' },
                  { label: 'Page', value: `${meta.currentPage} / ${Math.max(meta.totalPages, 1)}` },
               ]}
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

            <ConfirmDialog
               open={pendingDeactivate !== null}
               onClose={() => setPendingDeactivate(null)}
               onConfirm={confirmDeactivate}
               title={
                  pendingDeactivate
                     ? `Deactivate meeting "${pendingDeactivate.name}"?`
                     : ''
               }
               description="It will be moved to inactive status. You can reactivate it later."
               confirmLabel="Deactivate"
               tone="danger"
            />
         </Layout>
      </PrivateRoute>
   );
};

export default Meetings;
