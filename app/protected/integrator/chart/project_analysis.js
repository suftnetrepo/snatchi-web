import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

const ReactProjectAnalysis = dynamic(() => import('react-apexcharts'), { ssr: false });

const ProjectAnalysis = ({ integratorId }) => {
    const [chartData, setChartData] = useState({
        series: [],
        options: {
            chart: {
                toolbar: { show: false },
                height: 280,
                type: 'line',
                stacked: false,
                fontFamily: 'Poppins, Arial, sans-serif',
            },
            grid: {
                borderColor: '#f5f4f4',
                strokeDashArray: 3,
            },
            dataLabels: {
                enabled: false,
            },
            xaxis: {
                categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], // Default categories
            },
            yaxis: [
                {
                    show: true,
                    axisTicks: { show: true },
                    axisBorder: { show: false, color: '#4eb6d0' },
                    labels: {
                        style: { colors: '#4eb6d0' },
                    },
                },
            ],
            tooltip: {
                enabled: true,
            },
            legend: {
                show: true,
                position: 'top',
                offsetX: 40,
                fontSize: '13px',
                fontWeight: 'normal',
                labels: { colors: '#acb1b1' },
            },
            stroke: {
                width: [0, 0],
                curve: 'straight',
                dashArray: [0, 0],
            },
            plotOptions: {
                bar: {
                    columnWidth: '35%',
                    borderRadius: 3,
                },
            },
            colors: ['rgb(132, 90, 223)', '#ededed'], // Colors for Projects and Tasks
        },
    });

    useEffect(() => {
        // Fetch data from the backend
        const fetchData = async () => {
            try {
                const response = await axios.get(`/api/project-analysis/${integratorId}`);
                const { projects, tasks, days } = response.data;

                setChartData((prevData) => ({
                    ...prevData,
                    series: [
                        { name: 'Projects', type: 'column', data: projects },
                        { name: 'Tasks', type: 'column', data: tasks },
                    ],
                    options: {
                        ...prevData.options,
                        xaxis: { categories: days },
                    },
                }));
            } catch (error) {
                console.error('Error fetching project analysis data:', error);
            }
        };

        if (integratorId) {
            fetchData();
        }
    }, [integratorId]);

    return (
        <div>
            <ReactProjectAnalysis
                options={chartData.options}
                series={chartData.series}
                type="line"
                height={300}
                width="100%"
            />
        </div>
    );
};

export default ProjectAnalysis;
