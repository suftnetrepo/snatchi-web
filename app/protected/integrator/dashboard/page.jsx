'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { getAggregate } from '@/utils/helpers';
import { useProjectDashboard } from '@/hooks/useProjectDashboard';
import { PROJECT_STATUS } from '@/app/api/constants/statuses';
import {
  ProjectAnalysis,
  TotalInvested,
  NumberofInvested,
  Portfoliovalue,
  Returnsrate,
  UserAggregates
} from '../../../share/chart';
import RecentProjects from '../recentProjects';
import { useUser } from '@/hooks/useUser';
import { zat } from '@/utils/api';
import { VERBS } from '@/config';
import { SCHEDULER } from '@/utils/apiUrl';

const Dashboard = () => {
  const router = useRouter();
  const { handleAggregate, data } = useProjectDashboard();
  const [schedulerStats, setSchedulerStats] = useState({
    accepted: 0,
    inProgress: 0,
    awaitingPayment: 0
  });
  const [activeProjects, setActiveProjects] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Memoize fetchSchedulerStats to prevent infinite loops
  const fetchSchedulerStats = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        action: 'getAllSchedules'
      });
      const response = await zat(SCHEDULER.getByEngineer, null, VERBS.GET, params);
      
      if (response.success && response.data) {
        const schedules = response.data;
        
        // Count accepted schedules
        const acceptedCount = schedules.filter(s => s.status === 'Accepted').length;
        
        // Count in-progress schedules
        const inProgressCount = schedules.filter(s => s.status === 'Progress' || s.status === 'In Progress').length;
        
        // Count awaiting payment: Accepted + (pending/empty paymentStatus) + (estimatedAmount > 0)
        const awaitingPaymentCount = schedules.filter(s => 
          s.status === 'Accepted' &&
          (!s.paymentStatus || s.paymentStatus === 'pending') &&
          s.estimatedAmount > 0
        ).length;
        
        setSchedulerStats({
          accepted: acceptedCount,
          inProgress: inProgressCount,
          awaitingPayment: awaitingPaymentCount
        });
      }
    } catch (error) {
      console.error('Failed to fetch scheduler stats:', error);
    }
  }, []);

  // Memoize calculateActiveProjects to prevent infinite loops
  const calculateActiveProjects = useCallback(() => {
    // Active projects = Projects with status not equal to 'Completed'
    const completed = getAggregate(data?.statuses, PROJECT_STATUS.COMPLETED) || 0;
    const total = data?.totalProjects || 0;
    setActiveProjects(Math.max(0, total - completed));
  }, [data?.totalProjects, data?.statuses]);

  // Initialize dashboard data only once on mount
  useEffect(() => {
    if (!hasInitialized) {
      handleAggregate();
      fetchSchedulerStats();
      setHasInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialized]);

  // Update active projects when data changes
  useEffect(() => {
    if (data?.totalProjects !== undefined) {
      calculateActiveProjects();
    }
  }, [data?.totalProjects, data?.statuses, calculateActiveProjects]);

  const RenderChart = () => {
    const { handleChartAggregate, data: chartData } = useProjectDashboard();
    useEffect(() => {
      handleChartAggregate();
    }, []);

    return (
      <div className="card-body">
        <h5 className="card-title mb-2"></h5>
        <div>{chartData && <ProjectAnalysis data={chartData} />}</div>
      </div>
    );
  };

  const RenderUserRoleChart = () => {
    const { handleAggregate, aggregateData } = useUser('');
    useEffect(() => {
      handleAggregate();
    }, []);

    return (
      <div className="card-body">
        <h5 className="card-title mb-2"></h5>
        <div>{aggregateData.length && <UserAggregates data={aggregateData} />}</div>
      </div>
    );
  };

  const StatCard = ({ title, count, icon, color, testId, onClick, helperText }) => (
    <div 
      className="col-sm-6 col-lg-3"
      style={{ cursor: 'pointer' }}
      onClick={onClick}
      data-testid={testId}
    >
      <Card 
        className="py-3 px-3" 
        style={{
          transition: 'all 0.3s ease',
          transformOrigin: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
        }}
      >
        <Card.Body>
          <div className="d-flex gap-3 flex-wrap align-items-top justify-content-between">
            <div className="flex-fill d-flex align-items-top mb-4 mb-sm-0">
              <div className="me-3">
                <span className={`avatar avatar-rounded bg-${color}`}>
                  <i className={`${icon} text-white fs-16`}></i>
                </span>
              </div>
              <div>
                <span className="d-block">{title}</span>
                <span className="fs-16 fw-semibold">{count}</span>
                {helperText && <small className="d-block text-muted mt-1" style={{ fontSize: '0.75rem' }}>{helperText}</small>}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );

  return (
    <>
      <div className="row ms-1 me-1">
        <StatCard
          title="Active Projects"
          count={activeProjects}
          icon="bi bi-boxes"
          color="info"
          testId="dashboard-active-projects-card"
          onClick={() => router.push('/protected/integrator/project?filter=active')}
          helperText="View projects"
        />

        <StatCard
          title="Schedules Accepted"
          count={schedulerStats.accepted}
          icon="bi bi-check-circle"
          color="secondary"
          testId="dashboard-accepted-schedules-card"
          onClick={() => router.push('/protected/integrator/scheduler/list?filter=accepted')}
          helperText="View schedules"
        />

        <StatCard
          title="In Progress"
          count={schedulerStats.inProgress}
          icon="bi bi-bootstrap-reboot"
          color="warning"
          testId="dashboard-in-progress-card"
          onClick={() => router.push('/protected/integrator/scheduler/list?filter=in-progress')}
          helperText="View schedules"
        />

        <StatCard
          title="Awaiting Payment"
          count={schedulerStats.awaitingPayment}
          icon="bi bi-credit-card"
          color="success"
          testId="dashboard-awaiting-payment-card"
          onClick={() => router.push('/protected/integrator/scheduler/list?filter=awaiting-payment')}
          helperText="Take action"
        />
      </div>
      <div className="row ms-1 me-1 mt-4 d-flex justify-content-between align-items-center">
        <div className="col-sm-6 col-lg-8  me-2">
          <div className="card-body">
            <RenderChart />
          </div>
        </div>
        <div className="col-sm-6 col-lg-3 d-flex justify-content-center align-items-center ">
          <div className="card-body">
            <RenderUserRoleChart />
          </div>
        </div>
      </div>
      <div className="row ms-1 me-1 card mt-4">
        <Card.Header className="ps-4">Recent Projects</Card.Header>
        <div className="card-body">
          <RecentProjects />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
