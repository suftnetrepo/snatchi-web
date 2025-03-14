import { PolarArea } from 'react-chartjs-2';
import React from 'react';
import { Chart as ChartJS, RadialLinearScale, ArcElement, Tooltip, Legend } from 'chart.js';
import { getSortedCounts } from '../../../utils/helpers';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

const UserPolarChart = ({ data =[] }) => {
  const config = {
    labels: ['Active', 'Canceled', 'InActive', 'UnPaid'],
    datasets: [
      {
        label: 'My First Dataset',
        data: getSortedCounts(data),
        backgroundColor: ['rgb( 63, 120, 224)', ' rgb(226, 98, 107)', 'rgb(84, 168, 199)', '#fab758']
      }
    ]
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false, position: 'top' },
      tooltip: { enabled: true }
    },
    scales: { r: { ticks: { display: false }, grid: { circular: true } } }
  };

  return <PolarArea data={config} options={options} />;
};

export default UserPolarChart;
