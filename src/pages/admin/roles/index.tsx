import Layout from '@/components/Layout';
import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { DataTable, Column } from '@/components/DataTable';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { roleActions } from '@/actions/role.action';
import { UnknownAction } from 'redux';
import { Role } from '@/types/role';
import PrivateRoute from '@/components/PrivateRoute';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import { ADMIN_ROLES } from '@/constants/roles.constant';
import { useRouter } from 'next/router';

const PAGE_LIMIT = 10;

const EDIT_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
   </svg>
);

const USERS_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

const Roles = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const [searchQuery, setSearchQuery] = useState('');
   const [currentPage, setCurrentPage] = useState(1);

   const { IsRequestingRoles, allRolesList, pagination } = useSelector(
      (s: RootState) => s.role,
   );
   const { meta } = pagination;

   useEffect(() => {
      dispatch(roleActions.getRoles({ page: currentPage, limit: PAGE_LIMIT }) as unknown as UnknownAction);
   }, [dispatch, currentPage]);

   const handlePageChange = (page: number) => {
      setCurrentPage(page);
   };

   const handleSearch = (query: string) => {
      setSearchQuery(query);
   };

   const filteredRoles = useMemo(() => {
      let list = allRolesList ?? [];
      if (searchQuery) {
         const q = searchQuery.toLowerCase();
         list = list.filter(
            (r) => r.name?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q),
         );
      }
      return list;
   }, [allRolesList, searchQuery]);

   const handleDelete = (row: Role) => {
      if (!window.confirm(`Deactivate role "${row.name}"?`)) return;
      dispatch(roleActions.deleteRole(row.id) as unknown as UnknownAction);
   };

   const getActions = (row: Role): ActionMenuItem[] => [
      {
         label: 'Edit / Permissions',
         icon: EDIT_ICON,
         onClick: () => router.push(`/admin/roles/${row.id}`),
      },
      {
         label: 'View Users',
         icon: USERS_ICON,
         onClick: () => router.push(`/admin/roles/${row.id}/users`),
      },
      {
         label: 'Deactivate',
         icon: DELETE_ICON,
         onClick: () => handleDelete(row),
         variant: 'danger',
      },
   ];

   const columns: Column<Role>[] = [
      {
         key: 'name',
         header: 'Name',
         render: (_, row) => <span className="font-medium text-[#0F2552] dark:text-white/85">{row.name}</span>,
      },
      {
         key: 'description',
         header: 'Description',
         render: (value) => <span>{String(value || '\u2014')}</span>,
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
         <Layout title="Roles">
            <PageHeader
               title="Roles"
               subtitle={`${meta.totalItems} role${meta.totalItems !== 1 ? 's' : ''}`}
               action={
                  <ActionButton variant="primary" onClick={() => router.push('/admin/roles/new')}>
                     + Create Role
                  </ActionButton>
               }
            />

            <DataTable
               columns={columns}
               data={filteredRoles}
               loading={IsRequestingRoles}
               onSearch={handleSearch}
               searchPlaceholder="Search roles..."
               emptyTitle="No roles found"
               emptyDescription="Get started by creating your first role."
               pagination={{
                  currentPage: meta.currentPage,
                  totalItems: meta.totalItems,
                  itemsPerPage: meta.itemsPerPage,
                  totalPages: meta.totalPages,
               }}
               onPageChange={handlePageChange}
            />
         </Layout>
      </PrivateRoute>
   );
};

export default Roles;
