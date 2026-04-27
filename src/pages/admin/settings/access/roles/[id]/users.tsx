import Layout from '@/components/Layout';
import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import UpdateRole from '@/components/Modals/UpdateRole';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { userActions } from '@/actions/user.action';
import { departmentActions } from '@/actions';
import { UnknownAction } from 'redux';
import { Users } from '@/types/user';
import PrivateRoute from '@/components/PrivateRoute';
import { ADMIN_ROLES } from '@/constants/roles.constant';
import { useRouter } from 'next/router';
import { exportToXlsx } from '@/utilities/exportXlsx';

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

const RoleUsers = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const { id } = router.query;
   const roleId = id ? Number(id) : null;

   const [searchQuery, setSearchQuery] = useState('');
   const [filterValues, setFilterValues] = useState<Record<string, string>>({});
   const [currentPage, setCurrentPage] = useState(1);
   const [editRoleUser, setEditRoleUser] = useState<Users | null>(null);
   const PAGE_SIZE = 10;

   const getActions = (row: Users): ActionMenuItem[] => [
      {
         label: 'View',
         icon: VIEW_ICON,
         onClick: () => router.push(`/admin/users/${row.id}`),
      },
      {
         label: 'Edit Role',
         icon: EDIT_ICON,
         onClick: () => setEditRoleUser(row),
      },
   ];

   const { IsRequestingUsers, roleUsersList } = useSelector((s: RootState) => s.user);
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);

   useEffect(() => {
      if (!roleId) return;
      dispatch(userActions.getUsersByRole({ roleId }) as unknown as UnknownAction);
      dispatch(departmentActions.getAllDepartments({ limit: 1000 }) as unknown as UnknownAction);
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
               u.email?.toLowerCase().includes(q) ||
               u.phoneNumber?.toLowerCase().includes(q),
         );
      }
      if (filterValues.status) {
         list = list.filter((u) => String(u.status) === filterValues.status);
      }
      if (filterValues.gender) {
         list = list.filter((u) => String(u.gender) === filterValues.gender);
      }
      if (filterValues.departmentId) {
         list = list.filter((u) => {
            const u2 = u as unknown as { department?: { id?: number }; departmentId?: number };
            const deptId = u2.department?.id ?? u2.departmentId;
            return String(deptId) === filterValues.departmentId;
         });
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

   const filters: FilterDef[] = useMemo(
      () => [
         {
            key: 'status',
            label: 'Status',
            options: [
               { value: '', label: 'All' },
               { value: 'A', label: 'Active' },
               { value: 'I', label: 'Inactive' },
            ],
         },
         {
            key: 'gender',
            label: 'Gender',
            options: [
               { value: 'Male', label: 'Male' },
               { value: 'Female', label: 'Female' },
               { value: 'None Specified', label: 'Not Specified' },
            ],
         },
         {
            key: 'departmentId',
            label: 'Department',
            options: (allDepartmentsList ?? []).map((d: { id: number; name: string }) => ({
               value: String(d.id),
               label: d.name,
            })),
         },
      ],
      [allDepartmentsList],
   );

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
      {
         key: 'id',
         header: 'Action',
         width: '50px',
         align: 'center',
         render: (_value, row) => <ActionMenu items={getActions(row)} />,
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
                     <ActionButton variant="outline" onClick={() => router.push(`/admin/settings/access/roles/${roleId}`)}>
                        Edit Role
                     </ActionButton>
                     <ActionButton variant="outline" onClick={() => router.push('/admin/settings/access')}>
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

            <UpdateRole
               className=""
               user={editRoleUser}
               open={!!editRoleUser}
               onClose={() => setEditRoleUser(null)}
            />
         </Layout>
      </PrivateRoute>
   );
};

export default RoleUsers;
