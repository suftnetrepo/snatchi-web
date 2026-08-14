'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getAggregate } from '@/utils/helpers';
import { useProjectDashboard } from '@/hooks/useProjectDashboard';
import {
  PROJECT_STATUS,
  SCHEDULER_STATUS,
  normalizeSchedulerStatus,
  isSchedulerAwaitingPayment
} from '@/app/api/constants/statuses';
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
import OnboardingChecklist from './onboardingChecklist';

const Dashboard = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { handleAggregate, data, error: dashboardError } = useProjectDashboard();
  const [schedulerStats, setSchedulerStats] = useState({
    awaitingApproval: 0,
    awaitingPayment: 0,
    readyToStart: 0
  });
  const [activeProjects, setActiveProjects] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [onboardingResolved, setOnboardingResolved] = useState(false);

  const currentIntegratorId = session?.user?.integrator || session?.user?.integrator_id || null;
  const dashboardReady = data !== null || Boolean(dashboardError);
  const initialViewReady = dashboardReady && onboardingResolved;
  const handleOnboardingResolved = useCallback(() => setOnboardingResolved(true), []);

  // Memoize fetchSchedulerStats to prevent infinite loops
  const fetchSchedulerStats = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        action: 'getAllSchedules'
      });
      const response = await zat(SCHEDULER.getByEngineer, null, VERBS.GET, params);

      if (response.success && response.data) {
        const schedules = response.data;

        const isReceivingIntegratorSchedule = (schedule) =>
          (schedule.receivingIntegratorId?._id || schedule.receivingIntegratorId) === currentIntegratorId;

        const isPayingIntegratorSchedule = (schedule) =>
          (schedule.payingIntegrator?._id || schedule.payingIntegrator || schedule.integrator) === currentIntegratorId;

        const awaitingApprovalCount = schedules.filter(
          (s) => normalizeSchedulerStatus(s.status) === SCHEDULER_STATUS.ACCEPTED && isReceivingIntegratorSchedule(s)
        ).length;

        const awaitingPaymentCount = schedules.filter(
          (s) =>
            isPayingIntegratorSchedule(s) &&
            (s.receivingIntegratorId?._id || s.receivingIntegratorId) !== currentIntegratorId &&
            s.receivingIntegratorId?.connectAccountStatus === 'verified' &&
            s.receivingIntegratorId?.chargesEnabled &&
            s.receivingIntegratorId?.payoutsEnabled &&
            isSchedulerAwaitingPayment(s)
        ).length;

        const readyToStartCount = schedules.filter(
          (s) => normalizeSchedulerStatus(s.status) === SCHEDULER_STATUS.READY_TO_START
        ).length;

        setSchedulerStats({
          awaitingApproval: awaitingApprovalCount,
          awaitingPayment: awaitingPaymentCount,
          readyToStart: readyToStartCount
        });
      }
    } catch (error) {
      console.error('Failed to fetch scheduler stats:', error);
    }
  }, [currentIntegratorId]);

  // Memoize calculateActiveProjects to prevent infinite loops
  const calculateActiveProjects = useCallback(() => {
    // Active projects exclude terminal project states.
    const completed = getAggregate(data?.statuses, PROJECT_STATUS.COMPLETED) || 0;
    const canceled = getAggregate(data?.statuses, PROJECT_STATUS.CANCELED) || 0;
    const total = data?.totalProjects || 0;
    setActiveProjects(Math.max(0, total - completed - canceled));
  }, [data?.totalProjects, data?.statuses]);

  // Initialize dashboard data only once on mount
  useEffect(() => {
    if (!hasInitialized) {
      handleAggregate();
      setHasInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialized]);

  useEffect(() => {
    if (currentIntegratorId) {
      fetchSchedulerStats();
    }
  }, [currentIntegratorId, fetchSchedulerStats]);

  // Update active projects when data changes
  useEffect(() => {
    if (data?.totalProjects !== undefined) {
      calculateActiveProjects();
    }
  }, [data?.totalProjects, data?.statuses, calculateActiveProjects]);

  const RenderChart = () => {
    const { handleChartAggregate, data: chartData } = useProjectDashboard();
    const [resolved, setResolved] = useState(false);
    useEffect(() => {
      let active = true;
      handleChartAggregate().finally(() => {
        if (active) setResolved(true);
      });
      return () => {
        active = false;
      };
    }, []);

    const hasProjectActivity = Array.isArray(chartData?.projects) && chartData.projects.some((count) => count > 0);
    const hasProjects = (data?.totalProjects || 0) > 0;

    if (!resolved) {
      return (
        <div className="card-body placeholder-glow" aria-label="Loading project activity" aria-busy="true">
          <span className="placeholder col-4 mb-4" />
          <div className="d-flex align-items-end gap-3 py-4" style={{ minHeight: 220 }}>
            {[45, 70, 38, 82, 55, 68, 42].map((height, index) => (
              <span
                className="placeholder flex-fill rounded-top"
                key={index}
                style={{ height: `${height}%`, minHeight: 32 }}
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="card-body">
        <h5 className="card-title mb-2">Project activity</h5>
        <p className="text-muted mb-3">Projects created in the last 7 days</p>
        {hasProjectActivity || hasProjects ? (
          <ProjectAnalysis data={chartData} />
        ) : (
          <div className="d-flex min-vh-25 flex-column align-items-center justify-content-center py-5 text-center">
            <i className="bi bi-bar-chart fs-2 text-muted mb-2" aria-hidden="true" />
            <strong className="text-dark">No project activity yet</strong>
            <span className="text-muted mt-1">Activity will appear here after your first project is created.</span>
            <button
              type="button"
              className="btn btn-primary mt-3"
              onClick={() => router.push('/protected/integrator/project/create')}
            >
              Create first project
            </button>
          </div>
        )}
      </div>
    );
  };

  const RenderUserRoleChart = () => {
    const { handleAggregate, aggregateData } = useUser('');
    const [resolved, setResolved] = useState(false);
    useEffect(() => {
      let active = true;
      handleAggregate().finally(() => {
        if (active) setResolved(true);
      });
      return () => {
        active = false;
      };
    }, []);

    if (!resolved) {
      return (
        <div className="card-body placeholder-glow text-center" aria-label="Loading team overview" aria-busy="true">
          <span className="placeholder col-7 mb-4 d-inline-block" />
          <span className="placeholder rounded-circle d-block mx-auto" style={{ width: 180, height: 180 }} />
        </div>
      );
    }

    return (
      <div className="card-body text-center">
        <h5 className="card-title mb-2">Team Overview</h5>
        <div className="d-flex justify-content-center">
          {aggregateData.length > 0 ? (
            <UserAggregates data={aggregateData} />
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
              <i className="bi bi-people fs-2 text-muted mb-2" aria-hidden="true" />
              <strong className="text-dark">Your team is ready to grow</strong>
              <span className="text-muted mt-1">Add an engineer to see your team overview.</span>
              <button
                type="button"
                className="btn btn-outline-primary mt-3"
                onClick={() => router.push('/protected/integrator/user')}
              >
                Add engineer
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const StatCard = ({ title, count, icon, color, testId, onClick, helperText }) => (
    <div className="col-sm-6 col-lg-3" style={{ cursor: 'pointer' }} onClick={onClick} data-testid={testId}>
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
                {helperText && (
                  <small className="d-block text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                    {helperText}
                  </small>
                )}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );

  return (
    <>
      {!initialViewReady && (
        <div className="px-3 py-4" aria-label="Loading dashboard" aria-busy="true">
          <div className="row g-3 placeholder-glow">
            {[0, 1, 2, 3].map((item) => (
              <div className="col-sm-6 col-lg-3" key={item}>
                <div className="card p-4">
                  <span className="placeholder col-7 mb-3" />
                  <span className="placeholder col-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className={initialViewReady ? '' : 'd-none'}>
        <OnboardingChecklist dashboardReady={dashboardReady} onResolved={handleOnboardingResolved} />
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
            title="Awaiting Approval"
            count={schedulerStats.awaitingApproval}
            icon="bi bi-hourglass-split"
            color="secondary"
            testId="dashboard-awaiting-approval-card"
            onClick={() => router.push('/protected/integrator/scheduler/list?filter=awaiting-approval')}
            helperText="Review engineer bookings"
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

          <StatCard
            title="Ready To Start"
            count={schedulerStats.readyToStart}
            icon="bi bi-play-circle"
            color="warning"
            testId="dashboard-ready-to-start-card"
            onClick={() => router.push('/protected/integrator/scheduler/list?filter=ready-to-start')}
            helperText="Start scheduled work"
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
      </div>
    </>
  );
};

export default Dashboard;
