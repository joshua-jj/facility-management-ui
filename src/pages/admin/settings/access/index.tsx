import React, { FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import SettingsShell from '@/components/SettingsShell';
import RolePreview from '@/components/Modals/RolePreview';
import RoleEdit from '@/components/Modals/RoleEdit';
import TableSkeletonRow from '@/components/TableSkeletonRow';
import ActionMenu, { ActionMenuItem } from '@/components/ActionMenu';
import { RootState } from '@/redux/reducers';
import { roleActions } from '@/actions/role.action';
import { Role } from '@/types/role';

const PAGE_SIZE = 10;

// Row-action icons. Match the inline SVGs the rest of the app uses
// (see `pages/admin/requests.tsx`) so the kebab menus look uniform
// across Requests, Items, Roles, Workflows, etc.
const VIEW_ICON = (
   <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
   >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
   </svg>
);
const EDIT_ICON = (
   <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
   >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
   </svg>
);

/** Letter avatar — gold-tinted circle with the first letter of the role name */
const LetterAvatar: FC<{ name: string }> = ({ name }) => {
   const letter = (name?.trim()?.[0] ?? '?').toUpperCase();
   return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#B28309]/15 text-[#B28309] text-xs font-bold">
         {letter}
      </span>
   );
};

const formatDate = (iso: string | undefined | null) => {
   if (!iso) return '-';
   try {
      return new Date(iso).toLocaleDateString('en-US', {
         month: 'short',
         day: '2-digit',
         year: 'numeric',
      });
   } catch {
      return iso;
   }
};

