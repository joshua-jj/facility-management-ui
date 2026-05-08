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
   const isUnread = !notification.readAt;
   const hasLink = Boolean(notification.link);
   return (
      <button
         type="button"
         onClick={onClick}
         className={[
            "group relative block w-full cursor-pointer overflow-hidden",
            "px-3 py-3.5 text-left",
            "rounded-lg border border-transparent",
            "transition-all duration-200 ease-out",
            "hover:border-border hover:bg-muted/50 hover:shadow-sm",
            "active:scale-[0.99] active:bg-muted/70",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            isUnread ? "bg-[var(--color-secondary)]/[0.04]" : "",
         ].join(" ")}
         aria-label={
            hasLink ? `Open: ${notification.title}` : notification.title
         }
      >
         {/* Left accent stripe — solid for unread, faint on hover for read */}
         <span
            aria-hidden
            className={[
               "absolute inset-y-2 left-0 w-0.5 rounded-full transition-all duration-200",
               isUnread
                  ? "bg-[var(--color-secondary)] opacity-100"
                  : "bg-muted-foreground/40 opacity-0 group-hover:opacity-100",
            ].join(" ")}
         />

         <div className="flex gap-3 pl-1">
            <Avatar className="size-10 shrink-0 transition-transform duration-200 group-hover:scale-[1.04]">
               <AvatarImage
                  src=""
                  alt={`${notification.actorName ?? "system"} avatar`}
                  className="object-cover ring-1 ring-border"
               />
               <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>

            <div className="flex flex-1 min-w-0 flex-col gap-1.5">
               <div className="flex items-start justify-between gap-2">
                  {/* Pin colors explicitly. The shadcn `text-foreground`
                       token gets overridden to near-white when the OS
                       prefers dark mode (see prefers-color-scheme block
                       in globals.css), and the Radix popover renders in
                       a portal that doesn't always inherit the page's
                       theme class — so on a light page with a dark OS,
                       this title was rendering near-white-on-near-white. */}
                  <div
                     className="text-sm leading-snug text-[#0F2552] dark:text-white/90"
                  >
                     {notification.actorName ? (
                        <>
                           <span className="font-semibold">{notification.actorName}</span>
                           <span className="text-[#0F2552]/55 dark:text-white/55"> · </span>
                        </>
                     ) : null}
                     <span className={isUnread ? "font-semibold" : "font-medium"}>
                        {notification.title}
                     </span>
                  </div>
                  {/* Chevron slides in on hover when the item routes somewhere */}
                  {hasLink && (
                     <svg
                        aria-hidden
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={[
                           "size-4 shrink-0 mt-0.5 text-[#0F2552]/55 dark:text-white/55",
                           "translate-x-[-4px] opacity-0",
                           "transition-all duration-200 ease-out",
                           "group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-[#0F2552] dark:group-hover:text-white/90",
                        ].join(" ")}
                     >
                        <polyline points="6 4 11 8 6 12" />
                     </svg>
                  )}
               </div>

               {notification.body && (
                  <div className="line-clamp-2 rounded-md bg-[#0F2552]/[0.05] dark:bg-white/[0.06] px-2.5 py-1.5 text-xs leading-relaxed text-[#0F2552]/75 dark:text-white/75 tracking-[-0.006em] group-hover:bg-[#0F2552]/[0.08] dark:group-hover:bg-white/[0.10]">
                     {notification.body}
                  </div>
               )}

               <div className="flex items-center justify-between gap-2 text-[0.7rem] text-[#0F2552]/55 dark:text-white/55">
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  <span className="tabular-nums">{formatRelative(notification.createdAt)}</span>
               </div>
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
      <Card className="flex w-full max-w-[min(calc(100vw-1rem),420px)] flex-col gap-4 p-4 shadow-none bg-white dark:bg-[#0F1730]">
         <CardHeader className="p-0">
            <div className="flex items-center justify-between">
               <h3 className="text-base leading-none font-semibold tracking-[-0.006em] text-[#0F2552] dark:text-white/90">
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
            <div className="flex flex-col gap-1">
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
