import React from 'react';
import Card from '@/components/Cards/Card';
import SectionLabel from '@/components/Cards/SectionLabel';

interface ScheduleEntry {
   id: string | number;
   hour: number; // 0–23
   title: string;
   subtitle?: string;
}

interface UpcomingScheduleCardProps {
   entries: ScheduleEntry[];
   startHour?: number;
   endHour?: number;
}

/**
 * "Upcoming Schedule" card. Renders an hour-of-day rail on the left
 * and entries on the right. When `entries` is empty the card shows
 * the mockup's empty-state copy. Hour bounds default to a working-
 * day window (08:00 – 16:00) — page may pass narrower or wider.
 */
const UpcomingScheduleCard: React.FC<UpcomingScheduleCardProps> = ({
   entries,
   startHour = 8,
   endHour = 16,
}) => {
   const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
   const isEmpty = entries.length === 0;

   return (
      <Card>
         <SectionLabel>Upcoming Schedule</SectionLabel>
         <div className="mt-5 relative" style={{ minHeight: 320 }}>
            <div className="flex">
               <div className="flex flex-col gap-7 pr-4 border-r border-[var(--border-default)]">
                  {hours.map((h) => (
                     <div
                        key={h}
                        className="text-xs font-medium text-[#0F2552]/45 dark:text-white/40 tabular-nums"
                     >
                        {String(h).padStart(2, '0')}:00
                     </div>
                  ))}
               </div>
               <div className="flex-1 pl-4">
                  {isEmpty ? (
                     <div
                        className="h-full flex items-center justify-center text-sm text-[#0F2552]/45 dark:text-white/45 italic"
                        style={{ minHeight: 320 }}
                     >
                        No upcoming schedules (Yet).
                     </div>
                  ) : (
                     <div className="flex flex-col gap-3">
                        {entries.map((e) => (
                           <div key={e.id} className="text-sm text-[#0F2552] dark:text-white/85">
                              <div className="font-semibold">{e.title}</div>
                              {e.subtitle && (
                                 <div className="text-xs text-[#0F2552]/50 dark:text-white/45">
                                    {e.subtitle}
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </Card>
   );
};

export default UpcomingScheduleCard;
