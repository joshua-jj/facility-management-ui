import Layout from '@/components/Layout';
import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { userActions } from '@/actions/user.action';
import { UnknownAction } from 'redux';
import { Users } from '@/types/user';
import PrivateRoute from '@/components/PrivateRoute';
import { ADMIN_ROLES } from '@/constants/roles.constant';
import { useRouter } from 'next/router';
import { exportToXlsx } from '@/utilities/exportXlsx';

const RoleUsers = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const { id } = router.query;
   const roleId = id ? Number(id) : null;

   const [searchQuery, setSearchQuery] = useState('');
   const [filterValues, setFilterValues] = useState<Record<string, string>>({});
   const [currentPage, setCurrentPage] = useState(1);
   const PAGE_SIZE = 10;

   const { IsRequestingUsers, roleUsersList } = useSelector((s: RootState) => s.user);

   useEffect(() => {
      if (!roleId) return;
      dispatch(userActions.getUsersByRole({ roleId }) as unknown as UnknownAction);
   }, [dispatch, roleId]);

   const handleSearch = (query: string) => {
      setSearchQuery(query);
   };

   const filteredUsers = useMemo(() => {
      let list = roleUsersList ?? [];
      if (searchQuery) {
         const q = searchQuery.toLowerCase();
         list = list.filter(
            (u) =>
               u.firstName?.toLowerCase().includes(q) ||
               u.lastName?.toLowerCase().includes(q) ||
               u.email?.toLowerCase().includes(q),
         );
      }
      if (filterValues.status) {
         list = list.filter((u) => String(u.status) === filterValues.status);
      }
      return list;
   }, [roleUsersList, searchQuery, filterValues]);

   const totalItems = filteredUsers.length;
   const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
   const pageStart = (currentPage - 1) * PAGE_SIZE;
   const pagedUsers = filteredUsers.slice(pageStart, pageStart + PAGE_SIZE);

   useEffect(() => {
      if (currentPage > totalPages) setCurrentPage(1);
   }, [totalPages, currentPage]);

   const filters: FilterDef[] = [
      {
         key: 'status',
         label: 'Status',
         options: [
            { value: '', label: 'All' },
            { value: 'A', label: 'Active' },
            { value: 'I', label: 'Inactive' },
         ],
      },
   ];

   const handleFilterChange = (key: string, value: string) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
   };

   const handleExport = () => {
      exportToXlsx('Role Users', filteredUsers as unknown as Record<string, unknown>[], [
         { key: 'firstName', header: 'First Name' },
         { key: 'lastName', header: 'Last Name' },
         { key: 'email', header: 'Email' },
         { key: 'status', header: 'Status', format: (v) => (String(v) === 'A' ? 'Active' : 'Inactive') },
         { key: 'createdAt', header: 'Joined', width: 22, format: (v) => (v ? new Date(String(v)) : '') },
      ]);
   };

   const columns: Column<Users>[] = [
      {
         key: 'firstName',
         header: 'Name',
         render: (_, row) => (
            <span className="font-medium text-[#0F2552] dark:text-white/85">
               {row.firstName} {row.lastName}
            </span>
         ),
      },
      {
         key: 'email',
         header: 'Email',
         render: (value) => <span>{String(value || '\u2014')}</span>,
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
         key: 'createdAt',
         header: 'Joined',
         render: (value) => {
            if (!value) return <span>{'\u2014'}</span>;
            try {
               return <span>{format(parseISO(String(value)), 'MMM d, yyyy')}</span>;
            } catch {
               return <span>{'\u2014'}</span>;
            }
         },
      },
   ];

   return (
      <PrivateRoute allowedRoles={ADMIN_ROLES}>
         <Layout title="Role Users">
            <PageHeader
               title="Users in Role"
               subtitle={`${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''} assigned to this role`}
               action={
                  <div className="flex items-center gap-2">
                     <ActionButton variant="outline" onClick={() => router.push(`/admin/roles/${roleId}`)}>
                        Edit Role
                     </ActionButton>
                     <ActionButton variant="outline" onClick={() => router.push('/admin/roles')}>
                        Back to Roles
                     </ActionButton>
                  </div>
               }
            />

            <DataTable
               columns={columns}
               data={pagedUsers}
               loading={IsRequestingUsers}
               onSearch={handleSearch}
               searchPlaceholder="Search users..."
               filters={filters}
               filterValues={filterValues}
               onFilterChange={handleFilterChange}
               onExport={handleExport}
               pagination={{ currentPage, totalItems, itemsPerPage: PAGE_SIZE, totalPages }}
               onPageChange={setCurrentPage}
               emptyTitle="No users found"
               emptyDescription="No users are currently assigned to this role."
            />
         </Layout>
      </PrivateRoute>
   );
};

export default RoleUsers;
