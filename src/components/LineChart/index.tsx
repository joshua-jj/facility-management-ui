'use client';

import {
   Chart as ChartJS,
   CategoryScale,
   LinearScale,
   PointElement,
   LineElement,
   Tooltip,
   Filler,
   ChartOptions,
   ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import React from 'react';
import { format, parse, parseISO } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface DataPoint {
   month?: string;
   label?: string;
   count: string | number;
}

interface LineChartProps {
   data?: DataPoint[];
   label?: string;
   color?: string;
   formatValue?: (value: number) => string;
}

/** Detect format and return short label for axis */
function formatLabel(raw: string): string {
   try {
      // Daily format: "2026-03-20"
      if (raw.length === 10 && raw.charAt(4) === '-' && raw.charAt(7) === '-') {
         return format(parseISO(raw), 'dd MMM');
      }
      // Monthly format: "2026-03"
      return format(parse(raw, 'yyyy-MM', new Date()), 'MMM');
   } catch {
      return raw;
   }
}

/** Full label for tooltips */
function formatLabelFull(raw: string): string {
   try {
      if (raw.length === 10 && raw.charAt(4) === '-' && raw.charAt(7) === '-') {
         return format(parseISO(raw), 'EEEE, MMMM d, yyyy');
      }
      return format(parse(raw, 'yyyy-MM', new Date()), 'MMMM yyyy');
   } catch {
      return raw;
   }
}

const LineChart: React.FC<LineChartProps> = ({ data, label = 'Value', color = '#B88C00', formatValue }) => {
   if (!data || data.length === 0) {
      return (
         <div className="flex items-center justify-center h-full">
            <p className="text-xs font-medium" style={{ color: 'var(--text-hint)' }}>
               No data available
            </p>
         </div>
      );
   }

   const rawLabels = data.map((d) => d.month || d.label || '');
   const labels = rawLabels.map(formatLabel);
   const values = data.map((d) => Number(d.count));

   const chartData: ChartData<'line'> = {
      labels,
      datasets: [
         {
            label,
            data: values,
            borderColor: color,
            backgroundColor: (ctx) => {
               const chart = ctx.chart;
               const { ctx: canvasCtx, chartArea } = chart;
               if (!chartArea) return `${color}15`;
               const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
               gradient.addColorStop(0, `${color}30`);
               gradient.addColorStop(1, `${color}03`);
               return gradient;
            },
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#fff',
            pointBorderColor: color,
            pointBorderWidth: 2,
            borderWidth: 2.5,
         },
      ],
   };

   const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
         intersect: false,
         mode: 'index',
      },
      plugins: {
         legend: { display: false },
         tooltip: {
            backgroundColor: 'rgba(15, 37, 82, 0.92)',
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 13 },
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
               title: (items) => formatLabelFull(rawLabels[items[0].dataIndex]),
               label: (item) => {
                  const val = Number(item.raw);
                  return formatValue
                     ? `${label}: ${formatValue(val)}`
                     : `${label}: ${val.toLocaleString()}`;
               },
            },
         },
      },
      scales: {
         x: {
            display: true,
            grid: { display: false },
            border: { display: false },
            ticks: { font: { size: 10, weight: 'bold' }, color: '#9ca3af', padding: 4 },
         },
         y: {
            display: false,
         },
      },
      animation: {
         duration: 800,
         easing: 'easeOutQuart',
      },
   };

   return <Line data={chartData} options={options} />;
};

export default LineChart;