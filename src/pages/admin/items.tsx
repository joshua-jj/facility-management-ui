import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';

import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import StatusChip from '@/components/StatusChip';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import AddItem from '@/components/Modals/AddItem';
import DeleteModal from '@/components/Modals/Delete';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';

import { RootState } from '@/redux/reducers';
import { appActions, departmentActions, itemActions, storeActions } from '@/actions';
import { Item } from '@/types';
import { RoleId, RoleIdValue } from '@/constants/roles.constant';
import { useDebounce } from '@/hooks/useDebounce';
import { exportToCsv } from '@/utilities/exportCsv';
import ExportModal from '@/components/ExportModal';
import { getObjectFromStorage } from '@/utilities/helpers';
import { NumberDisplay } from '@/components/FormatValue';
import { authConstants, itemConstants } from '@/constants';
import { AppEmitter } from '@/controllers/EventEmitter';
import { usePermissions } from '@/hooks/usePermissions';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

const VIEW_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EDIT_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const DELETE_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;

const DEPARTMENT_SCOPED_ROLES: RoleIdValue[] = [RoleId.HOD, RoleId.MEMBER];

const Items = () => {
   const router = useRouter();
   const dispatch = useDispatch();
   const { isBackOffice } = usePermissions();

   const [showAddModal, setShowAddModal] = useState(false);
   const [editItemData, setEditItemData] = useState<Item | null>(null);
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [deleteItemData, setDeleteItemData] = useState<Item | null>(null);
   const [showExportModal, setShowExportModal] = useState(false);
   const [isExporting, setIsExporting] = useState(false);
   const [filterValues, setFilterValues] = useState<Record<string, string>>({});

   const { userDetails } = useSelector((s: RootState) => s.user);
   const { IsRequestingAllItems, allItemsList, pagination } = useSelector((s: RootState) => s.item);
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);
   const { allStoresList } = useSelector((s: RootState) => s.store);

   const { meta } = pagination;
   const isDepartmentScoped = userDetails?.roleId !== undefined && DEPARTMENT_SCOPED_ROLES.includes(userDetails.roleId as RoleIdValue);

   // ── Fetch filter list data on mount ──

   useEffect(() => {
      dispatch(departmentActions.getAllDepartments({ limit: 1000 }) as unknown as UnknownAction);
      dispatch(storeActions.getStores({ limit: 1000 }) as unknown as UnknownAction);
   }, [dispatch]);

   // ── Data fetching ──

   const [searchQuery, setSearchQuery] = useState('');

   const fetchItems = useCallback(
      (page?: number, overrideFilters?: Record<string, string>) => {
         const active = overrideFilters ?? filterValues;
         if (isDepartmentScoped && userDetails?.departmentId !== undefined) {
            dispatch(
               itemActions.getDepartmentItems({
                  departmentId: userDetails.departmentId,
                  ...(page && { page }),
               }) as unknown as UnknownAction,
            );
         } else {
            dispatch(
               itemActions.getAllItems({
                  page: page ?? 1,
                  limit: 10,
                  ...(searchQuery && { search: searchQuery }),
                  ...(active.status && { status: active.status }),
                  ...(active.departmentId && { departmentId: Number(active.departmentId) }),
                  ...(active.storeId && { storeId: Number(active.storeId) }),
                  ...(active.fragile && { fragile: active.fragile }),
               }) as unknown as UnknownAction,
            );
         }
      },
      [dispatch, isDepartmentScoped, userDetails?.departmentId, filterValues, searchQuery],
   );

   useEffect(() => {
      fetchItems(1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   // Re-fetch current page after any mutation (create, update, delete)
   useEffect(() => {
      const events = [
         itemConstants.CREATE_ITEM_SUCCESS,
         itemConstants.CREATE_ITEMS_SUCCESS,
         itemConstants.UPDATE_ITEM_SUCCESS,
         itemConstants.DELETE_ITEM_SUCCESS,
      ];
      const listeners = events.map((evt) =>
         AppEmitter.addListener(evt, () => fetchItems(meta.currentPage)),
      );
      return () => listeners.forEach((l) => l.remove());
   }, [fetchItems, meta.currentPage]);

   // ── Search ──

   const debouncedFetch = useDebounce((query: string) => {
      if (isDepartmentScoped && userDetails?.departmentId !== undefined) {
         dispatch(
            itemActions.searchItem(
               { departmentId: userDetails.departmentId, text: query },
            ) as unknown as UnknownAction,
         );
      } else {
         dispatch(
            itemActions.getAllItems({
               page: 1,
               limit: 10,
               search: query,
               ...(filterValues.status && { status: filterValues.status }),
               ...(filterValues.departmentId && { departmentId: Number(filterValues.departmentId) }),
               ...(filterValues.storeId && { storeId: Number(filterValues.storeId) }),
               ...(filterValues.fragile && { fragile: filterValues.fragile }),
            }) as unknown as UnknownAction,
         );
      }
   });

   const handleSearch = useCallback(
      (query: string) => {
         setSearchQuery(query);
         if (!query) {
            fetchItems(1);
            return;
         }
         debouncedFetch(query);
      },
      [fetchItems, debouncedFetch],
   );

   // ── Pagination ──

   const handlePageChange = useCallback(
      (page: number) => {
         fetchItems(page);
      },
      [fetchItems],
   );

   // ── Export ──

   const handleExport = async (from: string, to: string) => {
      setIsExporting(true);
      try {
         const user = await getObjectFromStorage(authConstants.USER_KEY);
         let uri = `${itemConstants.ITEM_URI}/export`;
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

         exportToCsv('Items', rows, [
            { key: 'name', header: 'Item Name' },
            { key: 'department', header: 'Department', format: (v) => (v && typeof v === 'object' ? (v as Record<string, unknown>).name as string : String(v ?? '')) },
            { key: 'actualQuantity', header: 'Actual Quantity' },
            { key: 'availableQuantity', header: 'Available Quantity' },
            { key: 'fragile', header: 'Fragile', format: (v) => (v ? 'Yes' : 'No') },
            { key: 'trackingMode', header: 'Tracking Mode', format: (v) => (v === 'Serialized' ? 'Serialized' : 'Quantity') },
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

   // ── Filters ──

   const handleFilterChange = (key: string, value: string) => {
      const next = { ...filterValues, [key]: value };
      setFilterValues(next);
      // reset to page 1 on filter change and refetch server-side
      fetchItems(1, next);
   };

   const departmentOptions = useMemo(
      () => (allDepartmentsList ?? []).map((d: { id: number; name: string }) => ({ value: String(d.id), label: d.name })),
      [allDepartmentsList],
   );

   const storeOptions = useMemo(
      () => (allStoresList ?? []).map((s: { id: number; name: string }) => ({ value: String(s.id), label: s.name })),
      [allStoresList],
   );

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
         {
            key: 'fragile',
            label: 'Fragile',
            options: [
               { value: 'Y', label: 'Yes' },
               { value: 'N', label: 'No' },
            ],
         },
         {
            key: 'departmentId',
            label: 'Department',
            options: departmentOptions,
         },
         {
            key: 'storeId',
            label: 'Store',
            options: storeOptions,
         },
      ],
      [departmentOptions, storeOptions],
   );

   // Items come pre-filtered from server; use as-is
   const filteredItems = allItemsList ?? [];

   // ── Row actions ──

   const handleView = useCallback(
      (item: Item) => {
         router.push({ pathname: '/admin/item/[id]', query: { id: item.id } }, `/admin/item/${item.id}`);
      },
      [router],
   );

   const handleEdit = useCallback((item: Item) => {
      setEditItemData(item);
      setShowAddModal(true);
   }, []);

   const handleDelete = useCallback((item: Item) => {
      setDeleteItemData(item);
      setShowDeleteModal(true);
   }, []);

   const handleCloseAddModal = useCallback(() => {
      setShowAddModal(false);
      setEditItemData(null);
   }, []);

   const handleCloseDeleteModal = useCallback(() => {
      setShowDeleteModal(false);
      setDeleteItemData(null);
   }, []);

   const getActions = useCallback(
      (row: Item): ActionMenuItem[] => {
         const actions: ActionMenuItem[] = [
            {
               label: 'View',
               icon: VIEW_ICON,
               onClick: () => handleView(row),
            },
         ];
         // Per spec: only SUPER_ADMIN and ADMIN can edit or delete items.
         // HOD is view-only (list already filtered to their dept server-side).
         if (isBackOffice) {
            actions.push(
               {
                  label: 'Edit',
                  icon: EDIT_ICON,
                  onClick: () => handleEdit(row),
               },
               {
                  label: 'Delete',
                  icon: DELETE_ICON,
                  onClick: () => handleDelete(row),
                  variant: 'danger',
               },
            );
         }
         return actions;
      },
      [handleView, handleEdit, handleDelete, isBackOffice],
   );

   // ── Columns ──

   const columns: Column<Item>[] = useMemo(() => {
      const cols: Column<Item>[] = [
         {
            key: 'name',
            header: 'Item Name',
         },
         ...(!isDepartmentScoped
            ? [
                 {
                    key: 'department' as keyof Item,
                    header: 'Department',
                    render: (_: unknown, row: Item) => (
                       <span className="text-gray-600 dark:text-white/60">{row.department?.name || 'N/A'}</span>
                    ),
                 },
              ]
            : []),
         {
            key: 'actualQuantity',
            header: 'Quantity',
            align: 'center' as const,
            render: (value: unknown) => (
               <NumberDisplay value={value as number} className="font-medium text-[#0F2552] dark:text-white/80" />
            ),
         },
         {
            key: 'availableQuantity',
            header: 'Available',
            align: 'center' as const,
            render: (value: unknown) => (
               <NumberDisplay value={value as number} className="font-medium text-[#0F2552] dark:text-white/80" />
            ),
         },
         {
            key: 'fragile',
            header: 'Fragile',
            align: 'center' as const,
            render: (value: unknown) => <StatusChip status={value ? 'yes' : 'no'} size="sm" />,
         },
         {
            key: 'trackingMode' as keyof Item,
            header: 'Tracking',
            align: 'center' as const,
            render: (value: unknown) => (
               <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.6rem] font-semibold ${
                  value === 'Serialized'
                     ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                     : 'bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-white/40'
               }`}>
                  {value === 'Serialized' ? 'Serialized' : 'Quantity'}
               </span>
            ),
         },
         {
            key: 'createdBy' as keyof Item,
            header: 'Created By',
         },
         {
            key: 'updatedBy' as keyof Item,
            header: 'Modified By',
            render: (value: unknown) => <span>{String(value || '\u2014')}</span>,
         },
         {
            key: 'updatedAt' as keyof Item,
            header: 'Modified At',
            render: (value: unknown) => {
               if (!value) return <span>{'\u2014'}</span>;
               try { return <span>{format(parseISO(String(value)), 'MMM d, yyyy')}</span>; }
               catch { return <span>{'\u2014'}</span>; }
            },
         },
         {
            key: 'actions',
            header: 'Action',
            align: 'center' as const,
            width: '50px',
            render: (_: unknown, row: Item) => <ActionMenu items={getActions(row)} />,
         },
      ];
      return cols;
   }, [isDepartmentScoped, getActions]);

   // ── Render ──

   return (
      <PrivateRoute>
         <Layout title="Items">
            <PageHeader
               subtitle={`Manage your inventory items${isDepartmentScoped ? ' for your department' : ''}`}
               action={
                  isBackOffice ? (
                  <ActionButton
                     variant="primary"
                     onClick={() => setShowAddModal(true)}
                     icon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                     }
                  >
                     Add Item
                  </ActionButton>
                  ) : null
               }
            />

            <DataTable<Item>
               columns={columns}
               data={filteredItems}
               loading={IsRequestingAllItems}
               onSearch={handleSearch}
               onExport={() => setShowExportModal(true)}
               onRefresh={() => fetchItems(meta.currentPage)}
               searchPlaceholder="Search items..."
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
               emptyTitle="No items found"
               emptyDescription="Get started by adding your first inventory item."
               emptyAction={
                  <ActionButton variant="primary" onClick={() => setShowAddModal(true)}>
                     Add Item
                  </ActionButton>
               }
            />

            {/* Add / Edit Modal */}
            {showAddModal && (
               <AddItem
                  className="text-start w-full cursor-pointer"
                  item={editItemData}
                  open={showAddModal}
                  onClose={handleCloseAddModal}
               />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
               <DeleteModal
                  className="text-start w-full cursor-pointer"
                  itemId={deleteItemData?.id}
                  open={showDeleteModal}
                  onClose={handleCloseDeleteModal}
               />
            )}

            <ExportModal
               open={showExportModal}
               onClose={() => setShowExportModal(false)}
               onExport={handleExport}
               loading={isExporting}
               title="Export Items"
            />
         </Layout>
      </PrivateRoute>
   );
};

export default Items;
