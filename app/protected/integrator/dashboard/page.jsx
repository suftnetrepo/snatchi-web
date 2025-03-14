'use client';

import React, { useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { getAggregate } from '../../../../utils/helpers';
import { useProjectDashboard } from '../../../../hooks/useProjectDashboard';
import {
  ProjectAnalysis,
  TotalInvested,
  NumberofInvested,
  Portfoliovalue,
  Returnsrate,
  UserAggregates
} from '../../../share/chart';
import RecentProjects from '../recentProjects';
import { useUser } from '../../../../hooks/useUser';

const Dashboard = () => {
  const { handleAggregate, data } = useProjectDashboard();

  useEffect(() => {
    handleAggregate();
  }, []);

  const RenderChart = () => {
    const { handleChartAggregate, data } = useProjectDashboard();
    useEffect(() => {
      handleChartAggregate();
    }, []);

    return (
      <div className="card-body">
        <h5 className="card-title mb-2"></h5>
        <div>{data && <ProjectAnalysis data={data} />}</div>
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

  return (
    <>
      <div className="row ms-1 me-1">
        <div className="col-sm-6 col-lg-3">
          <Card className=" py-3 px-3">
            <Card.Body>
              <div className="d-flex gap-3 flex-wrap align-items-top justify-content-between">
                <div className="flex-fill d-flex align-items-top mb-4 mb-sm-0">
                  <div className="me-3">
                    <span className="avatar avatar-rounded bg-info">
                      <i className="bi bi-boxes text-white fs-16"></i>
                    </span>
                  </div>
                  <div>
                    <span className="d-block">Total Projects</span>
                    <span className="fs-16 fw-semibold">{data?.totalProjects}</span>
                  </div>
                </div>
                <div>
                  <div id="total-investments">
                    <TotalInvested />
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-sm-6 col-lg-3">
          <Card className=" py-3 px-3">
            <Card.Body>
              <div className="d-flex gap-3 flex-wrap align-items-top justify-content-between">
                <div className="flex-fill d-flex align-items-top mb-4 mb-sm-0">
                  <div className="me-3">
                    <span className="avatar avatar-rounded bg-secondary">
                      <i className="bi bi-check-circle text-white fs-16"></i>
                    </span>
                  </div>
                  <div>
                    <span className="d-block">Completed</span>
                    <span className="fs-16 fw-semibold">{getAggregate(data?.statuses, 'Completed')}</span>
                  </div>
                </div>
                <div>
                  <div id="total-investments">
                    <NumberofInvested />
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-sm-6 col-lg-3">
          <Card className=" py-3 px-3">
            <Card.Body>
              <div className="d-flex gap-3 flex-wrap align-items-top justify-content-between">
                <div className="flex-fill d-flex align-items-top mb-4 mb-sm-0">
                  <div className="me-3">
                    <span className="avatar avatar-rounded bg-warning">
                      <i className="bi bi-bootstrap-reboot fs-16"></i>
                    </span>
                  </div>
                  <div>
                    <span className="d-block">In Progress</span>
                    <span className="fs-16 fw-semibold">
                      {getAggregate(data?.statuses, 'Progress')}
                      <i className="ti ti-arrow-narrow-up ms-1 text-success"></i>
                    </span>
                  </div>
                </div>
                <div>
                  <div id="portfolio-value">
                    <Portfoliovalue />
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-sm-6 col-lg-3">
          <Card className=" py-3 px-3">
            <Card.Body>
              <div className="d-flex gap-3 flex-wrap align-items-top justify-content-between">
                <div className="flex-fill d-flex align-items-top mb-4 mb-sm-0">
                  <div className="me-3">
                    <span className="avatar avatar-rounded bg-success">
                      <i className="bi bi-stopwatch text-white fs-19"></i>
                    </span>
                  </div>
                  <div>
                    <span className="d-block">Pending</span>
                    <span className="fs-16 fw-semibold">
                      {getAggregate(data?.statuses, 'Pending')}
                      <i className="ti ti-arrow-narrow-up ms-1 text-success"></i>
                    </span>
                  </div>
                </div>
                <div>
                  <div id="returns-rate">
                    <Returnsrate />
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
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
