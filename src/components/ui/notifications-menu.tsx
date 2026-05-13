import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const AVATAR_PALETTE = [
   { bg: "#4F46E5", text: "#fff" },
   { bg: "#0891B2", text: "#fff" },
   { bg: "#059669", text: "#fff" },
   { bg: "#D97706", text: "#fff" },
   { bg: "#DC2626", text: "#fff" },
   { bg: "#7C3AED", text: "#fff" },
   { bg: "#0284C7", text: "#fff" },
   { bg: "#BE185D", text: "#fff" },
];

function avatarColor(name: string) {
   const seed = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
   return AVATAR_PALETTE[seed % AVATAR_PALETTE.length];
}

function formatRelative(iso: string): string {
   const now = Date.now();
   const ts = new Date(iso).getTime();
   const diffMin = Math.max(0, Math.round((now - ts) / 60_000));
   if (diffMin < 1) return "just now";
   if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
   const diffHr = Math.round(diffMin / 60);
   if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
   const diffDay = Math.round(diffHr / 24);
   return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

function NotificationItem({
   notification,
   onClick,
}: {
   notification: NotificationDto;
   onClick: () => void;
}) {
   const actorName = notification.actorName ?? "EGFM";
   const color = avatarColor(actorName);
   const initial = actorName.charAt(0).toUpperCase();
   const isUnread = !notification.readAt;
   const hasLink = Boolean(notification.link);

   return (
      <button
         type="button"
         onClick={onClick}
         className={[
            "group relative w-full text-left rounded-xl px-3 py-3 transition-all duration-150 cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B28309]/60 focus-visible:ring-offset-1",
            "active:scale-[0.99]",
            isUnread
               ? "bg-amber-50 dark:bg-[#D4A84B]/10 hover:bg-amber-100/70 dark:hover:bg-[#D4A84B]/15"
               : "hover:bg-[#0F2552]/[0.04] dark:hover:bg-white/[0.05]",
         ].join(" ")}
         aria-label={hasLink ? `Open: ${notification.title}` : notification.title}
      >
         {isUnread && (
            <span
               aria-hidden
               className="absolute left-0 inset-y-2.5 w-[3px] rounded-r-full bg-[#B28309] dark:bg-[#D4A84B]"
            />
         )}

         <div className="flex gap-3">
            <div className="relative shrink-0">
               <Avatar className="size-9">
                  <AvatarImage src="" alt="" />
                  <AvatarFallback
                     style={{ backgroundColor: color.bg, color: color.text }}
                     className="text-xs font-bold"
                  >
                     {initial}
                  </AvatarFallback>
               </Avatar>
               {isUnread && (
                  <span
                     aria-hidden
                     className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-[#B28309] dark:bg-[#D4A84B] ring-2 ring-white dark:ring-[#0F2552]"
                  />
               )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
               <div className="flex items-start justify-between gap-1.5">
                  <p className="text-[0.8125rem] leading-snug">
                     {notification.actorName && (
                        <span className="font-semibold text-[#0F2552] dark:text-white">
                           {notification.actorName}
                        </span>
                     )}
                     {notification.actorName && (
                        <span className="mx-1.5 text-[#B28309] dark:text-[#D4A84B] text-[0.5rem] align-middle">●</span>
                     )}
                     <span className={[
                        "text-[#0F2552]/75 dark:text-white/80",
                        isUnread ? "font-medium" : "font-normal",
                     ].join(" ")}>
                        {notification.title}
                     </span>
                  </p>
                  {hasLink && (
                     <svg
                        aria-hidden
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 size-3 mt-1 text-[#B28309] dark:text-[#D4A84B] opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0"
                     >
                        <polyline points="6 4 11 8 6 12" />
                     </svg>
                  )}
               </div>

               {notification.body && (
                  <p className="text-xs leading-relaxed text-[#0F2552]/55 dark:text-white/50 line-clamp-2">
                     {notification.body}
                  </p>
               )}

               <div className="pt-0.5">
                  <span className={[
                     "text-[0.65rem] font-medium tabular-nums",
                     isUnread
                        ? "text-[#B28309] dark:text-[#D4A84B]"
                        : "text-[#0F2552]/40 dark:text-white/35",
                  ].join(" ")}>
                     {formatRelative(notification.createdAt)}
                  </span>
               </div>
            </div>
         </div>
      </button>
   );
}

const TABS: { value: TabKey; label: string }[] = [
   { value: "all", label: "All" },
   { value: "unread", label: "Unread" },
   { value: "assigned", label: "Assigned" },
];

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
         case "unread": return items.filter((n) => !n.readAt);
         case "assigned": return items.filter((n) => n.assignedToMe);
         default: return items;
      }
   }, [activeTab, items]);

   const counts: Record<TabKey, number> = {
      all: items.length,
      unread: items.filter((n) => !n.readAt).length,
      assigned: items.filter((n) => n.assignedToMe).length,
   };

   return (
      <div className="flex flex-col bg-white dark:bg-[#0F2552] rounded-2xl overflow-hidden w-full">

         {/* ── Header ── */}
         <div className="px-4 pt-4 pb-3 border-b border-[#0F2552]/[0.07] dark:border-white/10">
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2">
                  <h3 className="text-[0.9375rem] font-bold tracking-tight text-[#0F2552] dark:text-white">
                     Notifications
                  </h3>
                  {unreadCount > 0 && (
                     <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[#B28309] dark:bg-[#D4A84B] text-white dark:text-[#0F2552] text-[0.6rem] font-bold tabular-nums leading-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                     </span>
                  )}
               </div>
               <button
                  type="button"
                  onClick={onMarkAllRead}
                  disabled={unreadCount === 0}
                  className="h-7 px-3 text-xs font-semibold rounded-lg border border-[#B28309]/40 dark:border-[#D4A84B]/40 text-[#B28309] dark:text-[#D4A84B] bg-[#B28309]/[0.07] dark:bg-[#D4A84B]/[0.07] hover:bg-[#B28309]/[0.14] dark:hover:bg-[#D4A84B]/[0.14] hover:border-[#B28309]/60 dark:hover:border-[#D4A84B]/60 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
               >
                  Mark all read
               </button>
            </div>

            {/* ── Tab strip ── plain buttons, no library involved */}
            <div className="flex gap-1 p-1 bg-[#0F2552] dark:bg-[#0a1a3a] rounded-xl">
               {TABS.map(({ value, label }) => {
                  const active = activeTab === value;
                  const count = counts[value];
                  return (
                     <button
                        key={value}
                        type="button"
                        onClick={() => setActiveTab(value)}
                        className={[
                           "flex-1 flex items-center justify-center gap-1.5 h-8 px-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150",
                           active
                              ? "bg-white/15 text-white font-semibold"
                              : "text-white/55 hover:text-white/85 hover:bg-white/[0.08]",
                        ].join(" ")}
                     >
                        {label}
                        <span className={[
                           "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[0.6rem] font-bold tabular-nums leading-none",
                           active
                              ? "bg-white/25 text-white"
                              : value === "unread" && count > 0
                                 ? "bg-[#D4A84B]/30 text-[#D4A84B]"
                                 : "bg-white/15 text-white/60",
                        ].join(" ")}>
                           {count}
                        </span>
                     </button>
                  );
               })}
            </div>
         </div>

         {/* ── List ── */}
         <div className="max-h-[58vh] overflow-y-auto overscroll-contain">
            {filtered.length > 0 ? (
               <div className="p-2 flex flex-col gap-0.5">
                  {filtered.map((n) => (
                     <NotificationItem key={n.id} notification={n} onClick={() => onItemClick(n)} />
                  ))}
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center gap-3 py-14">
                  <div className="p-3.5 rounded-full bg-[#0F2552]/[0.06] dark:bg-white/[0.07] ring-1 ring-[#0F2552]/10 dark:ring-white/10">
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[#0F2552]/35 dark:text-white/35"
                     >
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="m13.73 21a2 2 0 0 1-3.46 0" />
                     </svg>
                  </div>
                  <p className="text-sm font-medium text-[#0F2552]/40 dark:text-white/40">
                     {isLoading ? "Loading…" : "No notifications yet."}
                  </p>
               </div>
            )}
         </div>

         {!isStreamConnected && (
            <div className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-50 dark:bg-[#D4A84B]/10 border-t border-amber-200/60 dark:border-[#D4A84B]/20">
               <span className="size-1.5 rounded-full bg-amber-400 dark:bg-[#D4A84B] animate-pulse" />
               <span className="text-[0.7rem] font-medium text-amber-700 dark:text-[#D4A84B]/80">
                  Live updates paused — reconnecting…
               </span>
            </div>
         )}
      </div>
   );
};
