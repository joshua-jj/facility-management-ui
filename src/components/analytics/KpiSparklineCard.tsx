import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import Card from '@/components/Cards/Card';
import SectionLabel from '@/components/Cards/SectionLabel';

interface KpiSparklineCardProps {
   label: string;
   value: number;
   unit?: string;
   subtitle?: string;
   trendPercent: number;
   sparkline: number[];
   color: 'gold' | 'mint' | 'coral' | 'blue';
}

const TOKEN: Record<KpiSparklineCardProps['color'], string> = {
   gold: 'var(--chart-gold)',
   mint: 'var(--chart-mint)',
   coral: 'var(--chart-coral)',
   blue: 'var(--chart-blue)',
};

const KpiSparklineCard: React.FC<KpiSparklineCardProps> = ({
   label,
   value,
   unit,
   subtitle,
   trendPercent,
   sparkline,
   color,
}) => {
   const stroke = TOKEN[color];
   const data = sparkline.map((v, i) => ({ i, v }));
   const trendUp = trendPercent >= 0;
   const gradientId = `kpi-grad-${label.replace(/\s+/g, '-').toLowerCase()}`;

   return (
      <Card className="relative overflow-hidden">
         <div className="flex items-start justify-between gap-3">
            <SectionLabel>{label}</SectionLabel>
            <span
               className="inline-flex items-center gap-1 text-[0.7rem] font-semibold"
               style={{ color: trendUp ? 'var(--chart-mint)' : 'var(--chart-coral)' }}
            >
               <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  {trendUp ? <polygon points="12,4 22,20 2,20" /> : <polygon points="12,20 2,4 22,4" />}
               </svg>
               {trendUp ? '+' : ''}
               {trendPercent.toFixed(1)}%
            </span>
         </div>

         <div className="mt-4 flex items-baseline gap-2">
            <div className="text-4xl font-bold text-[#0F2552] dark:text-white tracking-tight">
               {value.toLocaleString('en-US')}
            </div>
            {unit && <div className="text-lg text-[#0F2552]/65 dark:text-white/70">{unit}</div>}
         </div>
         {subtitle && (
            <div className="text-xs text-[#0F2552]/45 dark:text-white/45 mt-1">{subtitle}</div>
         )}

         <div className="h-20 mt-3 -mx-5 md:-mx-6 -mb-5 md:-mb-6">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                     <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                     </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.5} fill={`url(#${gradientId})`} />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </Card>
   );
};

export default KpiSparklineCard;
