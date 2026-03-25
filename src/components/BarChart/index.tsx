'use client';

import {
   Chart as ChartJS,
   CategoryScale,
   LinearScale,
   BarElement,
   Title,
   Tooltip,
   Legend,
   ChartOptions,
   ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import React, { useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface BarChartProps {
   data?: { hoursUsed: number; onTime: string }[];
}

const BarChart: React.FC<BarChartProps> = ({ data: propData }) => {
   const { theme } = useTheme();
   const isDark = theme === 'dark';
   const tickColor = isDark ? 'rgba(255,255,255,0.45)' : '#9ca3af';
   const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(156, 163, 175, 0.12)';

   const chartData: ChartData<'bar'> = useMemo(() => {
      if (propData && propData.length > 0) {
         const buckets: Record<string, number[]> = {};
         DAY_LABELS.forEach((d) => (buckets[d] = []));

         propData.forEach((entry) => {
            const dayIndex = new Date(entry.onTime).getDay();
            const adjusted = dayIndex === 0 ? 6 : dayIndex - 1;
            const label = DAY_LABELS[adjusted];
            if (buckets[label]) {
               // Convert seconds to hours for display
               buckets[label].push(Math.abs(entry.hoursUsed) / 3600);
            }
         });

         const avgHours = DAY_LABELS.map((d) => {
            const arr = buckets[d];
            return arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
         });

         const totalEntries = DAY_LABELS.map((d) => buckets[d].length);

         return {
            labels: DAY_LABELS,
            datasets: [
               {
                  label: 'Avg Hours',
                  data: avgHours,
                  backgroundColor: '#B88C00',
                  hoverBackgroundColor: '#D4A84B',
                  borderRadius: { topLeft: 6, topRight: 6 },
                  barThickness: 14,
                  borderWidth: 0,
                  borderSkipped: false,
               },
               {
                  label: 'Sessions',
                  data: totalEntries,
                  backgroundColor: 'rgba(15, 37, 82, 0.15)',
                  hoverBackgroundColor: 'rgba(15, 37, 82, 0.3)',
                  borderRadius: { topLeft: 6, topRight: 6 },
                  barThickness: 14,
                  borderWidth: 0,
                  borderSkipped: false,
               },
            ],
         };
      }

      // Placeholder data when no real data
      return {
         labels: DAY_LABELS,
         datasets: [
            {
               label: 'Avg Hours',
               data: [0, 0, 0, 0, 0, 0, 0],
               backgroundColor: 'rgba(184, 140, 0, 0.15)',
               borderRadius: { topLeft: 6, topRight: 6 },
               barThickness: 14,
               borderWidth: 0,
               borderSkipped: false,
            },
         ],
      };
   }, [propData]);

   const options: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
         duration: 900,
         easing: 'easeOutQuart',
         delay: (ctx) => ctx.dataIndex * 60,
      },
      interaction: {
         mode: 'index',
         intersect: false,
      },
      plugins: {
         legend: {
            display: propData && propData.length > 0,
            position: 'top',
            align: 'end',
            labels: {
               boxWidth: 8,
               boxHeight: 8,
               borderRadius: 4,
               useBorderRadius: true,
               padding: 16,
               font: { size: 11, weight: 'normal' },
               color: tickColor,
            },
         },
         tooltip: {
            backgroundColor: isDark ? 'rgba(30, 30, 46, 0.95)' : 'rgba(15, 37, 82, 0.92)',
            titleColor: '#fff',
            bodyColor: '#fff',
            titleFont: { size: 11, weight: 'bold' },
            bodyFont: { size: 12, weight: 'bold' },
            padding: { top: 8, bottom: 8, left: 14, right: 14 },
            cornerRadius: 8,
            callbacks: {
               label: (item) => {
                  const suffix = item.dataset.label === 'Avg Hours' ? 'hrs' : '';
                  return ` ${item.dataset.label}: ${item.formattedValue}${suffix}`;
               },
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
               padding: 6,
            },
         },
         y: {
            border: { display: false },
            beginAtZero: true,
            ticks: {
               color: '#9ca3af',
               font: { size: 11 },
               padding: 10,
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
         <Bar options={options} data={chartData} />
      </div>
   );
};

export default BarChart;
