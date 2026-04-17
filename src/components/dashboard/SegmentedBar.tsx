'use client';

import React from 'react';

const DEFAULT_PALETTE = [
   'var(--color-secondary)',
   '#3B82F6',
   '#10B981',
   '#F59E0B',
   '#EF4444',
];

interface Segment {
   label: string;
   value: number;
   color?: string;
}

interface SegmentedBarProps {
   segments: Segment[];
   showLegend?: boolean;
   showPercent?: boolean;
   height?: number;
   className?: string;
   total?: number;
}

const SegmentedBar: React.FC<SegmentedBarProps> = ({
   segments,
   showLegend = true,
   showPercent = true,
   height = 28,
   className,
   total: explicitTotal,
}) => {
   if (!segments || segments.length === 0) {
      return (
         <div style={{ color: 'var(--text-hint)', fontSize: 12 }}>No data available</div>
      );
   }

   const total = explicitTotal ?? segments.reduce((sum, s) => sum + s.value, 0);

   return (
      <div className={className} style={{ width: '100%' }}>
         {/* Bar track */}
         <div
            style={{
               display: 'flex',
               height,
               borderRadius: 9999,
               overflow: 'hidden',
               background: 'var(--surface-medium)',
            }}
         >
            {segments.map((seg, i) => {
               const pct = total > 0 ? (seg.value / total) * 100 : 0;
               const color = seg.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
               const showLabel = showPercent && pct > 12;

               return (
                  <div
                     key={i}
                     style={{
                        width: `${pct}%`,
                        background: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'width 0.4s ease',
                        overflow: 'hidden',
                        flexShrink: 0,
                     }}
                     title={`${seg.label}: ${seg.value.toLocaleString()} (${Math.round(pct)}%)`}
                  >
                     {showLabel && (
                        <span
                           style={{
                              color: '#fff',
                              fontSize: 10,
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                           }}
                        >
                           {Math.round(pct)}%
                        </span>
                     )}
                  </div>
               );
            })}
         </div>

         {/* Legend */}
         {showLegend && (
            <div
               style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px 12px',
                  marginTop: 8,
               }}
            >
               {segments.map((seg, i) => {
                  const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
                  const color = seg.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
                  return (
                     <div
                        key={i}
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                     >
                        <span
                           style={{
                              width: 8,
                              height: 8,
                              borderRadius: 2,
                              background: color,
                              flexShrink: 0,
                              display: 'inline-block',
                           }}
                        />
                        <span
                           style={{
                              fontSize: 11,
                              color: 'var(--text-secondary)',
                              whiteSpace: 'nowrap',
                           }}
                        >
                           {seg.label}{' '}
                           <span style={{ color: 'var(--text-hint)' }}>
                              {seg.value.toLocaleString()} ({pct}%)
                           </span>
                        </span>
                     </div>
                  );
               })}
            </div>
         )}
      </div>
   );
};

export default SegmentedBar;
