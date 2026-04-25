import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationsMenu } from '@/components/ui/notifications-menu';
import { BellIcon } from '@/components/Icons';
import { notificationActions } from '@/actions/notification.action';
import type { RootState } from '@/redux/reducers';
import type { NotificationDto } from '@/types/notification';

export const NotificationBell: React.FC = () => {
   const dispatch = useDispatch();
   const router = useRouter();
   const [open, setOpen] = React.useState(false);
   const [hasFetched, setHasFetched] = React.useState(false);

   const { items, unreadCount, isLoading, isStreamConnected } = useSelector(
      (s: RootState) =>
         s.notification ?? {
            items: [],
            unreadCount: 0,
            isLoading: false,
            isStreamConnected: false,
         },
   );

   const handleOpenChange = (next: boolean) => {
      setOpen(next);
      if (next && !hasFetched) {
         dispatch(notificationActions.getNotifications({ limit: 20 }));
         setHasFetched(true);
      }
   };

   const handleItemClick = (item: NotificationDto) => {
      if (!item.readAt) {
         dispatch(notificationActions.markNotificationRead(item.id));
      }
      setOpen(false);
      if (item.link) {
         try {
            const url = new URL(item.link);
            router.push(url.pathname + url.search + url.hash);
         } catch {
            router.push(item.link);
         }
      }
   };

   const handleMarkAllRead = () => {
      dispatch(notificationActions.markAllNotificationsRead());
   };

   return (
      <Popover open={open} onOpenChange={handleOpenChange}>
         <PopoverTrigger
            render={(props) => (
               <button
                  {...props}
                  className="relative flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-paper)] hover:bg-[var(--surface-low)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                  aria-label="Notifications"
               >
                  <BellIcon />
                  {unreadCount > 0 && (
                     <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full" />
                  )}
               </button>
            )}
         />
         <PopoverContent align="end" sideOffset={8} className="w-[420px] p-0 max-h-[80vh] overflow-hidden">
            <NotificationsMenu
               items={items}
               unreadCount={unreadCount}
               isStreamConnected={isStreamConnected}
               isLoading={isLoading}
               onItemClick={handleItemClick}
               onMarkAllRead={handleMarkAllRead}
            />
         </PopoverContent>
      </Popover>
   );
};
