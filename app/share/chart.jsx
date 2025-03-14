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

const NumberofInvested = () => {
  const [chartConfig] = useState({
    series: [
      {
        name: 'Value',
        data: [20, 14, 19, 10, 23, 20, 22, 9, 12]
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
  const [chartConfig] = useState({
    series: [
      {
        name: 'Value',
        data: [20, 14, 19, 10, 23, 20, 22, 9, 12]
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
  const [chartConfig] = useState({
    series: [
      {
        name: 'Value',
        data: [20, 14, 19, 10, 23, 20, 22, 9, 12]
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
  const [chartConfig, setChartConfig] = useState({
    series: [
      {
        name: 'Value',
        data: [20, 14, 19, 10, 23, 20, 22, 9, 12]
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
  const [chartData, setChartData] = useState({
    series: [
      {
        name: 'Projects',
        type: 'column',
        data: data?.projects
      },
      {
        name: 'Tasks',
        type: 'column',
        data: data?.tasks
      }
    ],
    options: {
      chart: {
        toolbar: {
          show: false
        },
        height: 280,
        type: 'line',
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
        categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      },
      yaxis: [
        {
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
        {
          opposite: true,
          axisTicks: {
            show: true
          },
          axisBorder: {
            show: false
          },
          labels: {
            style: {
              colors: '#00E396'
            }
          }
        }
      ],
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
        width: [0, 0, 1.5],
        curve: 'straight',
        dashArray: [0, 0, 0]
      },
      plotOptions: {
        bar: {
          columnWidth: '35%',
          borderRadius: 3
        }
      },
      colors: ['rgb(132, 90, 223)', '#ededed', '#23b7e5']
    }
  });

  return (
    <div>
      <Chart options={chartData.options} series={chartData.series} type="line" height={300} width={'100%'} />
    </div>
  );
};

const UserAggregates = ({ data }) => {
  const dataSeries = data?.map((item) => parseInt(item.count));
  const dataLabels = data?.map((item) => item.role);

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
