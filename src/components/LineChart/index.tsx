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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import React from 'react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface DataPoint {
   month?: string;
   label?: string;
   count: string | number;
}

interface LineChartProps {
   data?: DataPoint[];
   label?: string;
   color?: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, label = 'Value', color = '#B88C00' }) => {
   if (!data || data.length === 0) {
      return (
         <div className="flex items-center justify-center h-full">
            <p className="text-xs font-medium" style={{ color: 'var(--text-hint)' }}>
               No data available
            </p>
         </div>
      );
   }

   const labels = data.map((d) => d.month || d.label || '');
   const values = data.map((d) => Number(d.count));

   const chartData: ChartData<'line'> = {
      labels,
      datasets: [
         {
            label,
            data: values,
            borderColor: color,
            backgroundColor: `${color}18`,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 2,
         },
      ],
   };

   const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
         legend: { display: false },
         tooltip: {
            backgroundColor: 'rgba(15, 37, 82, 0.9)',
            titleFont: { size: 11 },
            bodyFont: { size: 11 },
            padding: 10,
            cornerRadius: 8,
         },
      },
      scales: {
         x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, color: '#9ca3af' },
         },
         y: {
            grid: { color: 'rgba(156, 163, 175, 0.1)' },
            ticks: { font: { size: 10 }, color: '#9ca3af' },
            beginAtZero: true,
         },
      },
   };

   return <Line data={chartData} options={options} />;
};

export default LineChart;
