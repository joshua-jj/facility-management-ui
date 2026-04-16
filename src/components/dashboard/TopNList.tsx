'use client';

import React from 'react';

interface TopNRow {
   label: string;
   value: number;
   subLabel?: string;
}

interface TopNListProps {
   title: string;
   rows: TopNRow[];
   valueFormat?: (v: number) => string;
   barColor?: string;
   emptyText?: string;
   className?: string;
}

const TopNList: React.FC<TopNListProps> = ({
   title,
   rows,
   valueFormat,
   barColor = 'var(--color-secondary)',
   emptyText = 'No data available',
   className,
}) => {
   const fmt = valueFormat ?? ((v: number) => v.toLocaleString());
   const maxValue = rows.length > 0 ? Math.max(...rows.map((r) => r.value)) : 1;

   return (
      <div className={className} style={{ width: '100%' }}>
         {/* Title */}
         <div
            style={{
               paddingBottom: 8,
               borderBottom: '1px solid var(--border-default)',
               marginBottom: 12,
            }}
         >
            <span
               style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '0.01em',
               }}
            >
               {title}
            </span>
         </div>

         {rows.length === 0 ? (
            <div style={{ color: 'var(--text-hint)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
               {emptyText}
            </div>
         ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
               {rows.map((row, i) => {
                  const barWidth = maxValue > 0 ? (row.value / maxValue) * 100 : 0;
                  return (
                     <div key={i}>
                        {/* Row header */}
                        <div
                           style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'baseline',
                              marginBottom: 4,
                           }}
                        >
                           <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span
                                 style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: 'var(--text-primary)',
                                    lineHeight: 1.3,
                                 }}
                              >
                                 {row.label}
                              </span>
                              {row.subLabel && (
                                 <span
                                    style={{
                                       fontSize: 10,
                                       color: 'var(--text-hint)',
                                       lineHeight: 1.3,
                                    }}
                                 >
                                    {row.subLabel}
                                 </span>
                              )}
                           </div>
                           <span
                              style={{
                                 fontSize: 12,
                                 fontWeight: 600,
                                 color: 'var(--text-primary)',
                                 flexShrink: 0,
                                 marginLeft: 8,
                              }}
                           >
                              {fmt(row.value)}
                           </span>
                        </div>

                        {/* Bar track */}
                        <div
                           style={{
                              height: 4,
                              borderRadius: 9999,
                              background: 'var(--surface-medium)',
                              overflow: 'hidden',
                           }}
                        >
                           <div
                              style={{
                                 height: '100%',
                                 width: `${barWidth}%`,
                                 background: barColor,
                                 borderRadius: 9999,
                                 transition: 'width 0.4s ease',
                              }}
                           />
                        </div>
                     </div>
                  );
               })}
            </div>
         )}
      </div>
   );
};

export default TopNList;
