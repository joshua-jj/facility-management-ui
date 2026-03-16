'use client';

import {
   Chart as ChartJS,
   CategoryScale,
   LinearScale,
   PointElement,
   LineElement,
   Title,
   Tooltip,
   Legend,
   Filler,
   ChartOptions,
   ChartData,
   ScriptableContext,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import React, { useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface LineChartProps {
   data?: { month: string; count: string }[];
   label?: string;
   color?: string;
}

const LineChart: React.FC<LineChartProps> = ({
   data: propData,
   label = 'Requests',
   color = '#B88C00',
}) => {
   const { theme } = useTheme();
   const isDark = theme === 'dark';
   const tickColor = isDark ? 'rgba(255,255,255,0.45)' : '#9ca3af';
   const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(156, 163, 175, 0.12)';
   const tooltipBg = isDark ? 'rgba(30, 30, 46, 0.95)' : 'rgba(15, 37, 82, 0.92)';

   const chartData: ChartData<'line'> = useMemo(() => {
      if (propData && propData.length > 0) {
         // Build full 6-month range, zero-filling missing months
         const now = new Date();
         const allMonths: { key: string; label: string }[] = [];
         for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            allMonths.push({ key, label: d.toLocaleString('default', { month: 'short' }) });
         }

         const dataMap = new Map(propData.map((d) => [d.month, Number(d.count)]));
         const months = allMonths.map((m) => m.label);
         const values = allMonths.map((m) => dataMap.get(m.key) ?? 0);

         return {
            labels: months,
            datasets: [
               {
                  label,
                  data: values,
                  borderColor: color,
                  backgroundColor: (ctx: ScriptableContext<'line'>) => {
                     const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
                     gradient.addColorStop(0, `${color}30`);
                     gradient.addColorStop(0.6, `${color}08`);
                     gradient.addColorStop(1, `${color}00`);
                     return gradient;
                  },
                  fill: true,
                  tension: 0.45,
                  pointRadius: 5,
                  pointHoverRadius: 8,
                  pointBackgroundColor: isDark ? '#1a1a2e' : '#fff',
                  pointBorderColor: color,
                  pointBorderWidth: 2.5,
                  pointHoverBackgroundColor: color,
                  pointHoverBorderColor: isDark ? '#1a1a2e' : '#fff',
                  pointHoverBorderWidth: 3,
                  borderWidth: 2.5,
               },
            ],
         };
      }

      return {
         labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
         datasets: [
            {
               label,
               data: [0, 0, 0, 0, 0, 0],
               borderColor: `${color}40`,
               backgroundColor: `${color}05`,
               fill: true,
               tension: 0.45,
               pointRadius: 0,
               borderWidth: 2,
               borderDash: [6, 4],
            },
         ],
      };
   }, [propData, label, color, isDark]);

   const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
         duration: 1200,
         easing: 'easeOutQuart',
         delay: (ctx) => ctx.dataIndex * 80,
      },
      interaction: {
         mode: 'index',
         intersect: false,
      },
      plugins: {
         legend: { display: false },
         tooltip: {
            backgroundColor: tooltipBg,
            titleColor: '#fff',
            bodyColor: '#fff',
            titleFont: { size: 11, weight: 'bold' },
            bodyFont: { size: 13, weight: 'bold' },
            padding: { top: 8, bottom: 8, left: 14, right: 14 },
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
               title: (items) => items[0]?.label ?? '',
               label: (item) => `${label}: ${item.formattedValue}`,
            },
         },
      },
      scales: {
         x: {
            border: { display: false },
            grid: { display: false },
            ticks: {
               color: tickColor,
               font: { size: 11, weight: 'normal' },
               padding: 8,
            },
         },
         y: {
            border: { display: false },
            beginAtZero: true,
            ticks: {
               color: tickColor,
               font: { size: 11 },
               padding: 12,
               maxTicksLimit: 5,
            },
            grid: {
               color: gridColor,
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               ...({ borderDash: [4, 4] } as any),
            },
         },
      },
   };

   return (
      <div style={{ height: '100%', minHeight: 200 }}>
         <Line data={chartData} options={options} />
      </div>
   );
};

export default LineChart;
