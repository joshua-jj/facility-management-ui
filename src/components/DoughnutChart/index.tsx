'use client';

import {
   Chart as ChartJS,
   ArcElement,
   Tooltip,
   Legend,
   Title,
   ChartOptions,
   ChartData,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import React, { useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const LIGHT_PALETTE = [
   '#B88C00', // gold
   '#0F2552', // navy
   '#22c55e', // emerald
   '#3b82f6', // blue
   '#ef4444', // red
   '#8b5cf6', // violet
   '#f59e0b', // amber
   '#06b6d4', // cyan
];

const DARK_PALETTE = [
   '#D4A84B', // lighter gold
   '#6B8FCC', // lighter navy
   '#4ade80', // lighter emerald
   '#60a5fa', // lighter blue
   '#f87171', // lighter red
   '#a78bfa', // lighter violet
   '#fbbf24', // lighter amber
   '#22d3ee', // lighter cyan
];

interface DoughnutChartProps {
   data?: { condition: string; count: string }[];
   centerLabel?: string;
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ data: propData, centerLabel }) => {
   const { theme } = useTheme();
   const isDark = theme === 'dark';
   const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
   const legendTextColor = isDark ? 'rgba(255,255,255,0.75)' : '#4b5563';
   const centerNumColor = isDark ? '#ffffff' : '#0F2552';
   const centerLabelColor = isDark ? 'rgba(255,255,255,0.45)' : '#9ca3af';

   const total = useMemo(() => {
      if (!propData || propData.length === 0) return 0;
      return propData.reduce((sum, item) => sum + Number(item.count), 0);
   }, [propData]);

   const chartData: ChartData<'doughnut'> = useMemo(() => {
      if (propData && propData.length > 0) {
         return {
            labels: propData.map((item) => item.condition),
            datasets: [
               {
                  data: propData.map((item) => Number(item.count)),
                  backgroundColor: propData.map((_, i) => palette[i % palette.length]),
                  hoverBackgroundColor: propData.map((_, i) => `${palette[i % palette.length]}dd`),
                  borderColor: 'transparent',
                  borderWidth: 0,
                  spacing: 3,
                  hoverOffset: 8,
               },
            ],
         };
      }

      return {
         labels: ['No data'],
         datasets: [
            {
               data: [1],
               backgroundColor: [isDark ? 'rgba(255,255,255,0.08)' : 'rgba(156, 163, 175, 0.15)'],
               borderColor: 'transparent',
               borderWidth: 0,
            },
         ],
      };
   }, [propData, palette, isDark]);

   const options: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
         duration: 1000,
         easing: 'easeOutQuart',
         animateRotate: true,
         animateScale: true,
      },
      plugins: {
         legend: {
            display: true,
            position: 'bottom',
            labels: {
               padding: 16,
               boxWidth: 10,
               boxHeight: 10,
               borderRadius: 5,
               useBorderRadius: true,
               font: { size: 11, weight: 'normal' },
               color: legendTextColor,
               generateLabels: (chart) => {
                  const dataset = chart.data.datasets[0];
                  return (chart.data.labels ?? []).map((label, i) => {
                     const value = Number(dataset.data[i]);
                     const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                     return {
                        text: `${label}  ${pct}%`,
                        fontColor: legendTextColor,
                        fillStyle: Array.isArray(dataset.backgroundColor)
                           ? (dataset.backgroundColor[i] as string)
                           : '#ccc',
                        hidden: false,
                        index: i,
                        strokeStyle: 'transparent',
                        lineWidth: 0,
                     };
                  });
               },
            },
         },
         tooltip: {
            backgroundColor: isDark ? 'rgba(30, 30, 46, 0.95)' : 'rgba(15, 37, 82, 0.92)',
            titleColor: '#fff',
            bodyColor: '#fff',
            titleFont: { size: 11, weight: 'bold' },
            bodyFont: { size: 13, weight: 'bold' },
            padding: { top: 8, bottom: 8, left: 14, right: 14 },
            cornerRadius: 8,
            displayColors: true,
            boxWidth: 8,
            boxHeight: 8,
            callbacks: {
               label: (item) => {
                  const pct = total > 0 ? Math.round((Number(item.raw) / total) * 100) : 0;
                  return ` ${item.label}: ${item.formattedValue} (${pct}%)`;
               },
            },
         },
      },
      cutout: '70%',
   };

   // Center text plugin
   const centerTextPlugin = {
      id: 'centerText',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      afterDraw: (chart: any) => {
         if (!centerLabel && total === 0) return;
         const { ctx, chartArea } = chart;
         const centerX = (chartArea.left + chartArea.right) / 2;
         const centerY = (chartArea.top + chartArea.bottom) / 2;

         ctx.save();
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';

         ctx.font = "700 20px 'Inter', system-ui, sans-serif";
         ctx.fillStyle = centerNumColor;
         ctx.fillText(centerLabel ?? total.toLocaleString(), centerX, centerY - 6);

         ctx.font = "500 9px 'Inter', system-ui, sans-serif";
         ctx.fillStyle = centerLabelColor;
         ctx.fillText('TOTAL', centerX, centerY + 12);

         ctx.restore();
      },
   };

   return (
      <div className="flex items-center justify-center">
         <div style={{ maxWidth: 260, width: '100%' }}>
            <Doughnut data={chartData} options={options} plugins={[centerTextPlugin]} />
         </div>
      </div>
   );
};

export default DoughnutChart;
