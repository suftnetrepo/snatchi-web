import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

/**
 * SPARKLINE CHART COMPONENTS
 * 
 * NOTE: These charts currently display PLACEHOLDER data
 * TODO: Connect to real aggregation metrics:
 * - NumberofInvested: Real count of invested items
 * - Portfoliovalue: Real portfolio valuation
 * - Returnsrate: Real returns calculation
 * - TotalInvested: Real investment totals
 * 
 * For now, these render empty/minimal data to avoid
 * displaying misleading analytics to users.
 */

const NumberofInvested = () => {
  // PLACEHOLDER: Replace with real data from aggregation
  const [chartConfig] = useState({
    series: [
      {
        name: 'Value',
        data: []  // PLACEHOLDER: Should be connected to real metrics
      }
    ],
    options: {
      chart: {
        type: 'line',
        height: 40,
        width: 100,
        sparkline: {
          enabled: true
        }
      },
      stroke: {
        show: true,
        curve: 'smooth',
        lineCap: 'butt',
        width: 1.5
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.9,
          opacityTo: 0.9,
          stops: [0, 98]
        }
      },
      yaxis: {
        min: 0,
        show: false,
        axisBorder: {
          show: false
        }
      },
      xaxis: {
        axisBorder: {
          show: false
        }
      },
      tooltip: {
        enabled: false
      },
      colors: ['rgb(14, 168, 186)']
    }
  });

  return (
    <div>
      <Chart options={chartConfig.options} series={chartConfig.series} type="line" height={40} width={'100'} />
    </div>
  );
};

const Portfoliovalue = () => {
  // PLACEHOLDER: Replace with real data from aggregation
  const [chartConfig] = useState({
    series: [
      {
        name: 'Value',
        data: []  // PLACEHOLDER: Should be connected to real metrics
      }
    ],
    options: {
      chart: {
        type: 'line',
        height: 40,
        width: 100,
        sparkline: {
          enabled: true
        }
      },
      stroke: {
        show: true,
        curve: 'smooth',
        lineCap: 'butt',
        width: 1.5
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.9,
          opacityTo: 0.9,
          stops: [0, 98]
        }
      },
      yaxis: {
        min: 0,
        show: false,
        axisBorder: {
          show: false
        }
      },
      xaxis: {
        axisBorder: {
          show: false
        }
      },
      tooltip: {
        enabled: false
      },
      colors: ['rgb(245, 184, 73)']
    }
  });

  return (
    <div>
      <Chart options={chartConfig.options} series={chartConfig.series} type="line" height={40} width={'100'} />
    </div>
  );
};

const Returnsrate = () => {
  // PLACEHOLDER: Replace with real data from aggregation
  const [chartConfig] = useState({
    series: [
      {
        name: 'Value',
        data: []  // PLACEHOLDER: Should be connected to real metrics
      }
    ],
    options: {
      chart: {
        type: 'line',
        height: 40,
        width: 100,
        sparkline: {
          enabled: true
        }
      },
      stroke: {
        show: true,
        curve: 'smooth',
        lineCap: 'butt',
        width: 1.5
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.9,
          opacityTo: 0.9,
          stops: [0, 98]
        }
      },
      yaxis: {
        min: 0,
        show: false,
        axisBorder: {
          show: false
        }
      },
      xaxis: {
        axisBorder: {
          show: false
        }
      },
      tooltip: {
        enabled: false
      },
      colors: ['rgb(38, 191, 148)']
    }
  });

  return (
    <div>
      <Chart options={chartConfig.options} series={chartConfig.series} type="line" height={40} width={'100'} />
    </div>
  );
};

const TotalInvested = () => {
  // PLACEHOLDER: Replace with real data from aggregation
  const [chartConfig, setChartConfig] = useState({
    series: [
      {
        name: 'Value',
        data: []  // PLACEHOLDER: Should be connected to real metrics
      }
    ],
    options: {
      chart: {
        type: 'line',
        height: 40,
        width: 100,
        sparkline: {
          enabled: true
        }
      },
      stroke: {
        show: true,
        curve: 'smooth',
        lineCap: 'butt',
        colors: undefined,
        width: 1.5,
        dashArray: 0
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.9,
          opacityTo: 0.9,
          stops: [0, 98]
        }
      },
      yaxis: {
        min: 0,
        show: false,
        axisBorder: {
          show: false
        }
      },
      xaxis: {
        axisBorder: {
          show: false
        }
      },
      tooltip: {
        enabled: false
      },
      colors: ['rgb(132, 90, 223)']
    }
  });

  return (
    <div>
      <Chart options={chartConfig.options} series={chartConfig.series} type="line" height={40} width={'100'} />
    </div>
  );
};

const ProjectAnalysis = ({ data }) => {
  // Fallback to empty arrays if no data provided
  const projects = data?.projects || [];
  const dayLabels = data?.days || ['Sun 18', 'Mon 19', 'Tue 20', 'Wed 21', 'Thu 22', 'Fri 23', 'Sat 24'];
  
  const [chartData, setChartData] = useState({
    series: [
      {
        name: 'Projects',
        type: 'column',
        data: projects
      }
    ],
    options: {
      chart: {
        toolbar: {
          show: false
        },
        height: 280,
        type: 'column',
        stacked: false,
        fontFamily: 'Poppins, Arial, sans-serif'
      },
      grid: {
        borderColor: '#f5f4f4',
        strokeDashArray: 3
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: dayLabels
      },
      yaxis: {
        show: true,
        axisTicks: {
          show: true
        },
        axisBorder: {
          show: false,
          color: '#4eb6d0'
        },
        labels: {
          style: {
            colors: '#4eb6d0'
          }
        }
      },
      tooltip: {
        enabled: true
      },
      legend: {
        show: true,
        position: 'top',
        offsetX: 40,
        fontSize: '13px',
        fontWeight: 'normal',
        labels: {
          colors: '#acb1b1'
        }
      },
      stroke: {
        width: 0,
        curve: 'straight'
      },
      plotOptions: {
        bar: {
          columnWidth: '45%',
          borderRadius: 3
        }
      },
      colors: ['rgb(132, 90, 223)']
    }
  });

  return (
    <div>
      <Chart options={chartData.options} series={chartData.series} type="line" height={300} width={'100%'} />
    </div>
  );
};

const UserAggregates = ({ data }) => {
  // Fallback to empty arrays if no data provided
  const safeData = data || [];
  const dataSeries = safeData.map((item) => parseInt(item.count)) || [];
  const dataLabels = safeData.map((item) => item.role) || [];

  const [chartData] = useState({
    series: dataSeries,
    options: {
      chart: {
        type: 'donut'
      },
      colors: ['#845adf', '#23b7e5', '#f5b849', '#49b6f5', '#e6533c'],
      labels: dataLabels,
      legend: {
        position: 'bottom'
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 280
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ]
    }
  });

  return (
    <div id="chart">
      <Chart options={chartData.options} series={chartData.series} type="donut" width={284} height={300} />
    </div>
  );
};

export { UserAggregates, NumberofInvested, Portfoliovalue, Returnsrate, TotalInvested, ProjectAnalysis };
