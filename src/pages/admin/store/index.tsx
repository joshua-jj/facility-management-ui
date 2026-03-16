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
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import { ADMIN_ROLES } from '@/constants/roles.constant';
import { exportToCsv } from '@/utilities/exportCsv';
import ExportModal from '@/components/ExportModal';
import { getObjectFromStorage } from '@/utilities/helpers';
import { authConstants, storeConstants } from '@/constants';
import axios from 'axios';

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

   const { IsRequestingStores, allStoresList, pagination } = useSelector((s: RootState) => s.store);
   const { meta } = pagination;

   useEffect(() => {
      dispatch(storeActions.getStores() as unknown as UnknownAction);
   }, [dispatch]);

   const handlePageChange = (page: number) => {
      dispatch(storeActions.getStores({ page }) as unknown as UnknownAction);
   };

   const handleSearch = useCallback(
      (query: string) => {
         if (!query) {
            dispatch(storeActions.getStores() as unknown as UnknownAction);
         } else {
            dispatch(storeActions.searchStore({ text: query }) as unknown as UnknownAction);
         }
      },
      [dispatch],
   );

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

   const handleFilterChange = (key: string, value: string) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
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

   const filteredStores = useMemo(() => {
      let list = allStoresList ?? [];
      if (filterValues.status) {
         list = list.filter((store: Store) => {
            const isActive = String(store.status).toUpperCase() === 'A' || String(store.status).toUpperCase() === 'ACTIVE';
            return filterValues.status === 'A' ? isActive : !isActive;
         });
      }
      return list;
   }, [allStoresList, filterValues]);

   const handleUpdate = (data: Store) => {
      setEditStoreData(data);
      setShowEditModal(true);
   };

   const handleToggleStatus = (store: Store) => {
      const isActive = String(store.status).toUpperCase() === 'A' || String(store.status).toUpperCase() === 'ACTIVE';
      if (isActive) {
         dispatch(storeActions.deactivateStore({ ids: [store.id] }) as unknown as UnknownAction);
      } else {
         dispatch(storeActions.activateStore({ ids: [store.id] }) as unknown as UnknownAction);
      }
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

   return (
      <PrivateRoute allowedRoles={ADMIN_ROLES}>
         <Layout title="Stores">
            <PageHeader
               title="Stores"
               subtitle="Manage facility stores"
               action={<ActionButton onClick={() => setShowAddModal(true)}>Add Store</ActionButton>}
            />

            <DataTable
               columns={columns}
               data={filteredStores}
               loading={IsRequestingStores}
               onSearch={handleSearch}
               onExport={() => setShowExportModal(true)}
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
         </Layout>
      </PrivateRoute>
   );
};

export default Stores;
