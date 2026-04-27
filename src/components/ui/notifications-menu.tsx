import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NotificationDto } from "@/types/notification";

interface NotificationsMenuProps {
   items: NotificationDto[];
   unreadCount: number;
   isStreamConnected: boolean;
   isLoading: boolean;
   onItemClick: (item: NotificationDto) => void;
   onMarkAllRead: () => void;
}

type TabKey = "all" | "unread" | "assigned";

function formatRelative(iso: string): string {
   const now = Date.now();
   const ts = new Date(iso).getTime();
   const diffMin = Math.max(0, Math.round((now - ts) / 60_000));
   if (diffMin < 1) return "just now";
   if (diffMin < 60) return `${diffMin} min ago`;
   const diffHr = Math.round(diffMin / 60);
   if (diffHr < 24) return `${diffHr}h ago`;
   const diffDay = Math.round(diffHr / 24);
   if (diffDay === 1) return "1 day ago";
   if (diffDay < 7) return `${diffDay} days ago`;
   return new Date(iso).toLocaleDateString();
}

function NotificationItem({
   notification,
   onClick,
}: {
   notification: NotificationDto;
   onClick: () => void;
}) {
   const initial = (notification.actorName ?? "EGFM").charAt(0).toUpperCase();
   return (
      <button
         type="button"
         onClick={onClick}
         className="block w-full text-left py-4 first:pt-0 last:pb-0 hover:bg-muted/40 rounded-md transition-colors px-2"
      >
         <div className="flex gap-3">
            <Avatar className="size-11">
               <AvatarImage
                  src=""
                  alt={`${notification.actorName ?? "system"} avatar`}
                  className="object-cover ring-1 ring-border"
               />
               <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>

            <div className="flex flex-1 flex-col space-y-2">
               <div className="w-full items-start">
                  <div className="flex items-center justify-between gap-2">
                     <div className="text-sm">
                        {notification.actorName ? (
                           <>
                              <span className="font-medium">{notification.actorName}</span>
                              <span className="text-muted-foreground"> · </span>
                           </>
                        ) : null}
                        <span className="font-medium">{notification.title}</span>
                     </div>
                     {!notification.readAt && (
                        <div className="size-1.5 rounded-full bg-[var(--color-secondary)]" />
                     )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                     <div className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString()}
                     </div>
                     <div className="text-xs text-muted-foreground">
                        {formatRelative(notification.createdAt)}
                     </div>
                  </div>
               </div>

               {notification.body && (
                  <div className="rounded-lg bg-muted p-2.5 text-sm tracking-[-0.006em]">
                     {notification.body}
                  </div>
               )}
            </div>
         </div>
      </button>
   );
}

export const NotificationsMenu: React.FC<NotificationsMenuProps> = ({
   items,
   unreadCount,
   isStreamConnected,
   isLoading,
   onItemClick,
   onMarkAllRead,
}) => {
   const [activeTab, setActiveTab] = React.useState<TabKey>("all");

   const filtered = React.useMemo(() => {
      switch (activeTab) {
         case "unread":
            return items.filter((n) => !n.readAt);
         case "assigned":
            return items.filter((n) => n.assignedToMe);
         default:
            return items;
      }
   }, [activeTab, items]);

   const unreadInList = items.filter((n) => !n.readAt).length;
   const assignedInList = items.filter((n) => n.assignedToMe).length;

   return (
      <Card className="flex w-full max-w-[min(calc(100vw-1rem),420px)] flex-col gap-4 p-4 shadow-none">
         <CardHeader className="p-0">
            <div className="flex items-center justify-between">
               <h3 className="text-base leading-none font-semibold tracking-[-0.006em]">
                  Your notifications
               </h3>
               <Button
                  className="h-7 px-2 text-xs"
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllRead}
                  disabled={unreadCount === 0}
               >
                  Mark all read
               </Button>
            </div>

            <Tabs
               value={activeTab}
               onValueChange={(v: TabKey) => setActiveTab(v)}
               className="w-full flex-col justify-start"
            >
               <TabsList className="[&_button]:gap-1.5">
                  <TabsTrigger value="all">
                     All{" "}
                     <Badge variant="secondary" className="size-5 rounded-full bg-muted-foreground/30">
                        {items.length}
                     </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="unread">
                     Unread{" "}
                     <Badge variant="secondary" className="size-5 rounded-full bg-muted-foreground/30">
                        {unreadInList}
                     </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="assigned">
                     Assigned to me{" "}
                     <Badge variant="secondary" className="size-5 rounded-full bg-muted-foreground/30">
                        {assignedInList}
                     </Badge>
                  </TabsTrigger>
               </TabsList>
            </Tabs>
         </CardHeader>

         <CardContent className="h-full p-0 max-h-[60vh] overflow-y-auto">
            <div className="space-y-0 divide-y divide-dashed divide-border">
               {filtered.length > 0 ? (
                  filtered.map((n) => (
                     <NotificationItem key={n.id} notification={n} onClick={() => onItemClick(n)} />
                  ))
               ) : (
                  <div className="flex flex-col items-center justify-center space-y-2.5 py-12 text-center">
                     <div className="rounded-full bg-muted p-4">
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           width="24"
                           height="24"
                           viewBox="0 0 24 24"
                           fill="none"
                           stroke="currentColor"
                           strokeWidth="2"
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           className="text-muted-foreground"
                        >
                           <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                           <path d="m13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                     </div>
                     <p className="text-sm font-medium tracking-[-0.006em] text-muted-foreground">
                        {isLoading ? "Loading..." : "No notifications yet."}
                     </p>
                  </div>
               )}
            </div>
         </CardContent>

         {!isStreamConnected && (
            <div className="text-xs text-muted-foreground text-center pb-1">
               Live updates paused — reconnecting…
            </div>
         )}
      </Card>
   );
};
