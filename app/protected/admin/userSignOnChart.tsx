import { Bar } from 'react-chartjs-2';
import { useDashboard } from '../../../hooks/useDashboard';
import React, { useEffect } from 'react';

const UserSignOnChart = () => {
  const { handleChartAggregate, data } = useDashboard();

  useEffect(() => {
    handleChartAggregate();
  }, []);

  const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const datasets = {
    labels: labels,
    datasets: [
      {
        label: 'Daily User Sign-On',

        data: data,
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
          'rgb(54, 162, 235)',
          'rgb(201, 203, 207)',
          'rgb(153, 102, 255)'
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(255, 159, 64, 0.2)',
          'rgba(255, 205, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(201, 203, 207, 0.2)',
          'rgba(153, 102, 255, 0.2)'
        ],
        borderWidth: 1
      }
    ]
  };
  return (
    <div style={{ height: '300px' }}>
      <Bar
        data={datasets}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: true } }
        }}
      />
    </div>
  );
};

export default UserSignOnChart;