const RolesAndPermissions: FC = () => {
   const dispatch = useDispatch();
   const pagedRoles = useSelector((s: RootState) => s.role.allRolesList) as Role[];
   const meta = useSelector((s: RootState) => s.role.pagination.meta);
   const loading = useSelector((s: RootState) => s.role.IsRequestingRoles) as boolean;

   const [search, setSearch] = useState('');
   const [debouncedSearch, setDebouncedSearch] = useState('');
   const [page, setPage] = useState(1);
   const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
   const [previewingRoleId, setPreviewingRoleId] = useState<number | null>(null);
   const [isCreating, setIsCreating] = useState(false);

   /** Debounce search term so server isn't hit on every keystroke */
   useEffect(() => {
      const id = setTimeout(() => setDebouncedSearch(search.trim()), 300);
      return () => clearTimeout(id);
   }, [search]);

   /** Reset to page 1 whenever the search changes */
   useEffect(() => {
      setPage(1);
   }, [debouncedSearch]);

   /** Fetch whenever page or debounced search changes */
   useEffect(() => {
      dispatch(
         roleActions.getRoles({
            page,
            limit: PAGE_SIZE,
            search: debouncedSearch || undefined,
         }) as unknown as UnknownAction,
      );
   }, [dispatch, page, debouncedSearch]);

   const totalItems = meta?.totalItems ?? 0;
   const totalPages = Math.max(1, meta?.totalPages ?? 1);
   const currentPage = meta?.currentPage ?? page;
   const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
   const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalItems);

   const handleRefresh = () => {
      dispatch(
         roleActions.getRoles({
            page,
            limit: PAGE_SIZE,
            search: debouncedSearch || undefined,
         }) as unknown as UnknownAction,
      );
   };

   return (
      <PrivateRoute>
         <Layout title="Roles and Permissions">
            <SettingsShell active="access">
               <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                     <div>
                        <h2 className="text-lg font-bold text-[#0F2552] dark:text-white/90">
                           Roles and Permission
                        </h2>
                     </div>
                     <div className="flex gap-2">
                        <button
                           onClick={handleRefresh}
                           className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#B28309] text-[#B28309] text-xs font-semibold hover:bg-[#B28309]/10 cursor-pointer"
                        >
                           ↻ Refresh
                        </button>
                        <button
                           onClick={() => setIsCreating(true)}
                           className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B28309] text-white text-xs font-semibold hover:bg-[#9a7208] cursor-pointer"
                        >
                           + Add Role and Permission
                        </button>
                     </div>
                  </div>

                  {/* Search */}
                  <div className="relative">
                     <input
                        type="text"
                        placeholder="Search roles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-2.5 pl-10 rounded-lg bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 text-sm text-[#0F2552] dark:text-white/90 focus:outline-none focus:border-[#B28309]"
                     />
                     <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                  </div>

                  {/* Table — fixed-height viewport so the body doesn't
                      collapse on short pages or while loading. Mirrors the
                      shared DataTable behaviour. */}
                  <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 overflow-hidden">
                     <div
                        className="overflow-auto"
                        style={{
                           minHeight: `${PAGE_SIZE * 56}px`,
                           maxHeight: '65vh',
                        }}
                     >
                        <table className="w-full">
                           <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                              <tr className="text-[0.65rem] uppercase tracking-wider text-gray-400 dark:text-white/40 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#0F1A33]">
                                 <th className="px-6 py-3 text-left font-semibold w-[55%] bg-inherit">Role Name</th>
                                 <th className="px-6 py-3 text-left font-semibold w-[30%] bg-inherit">Created</th>
                                 <th className="px-6 py-3 text-right font-semibold w-[15%] bg-inherit">Actions</th>
                              </tr>
                           </thead>
                           <tbody>
                              {loading &&
                                 // Match page size so loading and loaded
                                 // states occupy the same vertical footprint.
                                 Array.from({ length: PAGE_SIZE }).map((_, i) => (
                                    <TableSkeletonRow
                                       key={`sk-${i}`}
                                       cols={3}
                                       widths={['60%', '35%', '40%']}
                                    />
                                 ))}
                           {!loading && pagedRoles.length === 0 && (
                              <tr>
                                 <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                                    No roles found.
                                 </td>
                              </tr>
                           )}
                           {!loading &&
                              pagedRoles.map((role) => (
                                 <tr
                                    key={role.id}
                                    className="border-b border-gray-100 dark:border-white/5 last:border-0"
                                 >
                                    <td className="px-6 py-4 text-left align-middle">
                                       <div className="flex items-center gap-3">
                                          <LetterAvatar name={role.name} />
                                          <span className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                                             {role.name}
                                          </span>
                                          {role.preset && (
                                             <span className="text-[0.6rem] uppercase font-bold px-2 py-0.5 rounded bg-[#B28309]/15 text-[#B28309]">
                                                Preset
                                             </span>
                                          )}
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 text-left align-middle text-sm text-gray-500 dark:text-white/60">
                                       {formatDate(role.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 text-right align-middle whitespace-nowrap">
                                       <div className="inline-flex justify-end">
                                          <ActionMenu
                                             items={
                                                [
                                                   {
                                                      label: 'Preview',
                                                      icon: VIEW_ICON,
                                                      onClick: () =>
                                                         setPreviewingRoleId(role.id),
                                                   },
                                                   // Edit is available for every role,
                                                   // preset or custom. The Super Admin
                                                   // is the source of truth for what
                                                   // each role can do — the seeder only
                                                   // bootstraps preset roles on initial
                                                   // create and won't rewrite their
                                                   // permission lists on subsequent
                                                   // runs (so UI edits stick).
                                                   {
                                                      label: 'Edit',
                                                      icon: EDIT_ICON,
                                                      onClick: () =>
                                                         setEditingRoleId(role.id),
                                                   },
                                                ] satisfies ActionMenuItem[]
                                             }
                                          />
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  {/* Pagination — always visible, server-side meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/60">
                     <span>
                        Showing {rangeStart} to {rangeEnd} of {totalItems} results
                     </span>
                     <div className="flex gap-1 items-center">
                        <button
                           onClick={() => setPage(1)}
                           disabled={page === 1}
                           className="px-3 py-1.5 rounded border border-gray-200 dark:border-white/10 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                           aria-label="First page"
                        >
                           «
                        </button>
                        <button
                           onClick={() => setPage((p) => Math.max(1, p - 1))}
                           disabled={page === 1}
                           className="px-3 py-1.5 rounded border border-gray-200 dark:border-white/10 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                           aria-label="Previous page"
                        >
                           ‹
                        </button>
                        <span className="px-3 py-1.5">
                           Page {currentPage} of {totalPages}
                        </span>
                        <button
                           onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                           disabled={page >= totalPages}
                           className="px-3 py-1.5 rounded border border-gray-200 dark:border-white/10 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                           aria-label="Next page"
                        >
                           ›
                        </button>
                        <button
                           onClick={() => setPage(totalPages)}
                           disabled={page >= totalPages}
                           className="px-3 py-1.5 rounded border border-gray-200 dark:border-white/10 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                           aria-label="Last page"
                        >
                           »
                        </button>
                     </div>
                  </div>
               </div>

               {/* Modals */}
               <RoleEdit
                  roleId={isCreating ? null : editingRoleId}
                  isOpen={isCreating || editingRoleId != null}
                  onClose={() => {
                     setIsCreating(false);
                     setEditingRoleId(null);
                  }}
               />
               <RolePreview
                  roleId={previewingRoleId}
                  isOpen={previewingRoleId != null}
                  onClose={() => setPreviewingRoleId(null)}
               />
            </SettingsShell>
         </Layout>
      </PrivateRoute>
   );
};

export default RolesAndPermissions;
