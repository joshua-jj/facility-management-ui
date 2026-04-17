'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, startOfDay, subDays, eachDayOfInterval } from 'date-fns';

const DEFAULT_COLOR_RAMP = ['#FDF6E3', '#F4D58D', '#DFA94D', '#B28309', '#7A5A06'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHOWN_DAY_LABELS: Record<number, string> = { 1: 'Mon', 3: 'Wed', 5: 'Fri' };

interface CalendarHeatmapProps {
   data: Array<{ date: string; count: number }>;
   cellSize?: number;
   gap?: number;
   className?: string;
   colorRamp?: string[];
   onCellClick?: (date: string, count: number) => void;
}

function getQuintileColor(count: number, quintiles: number[], ramp: string[]): string {
   if (count === 0) return 'var(--surface-medium)';
   for (let i = 0; i < quintiles.length; i++) {
      if (count <= quintiles[i]) return ramp[i] ?? ramp[ramp.length - 1];
   }
   return ramp[ramp.length - 1];
}

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
   data,
   cellSize: cellSizeProp = 16,
   gap: gapProp = 4,
   className,
   colorRamp = DEFAULT_COLOR_RAMP,
   onCellClick,
}) => {
   const containerRef = useRef<HTMLDivElement>(null);
   const [containerWidth, setContainerWidth] = useState(0);
   const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

   const measureWidth = useCallback(() => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
   }, []);

   useEffect(() => {
      measureWidth();
      window.addEventListener('resize', measureWidth);
      return () => window.removeEventListener('resize', measureWidth);
   }, [measureWidth]);

   // Build a date->count lookup
   const countMap = useMemo(() => {
      const m: Record<string, number> = {};
      for (const d of data) {
         m[d.date] = d.count;
      }
      return m;
   }, [data]);

   // Full year back from today (like GitLab activity graph)
   const today = startOfDay(new Date());
   const startDate = subDays(today, 364);
   const allDays = eachDayOfInterval({ start: startDate, end: today });

   // Compute quintile thresholds from non-zero values
   const quintiles = useMemo(() => {
      const nonZero = allDays
         .map((d) => countMap[format(d, 'yyyy-MM-dd')] ?? 0)
         .filter((v) => v > 0)
         .sort((a, b) => a - b);
      if (nonZero.length === 0) return [0, 0, 0, 0, 0];
      const q = (p: number) => nonZero[Math.floor(p * (nonZero.length - 1))];
      return [q(0.2), q(0.4), q(0.6), q(0.8), q(1.0)];
   }, [allDays, countMap]);

   // Group days into weeks (columns), starting from Sunday
   // Pad first week so day 0 = Sunday
   const firstDayOfWeek = allDays[0].getDay(); // 0=Sun
   const paddedDays: (Date | null)[] = [
      ...Array(firstDayOfWeek).fill(null),
      ...allDays,
   ];
   const numWeeks = Math.ceil(paddedDays.length / 7);
   const weeks: (Date | null)[][] = [];
   for (let w = 0; w < numWeeks; w++) {
      weeks.push(paddedDays.slice(w * 7, w * 7 + 7));
   }

   // Month labels: find the first week that contains each month's first occurrence
   const monthLabels: { weekIdx: number; label: string }[] = [];
   let lastMonth = -1;
   weeks.forEach((week, wi) => {
      for (const day of week) {
         if (!day) continue;
         const m = day.getMonth();
         if (m !== lastMonth) {
            monthLabels.push({ weekIdx: wi, label: format(day, 'MMM') });
            lastMonth = m;
         }
         break;
      }
   });

   const dayLabelWidth = 30;
   const monthLabelHeight = 20;

   // Auto-size cells to stretch across the full container (like GitLab's activity graph).
   const cellSize = containerWidth > 0
      ? Math.floor((containerWidth - dayLabelWidth - 4) / numWeeks - gapProp)
      : cellSizeProp;
   const gap = gapProp;

   const totalWidth = numWeeks * (cellSize + gap) - gap;

   return (
      <div
         ref={containerRef}
         className={className}
         style={{ width: '100%', position: 'relative', userSelect: 'none', minHeight: 160 }}
      >
         {/* Month labels */}
         <div
            style={{
               marginLeft: dayLabelWidth,
               height: monthLabelHeight,
               position: 'relative',
               width: totalWidth,
            }}
         >
            {monthLabels.map(({ weekIdx, label }) => (
               <span
                  key={label + weekIdx}
                  style={{
                     position: 'absolute',
                     left: weekIdx * (cellSize + gap),
                     fontSize: 11,
                     color: 'var(--text-hint)',
                     whiteSpace: 'nowrap',
                  }}
               >
                  {label}
               </span>
            ))}
         </div>

         <div style={{ display: 'flex', gap: 0 }}>
            {/* Day-of-week labels */}
            <div
               style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap,
                  width: dayLabelWidth,
                  flexShrink: 0,
               }}
            >
               {DAY_LABELS.map((_, i) => (
                  <div
                     key={i}
                     style={{
                        height: cellSize,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: 5,
                        fontSize: 11,
                        color: 'var(--text-hint)',
                     }}
                  >
                     {SHOWN_DAY_LABELS[i] ?? ''}
                  </div>
               ))}
            </div>

            {/* Grid */}
            <div style={{ display: 'flex', gap, position: 'relative' }}>
               {weeks.map((week, wi) => (
                  <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap }}>
                     {Array.from({ length: 7 }).map((_, di) => {
                        const day = week[di] ?? null;
                        if (!day) {
                           return (
                              <div
                                 key={di}
                                 style={{ width: cellSize, height: cellSize, opacity: 0 }}
                              />
                           );
                        }
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const count = countMap[dateStr] ?? 0;
                        const bg = getQuintileColor(count, quintiles, colorRamp);

                        return (
                           <div
                              key={di}
                              title={`${dateStr}: ${count}`}
                              onClick={() => onCellClick?.(dateStr, count)}
                              onMouseEnter={(e) => {
                                 const rect = (e.target as HTMLElement).getBoundingClientRect();
                                 setTooltip({ date: dateStr, count, x: rect.left, y: rect.bottom });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                              style={{
                                 width: cellSize,
                                 height: cellSize,
                                 borderRadius: 3,
                                 background: bg,
                                 cursor: onCellClick ? 'pointer' : 'default',
                                 flexShrink: 0,
                              }}
                           />
                        );
                     })}
                  </div>
               ))}
            </div>
         </div>

         {/* Tooltip */}
         {tooltip && (
            <div
               style={{
                  position: 'fixed',
                  top: tooltip.y + 4,
                  left: tooltip.x,
                  background: 'var(--surface-paper)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  padding: '5px 10px',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  pointerEvents: 'none',
                  zIndex: 9999,
                  boxShadow: 'var(--shadow-sm)',
                  whiteSpace: 'nowrap',
               }}
            >
               <strong>{tooltip.date}</strong>: {tooltip.count.toLocaleString()}
            </div>
         )}
      </div>
   );
};

export default CalendarHeatmap;
