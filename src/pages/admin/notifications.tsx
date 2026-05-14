import { NextPage } from 'next';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';

import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import PrivateRoute from '@/components/PrivateRoute';
import NotificationFiltersBar from '@/components/notifications/NotificationFiltersBar';
import NotificationDeliveriesTable from '@/components/notifications/NotificationDeliveriesTable';
import { Pagination } from '@/components/Pagination';

import { notificationsAdminActions } from '@/actions/notificationsAdmin.actions';
import { RootState } from '@/redux/reducers';
import { Permission } from '@/constants/permissions.enum';
import {
   EmailStatus,
   NotificationDeliveriesQuery,
} from '@/types/notificationsAdmin.types';

/**
 * SA-only notification delivery admin page.
 *
 * Default filter is `[FAILED, PERMANENTLY_FAILED]` so ops sees what
 * needs attention without scrolling through the wall of successful
 * sends. Capability gate is `notifications:admin` — seeded to
 * SUPER_ADMIN by the API; new roles need to be granted through the
 * settings/access UI rather than a code change here.
 */
const NotificationsAdminPage: NextPage = () => {
   const dispatch = useDispatch();
   const { page, isLoading, isMutating } = useSelector(
      (s: RootState) => s.notificationsAdmin,
   );

   const [query, setQuery] = useState<NotificationDeliveriesQuery>({
      page: 1,
      limit: 25,
      status: [EmailStatus.FAILED, EmailStatus.PERMANENTLY_FAILED],
   });

   useEffect(() => {
      dispatch(
         notificationsAdminActions.getNotificationsAdmin(
            query,
         ) as unknown as UnknownAction,
      );
   }, [dispatch, query]);

   const refetch = () =>
      dispatch(
         notificationsAdminActions.getNotificationsAdmin(
            query,
         ) as unknown as UnknownAction,
      );

   const handleRetry = (id: number) => {
      dispatch(
         notificationsAdminActions.retryNotification(
            id,
         ) as unknown as UnknownAction,
      );
      // Refetch shortly after so the row's reset state appears in the
      // table without the operator having to refresh the page.
      setTimeout(refetch, 800);
   };

   const handleAbandon = (id: number) => {
      dispatch(
         notificationsAdminActions.abandonNotification(
            id,
         ) as unknown as UnknownAction,
      );
      setTimeout(refetch, 400);
   };

   const handlePageChange = (next: number) => {
      setQuery((q) => ({ ...q, page: next }));
   };

   const rows = page?.data ?? [];
   const meta = page?.meta;
   const showPagination = !!meta && meta.totalItems > meta.itemsPerPage;

   return (
      <PrivateRoute permissions={[Permission.NOTIFICATIONS_ADMIN]}>
         <Layout title="Notifications">
            <PageHeader
               title="Notifications"
               subtitle="Email delivery records and retry status across all notifications fired by the system."
            />

            <NotificationFiltersBar query={query} onChange={setQuery} />

            {isLoading && rows.length === 0 ? (
               <div className="text-sm italic text-[#0F2552]/45 dark:text-white/45 py-8 text-center">
                  Loading notifications...
               </div>
            ) : (
               <NotificationDeliveriesTable
                  rows={rows}
                  onRetry={handleRetry}
                  onAbandon={handleAbandon}
                  isMutating={isMutating}
               />
            )}

            {showPagination && meta && (
               <div className="mt-4">
                  <Pagination
                     currentPage={meta.currentPage}
                     totalItems={meta.totalItems}
                     pageSize={meta.itemsPerPage}
                     onPageChange={handlePageChange}
                  />
               </div>
            )}
         </Layout>
      </PrivateRoute>
   );
};

export default NotificationsAdminPage;
