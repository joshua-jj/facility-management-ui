'use client';

import {
   Chart as ChartJS,
   CategoryScale,
   LinearScale,
   BarElement,
   Tooltip,
   ChartOptions,
   ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import React from 'react';
import { format, parse } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface DataPoint {
   month?: string;
   label?: string;
   count: string | number;
}

interface MetricBarChartProps {
   data?: DataPoint[];
   color?: string;
   label?: string;
   formatValue?: (value: number) => string;
}

/** Format "2026-03" → "Mar" */
function formatMonth(raw: string): string {
   try {
      return format(parse(raw, 'yyyy-MM', new Date()), 'MMM');
   } catch {
      return raw;
   }
}

const MetricBarChart: React.FC<MetricBarChartProps> = ({
   data,
   color = '#B88C00',
   label = 'Value',
   formatValue,
}) => {
   if (!data || data.length === 0) {
      return (
         <div className="flex items-center justify-center h-full">
            <p className="text-xs font-medium" style={{ color: 'var(--text-hint)' }}>
               No data available
            </p>
         </div>
      );
   }

   const labels = data.map((d) => formatMonth(d.month || d.label || ''));
   const values = data.map((d) => Number(d.count));

   const chartData: ChartData<'bar'> = {
      labels,
      datasets: [
         {
            label,
            data: values,
            backgroundColor: `${color}30`,
            hoverBackgroundColor: `${color}60`,
            borderColor: color,
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.55,
            categoryPercentage: 0.7,
         },
      ],
   };

   const options: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
         legend: { display: false },
         tooltip: {
            backgroundColor: 'rgba(15, 37, 82, 0.92)',
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
               title: (items) => {
                  const raw = data[items[0].dataIndex]?.month || items[0].label;
                  try {
                     return format(parse(String(raw), 'yyyy-MM', new Date()), 'MMMM yyyy');
                  } catch {
                     return String(raw);
                  }
               },
               label: (item) => {
                  const val = Number(item.raw);
                  return formatValue ? formatValue(val) : `${label}: ${val.toLocaleString()}`;
               },
            },
         },
      },
      scales: {
         x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
               font: { size: 11, weight: 'bold' },
               color: '#9ca3af',
            },
         },
         y: {
            grid: { color: 'rgba(156, 163, 175, 0.08)' },
            border: { display: false },
            ticks: {
               font: { size: 10 },
               color: '#9ca3af',
               callback: (value) =>
                  formatValue ? formatValue(Number(value)) : Number(value).toLocaleString(),
            },
            beginAtZero: true,
         },
      },
      animation: {
         duration: 800,
         easing: 'easeOutQuart',
      },
   };

   return <Bar data={chartData} options={options} />;
};

export default MetricBarChart;
