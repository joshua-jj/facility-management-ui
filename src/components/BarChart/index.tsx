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
import React from 'react';

// Register the components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top' as const,
            display: false,
        },
        title: {
            display: false,
            text: 'Monthly Sales',
        },
        tooltip: {
            enabled: true,
        },
    },
    scales: {
        x: {
            grid: {
                display: false,
            },
            ticks: {
                color: '#111827',
                font: {
                    size: 14,
                },
            },
        },
        y: {
            beginAtZero: true,
            ticks: {
                stepSize: 2,
            },
            grid: {
                ...( {
                    dash: [5, 5],
                    color: '#d1d5db',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any ),
            },
        },
    }

};

const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const data: ChartData<'bar'> = {
    labels,
    datasets: [
        {
            label: '',
            data: [2, 4, 5, 7, 9, 6, 3],
            backgroundColor: '#B88C00', // Tailwind indigo-500
            borderRadius: 8,
            barThickness: 12,
            borderWidth: 2,
            borderColor: 'transparent',
        },
        {
            label: '',
            data: [4, 3, 5, 2, 7, 9, 1],
            backgroundColor: '#E2DAC0', // Tailwind indigo-500
            borderRadius: 8,
            barThickness: 12,
            borderWidth: 2,
            borderColor: 'transparent',
        },
    ],
};

const BarChart: React.FC = () => {
    return (
        <Bar options={options} data={data} />
    );
};

export default BarChart;
