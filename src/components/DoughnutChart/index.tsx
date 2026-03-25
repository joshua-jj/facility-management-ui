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
import React from 'react';

// Register components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

const options: ChartOptions<'doughnut'> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      display: true,
      labels: {
        padding: 20,
        boxWidth: 15, // Controls the width of the legend color boxes
        font: {
          size: 14, // Optional: change font size of legend labels
        },
      },
    },
    title: {
      display: false,
      text: 'Color Distribution Doughnut Chart', // Chart Title
    },
    tooltip: {
      enabled: true, // Enable tooltips
    },
  },
  cutout: '60%',
};

const defaultData: ChartData<'doughnut'> = {
  labels: [`80% Fragile`, `20% Durable`],
  datasets: [
    {
      label: '',
      data: [80, 20],
      backgroundColor: ['#B88C00', '#E2DAC0'],
      borderColor: 'transparent',
      borderWidth: 2,
    },
  ],
};

const CHART_COLORS = ['#B88C00', '#E2DAC0', '#0F2552', '#6B8FCC', '#22c55e', '#ef4444', '#3b82f6', '#8b5cf6'];

interface DoughnutDataPoint {
  condition?: string;
  status?: string;
  count: number;
}

interface DoughnutChartProps {
  data?: DoughnutDataPoint[];
  centerLabel?: string;
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ data, centerLabel }) => {
  const chartData: ChartData<'doughnut'> = data && data.length > 0
    ? {
        labels: data.map((d) => `${d.condition || d.status || 'Unknown'} (${d.count})`),
        datasets: [
          {
            label: '',
            data: data.map((d) => d.count),
            backgroundColor: data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
            borderColor: 'transparent',
            borderWidth: 2,
          },
        ],
      }
    : defaultData;

  return (
    <div className="relative">
      <Doughnut data={chartData} options={options} />
      {centerLabel && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginBottom: 30 }}>
          <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {centerLabel}
          </span>
        </div>
      )}
    </div>
  );
};

export default DoughnutChart;
