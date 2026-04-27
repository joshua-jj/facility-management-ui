import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';

import { RootState } from '@/redux/reducers';
import { incidenceLogActions } from '@/actions';
import type { IncidenceLog } from '@/types/incidenceLog';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import StatusChip from '@/components/StatusChip';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import ConfirmDialog from '@/components/ConfirmDialog';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import AddIncidenceLog from '@/components/Modals/AddIncidenceLog';
import ListStatsStrip from '@/components/ListStatsStrip';
import { RoleId } from '@/constants/roles.constant';
import { usePermissions } from '@/hooks/usePermissions';
import { incidenceLogConstants } from '@/constants';
import { AppEmitter } from '@/controllers/EventEmitter';

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

const filters: FilterDef[] = [
   {
      key: 'status',
      label: 'All Statuses',
      options: [
         { value: 'A', label: 'Active' },
         { value: 'I', label: 'Inactive' },
      ],
   },
];

const IncidenceLogsPage = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const [editLog, setEditLog] = useState<IncidenceLog | null>(null);
   const [modalOpen, setModalOpen] = useState(false);
   const [filterValues, setFilterValues] = useState<Record<string, string>>({});
   const [currentPage, setCurrentPage] = useState(1);
   const [pendingDeactivate, setPendingDeactivate] = useState<IncidenceLog | null>(null);

   const { IsRequestingIncidenceLogs, allIncidenceLogsList, pagination } = useSelector(
      (s: RootState) => s.incidenceLog,
   );
   const { meta } = pagination;
   const { isBackOffice, isMember, isHod, userId } = usePermissions();

   // Per spec: only the member who FILED the report may edit it.
   const isReporter = (row: IncidenceLog) =>
      !!userId && row.reportedByUserId === userId;

   const fetchLogs = useCallback(
      (page = 1) => {
         dispatch(
            incidenceLogActions.getIncidenceLogs({
               page,
               limit: 10,
               status: filterValues.status || undefined,
            }) as unknown as UnknownAction,
         );
      },
      [dispatch, filterValues],
   );

   useEffect(() => {
      fetchLogs(currentPage);
   }, [fetchLogs, currentPage]);

   useEffect(() => {
      const events = [
         incidenceLogConstants.CREATE_INCIDENCE_LOG_SUCCESS,
         incidenceLogConstants.UPDATE_INCIDENCE_LOG_SUCCESS,
         incidenceLogConstants.DELETE_INCIDENCE_LOG_SUCCESS,
      ];
      const listeners = events.map((evt) =>
         AppEmitter.addListener(evt, () => fetchLogs(currentPage)),
      );
      return () => listeners.forEach((l) => l.remove());
   }, [fetchLogs, currentPage]);

   const handleDeactivate = (row: IncidenceLog) => {
      setPendingDeactivate(row);
   };

   const confirmDeactivate = () => {
      if (!pendingDeactivate) return;
      dispatch(
         incidenceLogActions.deleteIncidenceLog(pendingDeactivate.id) as unknown as UnknownAction,
      );
      setPendingDeactivate(null);
   };

   const openEdit = (row: IncidenceLog) => {
      setEditLog(row);
      setModalOpen(true);
   };

   const getActions = (row: IncidenceLog): ActionMenuItem[] => {
      const actions: ActionMenuItem[] = [
         {
            label: 'View',
            icon: VIEW_ICON,
            onClick: () => router.push(`/admin/incidence-log/${row.id}`),
         },
      ];
      // Edit reserved for the member who filed the report; HOD is strictly
      // view-only and SUPER_ADMIN / ADMIN don't edit incident reports per spec.
      if (isMember && isReporter(row)) {
         actions.push({
            label: 'Edit',
            icon: EDIT_ICON,
            onClick: () => openEdit(row),
         });
      }
      // Delete is reserved for SUPER_ADMIN / ADMIN.
      if (isBackOffice) {
         actions.push({
            label: 'Delete',
            icon: DEACTIVATE_ICON,
            onClick: () => handleDeactivate(row),
            variant: 'danger',
         });
      }
      // Silence lint for unused flag; kept for readability.
      void isHod;
      return actions;
   };

   const columns: Column<IncidenceLog>[] = [
      {
         key: 'id',
         header: '#',
         width: '60px',
         render: (_, row) => (
            <span className="tabular-nums" style={{ color: 'var(--text-hint)' }}>#{row.id}</span>
         ),
      },
      {
         key: 'department',
         header: 'Department',
         render: (_, row) => <span>{row.department?.name ?? '—'}</span>,
      },
      {
         key: 'location',
         header: 'Location',
         render: (_, row) => <span>{row.location?.name ?? '—'}</span>,
      },
      {
         key: 'reportedBy',
         header: 'Reported By',
      },
      {
         key: 'status',
         header: 'Status',
         align: 'center',
         render: (v) => <StatusChip status={String(v ?? 'A')} />,
      },
      {
         key: 'incidenceDate',
         header: 'Date',
         render: (v) => {
            try {
               return <span>{format(parseISO(String(v)), 'MMM d, yyyy')}</span>;
            } catch {
               return <span>—</span>;
            }
         },
      },
      {
         key: 'createdBy',
         header: 'Created By',
         render: (v) => <span>{v ? String(v) : '—'}</span>,
      },
      {
         key: 'updatedBy',
         header: 'Modified By',
         render: (_, row) =>
            row.updatedBy && row.updatedBy !== row.createdBy ? (
               <span>{row.updatedBy}</span>
            ) : (
               <span style={{ color: 'var(--text-hint)' }}>—</span>
            ),
      },
      {
         key: 'id',
         header: 'Action',
         width: '50px',
         align: 'center',
         render: (_, row) => <ActionMenu items={getActions(row)} />,
      },
   ];

   const thisMonth = (allIncidenceLogsList ?? []).filter((l) => {
      try {
         const d = parseISO(l.incidenceDate);
         const now = new Date();
         return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } catch {
         return false;
      }
   }).length;

   const uniqueDepartments = new Set(
      (allIncidenceLogsList ?? []).map((l) => l.department?.id).filter(Boolean),
   ).size;

   return (
      <PrivateRoute allowedRoles={[RoleId.SUPER_ADMIN, RoleId.ADMIN, RoleId.HOD, RoleId.MEMBER]}>
         <Layout title="Incidence Logs">
            <PageHeader
               subtitle="Facility incident reports — each report emails the focus department HOD and senior leadership"
               action={
                  isHod ? null : (
                     <AddIncidenceLog className="text-start w-full cursor-pointer">
                        <ActionButton variant="primary">+ New Report</ActionButton>
                     </AddIncidenceLog>
                  )
               }
            />

            <ListStatsStrip
               tiles={[
                  { label: 'Total', value: meta.totalItems, hint: 'Reports on record' },
                  { label: 'This Month', value: thisMonth, accent: '#F59E0B', hint: 'Filed this month' },
                  { label: 'Departments', value: uniqueDepartments, hint: 'Unique on this page' },
                  { label: 'Page', value: `${meta.currentPage} / ${Math.max(meta.totalPages, 1)}` },
               ]}
            />

            <DataTable
               columns={columns}
               data={allIncidenceLogsList ?? []}
               loading={IsRequestingIncidenceLogs}
               searchPlaceholder="Search by reporter..."
               filters={filters}
               filterValues={filterValues}
               onFilterChange={(k, v) => {
                  setFilterValues((prev) => ({ ...prev, [k]: v }));
                  setCurrentPage(1);
               }}
               onRefresh={() => fetchLogs(currentPage)}
               pagination={{
                  currentPage: meta.currentPage,
                  totalItems: meta.totalItems,
                  itemsPerPage: meta.itemsPerPage,
                  totalPages: meta.totalPages,
               }}
               onPageChange={setCurrentPage}
               emptyTitle="No incidence reports yet"
               emptyDescription="File your first incidence report with the button above."
            />

            {editLog && (
               <AddIncidenceLog
                  className=""
                  incidenceLog={editLog}
                  open={modalOpen}
                  onClose={() => {
                     setModalOpen(false);
                     setEditLog(null);
                  }}
               />
            )}

            <ConfirmDialog
               open={pendingDeactivate !== null}
               onClose={() => setPendingDeactivate(null)}
               onConfirm={confirmDeactivate}
               title={
                  pendingDeactivate
                     ? `Deactivate incidence report #${pendingDeactivate.id}?`
                     : ''
               }
               description="The report will be moved to inactive status."
               confirmLabel="Deactivate"
               tone="danger"
            />
         </Layout>
      </PrivateRoute>
   );
};

export default IncidenceLogsPage;
