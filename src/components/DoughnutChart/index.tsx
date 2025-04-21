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

const data: ChartData<'doughnut'> = {
  labels: [`80% Fragile`, `20% Durable`], // Labels for each section
  datasets: [
    {
      label: '',
      data: [80, 20], // Values for each section
      backgroundColor: ['#B88C00', '#E2DAC0'], // Colors for each section
      borderColor: 'transparent',
      borderWidth: 2, // Border width
    },
  ],
};

const DoughnutChart: React.FC = () => {
  return (
    <div className="">
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default DoughnutChart;
