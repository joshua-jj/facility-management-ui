'use client';

import React from 'react';
import { LineChart, Line, ResponsiveContainer, Dot } from 'recharts';

interface SparklineProps {
   data: Array<{ date: string; value: number }>;
   color?: string;
   height?: number;
   strokeWidth?: number;
   showDelta?: boolean;
   className?: string;
}

const Sparkline: React.FC<SparklineProps> = ({
   data,
   color = 'var(--color-secondary)',
   height = 36,
   strokeWidth = 1.75,
   showDelta = true,
   className,
}) => {
   if (!data || data.length === 0) {
      return (
         <div style={{ height, display: 'flex', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-hint)', fontSize: 11 }}>No data</span>
         </div>
      );
   }

   const first = data[0].value;
   const last = data[data.length - 1].value;
   const delta = first !== 0 ? Math.round(((last - first) / Math.abs(first)) * 100) : 0;
   const isPositive = delta >= 0;

   const pillBg = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
   const pillColor = isPositive ? '#10B981' : '#EF4444';
   const pillText = `${isPositive ? '+' : ''}${delta}%`;

   // Custom dot: only render the last point
   const renderDot = (props: { cx?: number; cy?: number; index?: number; [key: string]: unknown }) => {
      const { cx, cy, index } = props;
      if (index !== data.length - 1) return <React.Fragment key={`empty-${index}`} />;
      return (
         <Dot
            key={`dot-last`}
            cx={cx}
            cy={cy}
            r={3}
            fill={color}
            stroke={color}
            strokeWidth={1}
         />
      );
   };

   return (
      <div className={className} style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
         {showDelta && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
               <span
                  style={{
                     background: pillBg,
                     color: pillColor,
                     fontSize: 10,
                     fontWeight: 600,
                     padding: '1px 5px',
                     borderRadius: 4,
                     letterSpacing: '0.02em',
                  }}
               >
                  {pillText}
               </span>
            </div>
         )}
         <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
               <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  dot={renderDot as never}
                  activeDot={false}
                  isAnimationActive={false}
               />
            </LineChart>
         </ResponsiveContainer>
      </div>
   );
};

export default Sparkline;
