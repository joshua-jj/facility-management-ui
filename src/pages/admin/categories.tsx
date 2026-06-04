import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';

import Layout from '@/components/Layout';
import type { NextPageWithLayout } from '@/types/next-page-with-layout';
import PrivateRoute from '@/components/PrivateRoute';
import { DataTable, Column } from '@/components/DataTable';
import StatusChip from '@/components/StatusChip';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import AddCategory from '@/components/Modals/AddCategory';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';

import { RootState } from '@/redux/reducers';
import { appActions, categoryActions } from '@/actions';
import { Category } from '@/types';
import { categoryConstants } from '@/constants';
import { AppEmitter } from '@/controllers/EventEmitter';
import { usePermission } from '@/hooks/usePermission';
import { Permission } from '@/constants/permissions.enum';

const EDIT_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
   </svg>
);
const DELETE_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
   </svg>
);

const Categories: NextPageWithLayout = () => {
   const dispatch = useDispatch();
   const { can } = usePermission();
   const canWriteCategories = can(Permission.CATEGORIES_WRITE);
   const canDeleteCategories = can(Permission.CATEGORIES_DELETE);

   const [showAddModal, setShowAddModal] = useState(false);
   const [editCategoryData, setEditCategoryData] = useState<Category | null>(null);

   const { IsRequestingCategories, allCategoriesList, IsMutatingCategory } = useSelector(
      (s: RootState) => s.category,
   );

   // ── Fetch on mount ──

   useEffect(() => {
      dispatch(categoryActions.getCategories() as unknown as UnknownAction);
   }, [dispatch]);

   // ── Re-fetch after any mutation ──

   useEffect(() => {
      const events = [
         categoryConstants.CREATE_CATEGORY_SUCCESS,
         categoryConstants.UPDATE_CATEGORY_SUCCESS,
         categoryConstants.DELETE_CATEGORY_SUCCESS,
      ];
      const listeners = events.map((evt) =>
         AppEmitter.addListener(evt, () => {
            dispatch(categoryActions.getCategories() as unknown as UnknownAction);
         }),
      );
      return () => listeners.forEach((l) => l.remove());
   }, [dispatch]);

   // ── Row actions ──

   const handleEdit = useCallback((row: Category) => {
      setEditCategoryData(row);
      setShowAddModal(true);
   }, []);

   const handleDelete = useCallback(
      (row: Category) => {
         if (row.isSystem) return;
         dispatch(
            appActions.setSnackBar({
               type: 'warning',
               message: `Deleting category "${row.name}"…`,
               variant: 'warning',
            }) as unknown as UnknownAction,
         );
         dispatch(categoryActions.deleteCategory({ id: row.id }) as unknown as UnknownAction);
      },
      [dispatch],
   );

   const handleCloseAddModal = useCallback(() => {
      setShowAddModal(false);
      setEditCategoryData(null);
   }, []);

   const getActions = useCallback(
      (row: Category): ActionMenuItem[] => {
         const actions: ActionMenuItem[] = [];
         if (canWriteCategories) {
            actions.push({
               label: 'Edit',
               icon: EDIT_ICON,
               onClick: () => handleEdit(row),
            });
         }
         if (canDeleteCategories && !row.isSystem) {
            actions.push({
               label: 'Delete',
               icon: DELETE_ICON,
               onClick: () => handleDelete(row),
               variant: 'danger',
            });
         }
         return actions;
      },
      [canWriteCategories, canDeleteCategories, handleEdit, handleDelete],
   );

   // ── Columns ──

   const columns: Column<Category>[] = useMemo(
      () => [
         {
            key: 'name',
            header: 'Category',
         },
         {
            key: 'description',
            header: 'Description',
            render: (value: unknown) => (
               <span style={{ color: 'var(--text-secondary)' }}>{String(value || '—')}</span>
            ),
         },
         {
            key: 'status',
            header: 'Status',
            align: 'center' as const,
            render: (_: unknown, row: Category) => (
               <StatusChip status={row.status === 'I' ? 'inactive' : 'active'} size="sm" />
            ),
         },
         {
            key: 'actions',
            header: 'Action',
            align: 'center' as const,
            width: '50px',
            render: (_: unknown, row: Category) => {
               const items = getActions(row);
               if (items.length === 0) return <span style={{ color: 'var(--text-hint)' }}>—</span>;
               return <ActionMenu items={items} />;
            },
         },
      ],
      [getActions],
   );

   // ── Render ──

   return (
      <>
         <PageHeader
            action={
               canWriteCategories ? (
                  <ActionButton
                     variant="primary"
                     onClick={() => setShowAddModal(true)}
                     icon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                     }
                  >
                     Add Category
                  </ActionButton>
               ) : null
            }
         />

         <DataTable<Category>
            columns={columns}
            data={allCategoriesList ?? []}
            loading={IsRequestingCategories || IsMutatingCategory}
            onRefresh={() => dispatch(categoryActions.getCategories() as unknown as UnknownAction)}
            searchPlaceholder="Search categories..."
            emptyTitle="No categories found"
            emptyDescription="Get started by adding your first category."
            emptyAction={
               canWriteCategories ? (
                  <ActionButton variant="primary" onClick={() => setShowAddModal(true)}>
                     Add Category
                  </ActionButton>
               ) : undefined
            }
         />

         {/* Add / Edit Modal */}
         {showAddModal && (
            <AddCategory
               className="text-start w-full cursor-pointer"
               category={editCategoryData}
               open={showAddModal}
               onClose={handleCloseAddModal}
            />
         )}
      </>
   );
};

Categories.getLayout = (page) => (
   <PrivateRoute permissions={[Permission.CATEGORIES_READ]}>
      <Layout title="Categories">{page}</Layout>
   </PrivateRoute>
);

export default Categories;
