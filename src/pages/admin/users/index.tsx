import Layout from '@/components/Layout';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import StatusChip from '@/components/StatusChip';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { RootState } from '@/redux/reducers';
import { appActions, departmentActions, roleActions, userActions } from '@/actions';
import { UnknownAction } from 'redux';
import { format, parseISO } from 'date-fns';
import { Users as User } from '@/types';
import PrivateRoute from '@/components/PrivateRoute';
import AddUser from '@/components/Modals/AddUser';
import UpdateRole from '@/components/Modals/UpdateRole';
import UserStatusModal from '@/components/Modals/UserStatus';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import { ADMIN_ROLES } from '@/constants/roles.constant';
import { exportToCsv } from '@/utilities/exportCsv';
import ExportModal from '@/components/ExportModal';
import { getObjectFromStorage } from '@/utilities/helpers';
import { PhoneDisplay } from '@/components/FormatValue';
import { authConstants, userConstants } from '@/constants';
import { AppEmitter } from '@/controllers/EventEmitter';
import axios from 'axios';

const PAGE_LIMIT = 10;

const EDIT_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const ROLE_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const TOGGLE_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>;

const VIEW_ICON = (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
   </svg>
);

const Users = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const [showAddUserModal, setShowAddUserModal] = useState(false);
   const [showEditUserModal, setShowEditUserModal] = useState(false);
   const [showUpdateUserRoleModal, setShowUpdateUserRoleModal] = useState(false);
   const [editUserData, setEditUserData] = useState<User | null>(null);
   const [showUserStatusModal, setShowUserStatusModal] = useState(false);
   const [userStatusAction, setUserStatusAction] = useState<'activate' | 'deactivate'>('deactivate');
   const [filterValues, setFilterValues] = useState<Record<string, string>>({});
   const [searchQuery, setSearchQuery] = useState('');
   const [currentPage, setCurrentPage] = useState(1);
   const [showExportModal, setShowExportModal] = useState(false);
   const [isExporting, setIsExporting] = useState(false);

   const { allRolesList } = useSelector((s: RootState) => s.role);
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);
   const { IsRequestingUsers, allUsersList, pagination } = useSelector((s: RootState) => s.user);
   const { meta } = pagination;

   useEffect(() => {
      // Fetch roles and departments for filter dropdowns
      dispatch(roleActions.getRoles({ limit: 1000 }) as unknown as UnknownAction);
      dispatch(departmentActions.getAllDepartments({ limit: 1000 }) as unknown as UnknownAction);
   }, [dispatch]);

   const fetchUsers = useCallback((page: number) => {
      dispatch(userActions.getUsers({
         page,
         limit: PAGE_LIMIT,
         search: searchQuery || undefined,
         status: filterValues.status || undefined,
         roleId: filterValues.roleId ? Number(filterValues.roleId) : undefined,
         departmentId: filterValues.departmentId ? Number(filterValues.departmentId) : undefined,
         gender: filterValues.gender || undefined,
      }) as unknown as UnknownAction);
   }, [dispatch, searchQuery, filterValues]);

   useEffect(() => {
      fetchUsers(currentPage);
   }, [fetchUsers, currentPage]);

   // Re-fetch current page after any mutation
   useEffect(() => {
      const events = [
         userConstants.CREATE_USER_SUCCESS,
         userConstants.UPDATE_USER_ROLE_SUCCESS,
         userConstants.ACTIVATE_USER_SUCCESS,
         userConstants.DEACTIVATE_USER_SUCCESS,
      ];
      const listeners = events.map((evt) =>
         AppEmitter.addListener(evt, () => fetchUsers(currentPage)),
      );
      return () => listeners.forEach((l) => l.remove());
   }, [currentPage, fetchUsers]);

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

   const handleUpdate = (data: User) => {
      setEditUserData(data);
      setShowEditUserModal(true);
   };

   const handleRole = (data: User) => {
      setEditUserData(data);
      setShowUpdateUserRoleModal(true);
   };

   const handleUserStatus = (user: User) => {
      setEditUserData(user);
      setUserStatusAction(user.status === 'A' ? 'deactivate' : 'activate');
      setShowUserStatusModal(true);
   };

   const handleExport = async (from: string, to: string) => {
      setIsExporting(true);
      try {
         const user = await getObjectFromStorage(authConstants.USER_KEY);
         let uri = `${userConstants.USER_URI}/export`;
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

         exportToCsv('Users', rows, [
            { key: 'firstName', header: 'First Name' },
            { key: 'lastName', header: 'Last Name' },
            { key: 'email', header: 'Email' },
            { key: 'phoneNumber', header: 'Phone' },
            { key: 'role', header: 'Role', format: (v) => (v && typeof v === 'object' ? (v as Record<string, unknown>).name as string : String(v ?? '')) },
            { key: 'isVerified', header: 'Verified', format: (v) => (v ? 'Yes' : 'No') },
            { key: 'status', header: 'Status', format: (v) => (v === 'A' ? 'Active' : 'Inactive') },
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

   const getActions = (row: User): ActionMenuItem[] => [
      {
         label: 'View',
         icon: VIEW_ICON,
         onClick: () => router.push(`/admin/users/${row.id}`),
      },
      {
         label: 'Edit',
         icon: EDIT_ICON,
         onClick: () => handleUpdate(row),
      },
      {
         label: 'Change Role',
         icon: ROLE_ICON,
         onClick: () => handleRole(row),
      },
      {
         label: row.status === 'A' ? 'Deactivate' : 'Activate',
         icon: TOGGLE_ICON,
         onClick: () => handleUserStatus(row),
         variant: row.status === 'A' ? 'danger' : 'default',
      },
   ];

   const filters: FilterDef[] = useMemo(
      () => [
         {
            key: 'roleId',
            label: 'Role',
            options: (allRolesList ?? []).map((r) => ({
               value: String(r.id),
               label: r.name,
            })),
         },
         {
            key: 'departmentId',
            label: 'Department',
            options: (allDepartmentsList ?? []).map((d) => ({
               value: String(d.id),
               label: d.name,
            })),
         },
         {
            key: 'status',
            label: 'Status',
            options: [
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
      ],
      [allRolesList, allDepartmentsList],
   );

   const filteredUsers = useMemo(() => allUsersList ?? [], [allUsersList]);

   const columns: Column<User>[] = [
      {
         key: 'fullName',
         header: 'Full Name',
         render: (_, row) => (
            <span className="font-medium text-[#0F2552] dark:text-white/85">
               {row.firstName} {row.lastName}
            </span>
         ),
      },
      {
         key: 'email',
         header: 'Email',
      },
      {
         key: 'phoneNumber',
         header: 'Phone',
         render: (value) => <PhoneDisplay value={String(value ?? '')} />,
      },
      {
         key: 'role',
         header: 'Role',
         render: (_, row) => (
            <StatusChip status={row.role?.name?.toLowerCase() ?? 'default'} size="sm" />
         ),
      },
      {
         key: 'isVerified',
         header: 'Verified',
         align: 'center',
         render: (_, row) => <StatusChip status={row.isVerified ? 'verified' : 'unverified'} size="sm" />,
      },
      {
         key: 'status',
         header: 'Status',
         align: 'center',
         render: (_, row) => (
            <StatusChip status={row.status === 'A' ? 'active' : 'inactive'} size="sm" pulse />
         ),
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
         key: 'actions',
         header: '',
         align: 'center',
         width: '50px',
         render: (_, row) => <ActionMenu items={getActions(row)} />,
      },
   ];

   return (
      <PrivateRoute allowedRoles={ADMIN_ROLES}>
         <Layout title="Users">
            <PageHeader
               subtitle={`${meta?.totalItems ?? 0} total users`}
               action={
                  <ActionButton variant="primary" onClick={() => setShowAddUserModal(true)}>
                     + Add User
                  </ActionButton>
               }
            />

            <DataTable
               columns={columns}
               data={filteredUsers}
               loading={IsRequestingUsers}
               onSearch={handleSearch}
               onExport={() => setShowExportModal(true)}
               onRefresh={() => fetchUsers(currentPage)}
               searchPlaceholder="Search users by name, email..."
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
               emptyTitle="No users found"
               emptyDescription="Get started by adding your first user."
            />

            {/* Add User Modal (create) */}
            {showAddUserModal && (
               <AddUser
                  className="text-start w-full cursor-pointer"
                  open={showAddUserModal}
                  onClose={() => setShowAddUserModal(false)}
               />
            )}

            {/* Edit User Modal */}
            {showEditUserModal && (
               <AddUser
                  className="text-start w-full cursor-pointer"
                  user={editUserData}
                  open={showEditUserModal}
                  onClose={() => setShowEditUserModal(false)}
               />
            )}

            {/* Update Role Modal */}
            {showUpdateUserRoleModal && (
               <UpdateRole
                  className="text-start w-full cursor-pointer"
                  user={editUserData}
                  open={showUpdateUserRoleModal}
                  onClose={() => setShowUpdateUserRoleModal(false)}
               />
            )}

            {/* User Status Modal */}
            {showUserStatusModal && editUserData && (
               <UserStatusModal
                  className="hidden"
                  open={showUserStatusModal}
                  userId={editUserData.id}
                  userName={`${editUserData.firstName} ${editUserData.lastName}`}
                  action={userStatusAction}
                  onClose={() => {
                     setShowUserStatusModal(false);
                     setEditUserData(null);
                  }}
               />
            )}

            <ExportModal
               open={showExportModal}
               onClose={() => setShowExportModal(false)}
               onExport={handleExport}
               loading={isExporting}
               title="Export Users"
            />
         </Layout>
      </PrivateRoute>
   );
};

export default Users;
