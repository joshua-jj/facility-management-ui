import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import { RootState } from '@/redux/reducers';
import { appActions, storeActions } from '@/actions';
import { Store } from '@/types';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import StatusChip from '@/components/StatusChip';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import AddStore from '@/components/Modals/AddStore';
import ListStatsStrip from '@/components/ListStatsStrip';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ADMIN_ROLES } from '@/constants/roles.constant';
import { exportToCsv } from '@/utilities/exportCsv';
import ExportModal from '@/components/ExportModal';
import { getObjectFromStorage } from '@/utilities/helpers';
import { authConstants, storeConstants } from '@/constants';
import { AppEmitter } from '@/controllers/EventEmitter';
import axios from 'axios';

const PAGE_LIMIT = 10;

const EDIT_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TOGGLE_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>;

const VIEW_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
   </svg>
);

const Stores = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const [showAddModal, setShowAddModal] = useState(false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [editStoreData, setEditStoreData] = useState<Store | null>(null);
   const [showExportModal, setShowExportModal] = useState(false);
   const [isExporting, setIsExporting] = useState(false);
   const [filterValues, setFilterValues] = useState<Record<string, string>>({});
   const [searchQuery, setSearchQuery] = useState('');
   const [currentPage, setCurrentPage] = useState(1);
   const [pendingDeactivate, setPendingDeactivate] = useState<Store | null>(null);

   const { IsRequestingStores, allStoresList, pagination } = useSelector((s: RootState) => s.store);
   const { meta } = pagination;

   const fetchStores = useCallback((page: number) => {
      dispatch(storeActions.getStores({
         page,
         limit: PAGE_LIMIT,
         search: searchQuery || undefined,
         status: filterValues.status || undefined,
      }) as unknown as UnknownAction);
   }, [dispatch, searchQuery, filterValues]);

   useEffect(() => {
      fetchStores(currentPage);
   }, [fetchStores, currentPage]);

   // Re-fetch current page after any mutation
   useEffect(() => {
      const events = [
         storeConstants.CREATE_STORE_SUCCESS,
         storeConstants.UPDATE_STORE_SUCCESS,
         storeConstants.ACTIVATE_STORE_SUCCESS,
         storeConstants.DEACTIVATE_STORE_SUCCESS,
      ];
      const listeners = events.map((evt) =>
         AppEmitter.addListener(evt, () => fetchStores(currentPage)),
      );
      return () => listeners.forEach((l) => l.remove());
   }, [currentPage, fetchStores]);

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

   const handleExport = async (from: string, to: string) => {
      setIsExporting(true);
      try {
         const user = await getObjectFromStorage(authConstants.USER_KEY);
         let uri = `${storeConstants.STORE_URI}/export`;
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

         exportToCsv('Stores', rows, [
            { key: 'name', header: 'Store Name' },
            { key: 'status', header: 'Status', format: (v) => (String(v).toUpperCase() === 'A' || String(v).toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive') },
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

   const filteredStores = useMemo(() => allStoresList ?? [], [allStoresList]);

   const handleUpdate = (data: Store) => {
      setEditStoreData(data);
      setShowEditModal(true);
   };

   const handleToggleStatus = (store: Store) => {
      const isActive = String(store.status).toUpperCase() === 'A' || String(store.status).toUpperCase() === 'ACTIVE';
      if (isActive) {
         setPendingDeactivate(store);
      } else {
         dispatch(storeActions.activateStore({ ids: [store.id] }) as unknown as UnknownAction);
      }
   };

   const confirmDeactivate = () => {
      if (!pendingDeactivate) return;
      dispatch(
         storeActions.deactivateStore({ ids: [pendingDeactivate.id] }) as unknown as UnknownAction,
      );
      setPendingDeactivate(null);
   };

   const getActions = (row: Store): ActionMenuItem[] => {
      const isActive = String(row.status).toUpperCase() === 'A' || String(row.status).toUpperCase() === 'ACTIVE';
      return [
         {
            label: 'View',
            icon: VIEW_ICON,
            onClick: () => router.push(`/admin/store/${row.id}`),
         },
         {
            label: 'Edit',
            icon: EDIT_ICON,
            onClick: () => handleUpdate(row),
         },
         {
            label: isActive ? 'Deactivate' : 'Activate',
            icon: TOGGLE_ICON,
            onClick: () => handleToggleStatus(row),
            variant: isActive ? 'danger' : 'default',
         },
      ];
   };

   const columns: Column<Store>[] = [
      {
         key: 'name',
         header: 'Store Name',
         render: (value) => <span className="font-medium">{String(value)}</span>,
      },
      {
         key: 'status',
         header: 'Status',
         render: (value) => <StatusChip status={String(value ?? '')} />,
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

   const activeStoreCount = filteredStores.filter(
      (s) => String(s.status).toUpperCase() === 'A' || String(s.status).toUpperCase() === 'ACTIVE',
   ).length;
   const inactiveStoreCount = filteredStores.length - activeStoreCount;

   return (
      <PrivateRoute allowedRoles={ADMIN_ROLES}>
         <Layout title="Stores">
            <PageHeader
               subtitle="Manage facility stores and storage locations"
               action={<ActionButton onClick={() => setShowAddModal(true)}>Add Store</ActionButton>}
            />

            <ListStatsStrip
               tiles={[
                  { label: 'Total', value: meta.totalItems, hint: 'Stores' },
                  { label: 'Active', value: activeStoreCount, accent: '#10B981', hint: 'On this page' },
                  { label: 'Inactive', value: inactiveStoreCount, accent: '#EF4444', hint: 'On this page' },
                  { label: 'Page', value: `${meta.currentPage} / ${Math.max(meta.totalPages, 1)}` },
               ]}
            />

            <DataTable
               columns={columns}
               data={filteredStores}
               loading={IsRequestingStores}
               onSearch={handleSearch}
               onExport={() => setShowExportModal(true)}
               onRefresh={() => fetchStores(currentPage)}
               searchPlaceholder="Search stores..."
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
               emptyTitle="No stores found"
               emptyDescription="Get started by adding your first store."
            />

            {showAddModal && (
               <AddStore
                  className="text-start w-full cursor-pointer"
                  open={showAddModal}
                  onClose={() => setShowAddModal(false)}
               />
            )}

            {showEditModal && (
               <AddStore
                  className="text-start w-full cursor-pointer"
                  store={editStoreData}
                  open={showEditModal}
                  onClose={() => setShowEditModal(false)}
               />
            )}

            <ExportModal
               open={showExportModal}
               onClose={() => setShowExportModal(false)}
               onExport={handleExport}
               loading={isExporting}
               title="Export Stores"
            />

            <ConfirmDialog
               open={pendingDeactivate !== null}
               onClose={() => setPendingDeactivate(null)}
               onConfirm={confirmDeactivate}
               title={
                  pendingDeactivate
                     ? `Deactivate store "${pendingDeactivate.name}"?`
                     : ''
               }
               description="It will no longer be available for item assignments. You can reactivate it later."
               confirmLabel="Deactivate"
               tone="danger"
            />
         </Layout>
      </PrivateRoute>
   );
};

export default Stores;
