/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useEffect } from 'react';
import { Card, CardBody } from 'react-bootstrap';

import UserChart from '../UserChart';
import IncomeChart from '../IncomeChart';
import ConversionChart from '../ConversionChart';
import SessionChart from '../SessionChart';
import { useAppContext } from '../../../../Store/AppContext';
import { useDashboard } from '../../../../hooks/useDashboard';
import { getAdminAggregate } from '../../../../utils/helpers';
import RecentUsers from '../recentUsers';
import UserSignOnChart from '../userSignOnChart';
import UserPolarChart from '../userPolarChart';

const Dashboard = () => {
  const { currentUser } = useAppContext();
  const { handleAggregate, data } = useDashboard();

  useEffect(() => {
    handleAggregate();
  }, []);

  return (
    <>
      <div className="row">
        <div className="col-sm-6 col-lg-3">
          <Card bg="primary" text="white" className="mb-4 ps-3 pt-2">
            <CardBody className="pb-0 d-flex justify-content-between align-items-start">
              <div>
                <div className="fs-24 fw-semibold">{getAdminAggregate(data, 'active')}</div>
                <div>Active</div>
              </div>
            </CardBody>
            <div className="mt-3 mx-3" style={{ height: '70px' }}>
              <UserChart />
            </div>
          </Card>
        </div>

        <div className="col-sm-6 col-lg-3">
          <Card bg="info" text="white" className="mb-4 ps-3 pt-2">
            <CardBody className="pb-0 d-flex justify-content-between align-items-start">
              <div>
                <div className="fs-24 fw-semibold">{getAdminAggregate(data, 'inactive')}</div>
                <div>In Active</div>
              </div>
            </CardBody>
            <div className="mt-3 mx-3" style={{ height: '70px' }}>
              <IncomeChart />
            </div>
          </Card>
        </div>

        <div className="col-sm-6 col-lg-3">
          <Card bg="warning" text="white" className="mb-4 ps-3 pt-2">
            <CardBody className="pb-0 d-flex justify-content-between align-items-start">
              <div>
                <div className="fs-24 fw-semibold">{getAdminAggregate(data, 'unpaid')}</div>
                <div>Unpaid</div>
              </div>
            </CardBody>
            <div className="mt-3 mx-3" style={{ height: '70px' }}>
              <ConversionChart />
            </div>
          </Card>
        </div>

        <div className="col-sm-6 col-lg-3">
          <Card bg="danger" text="white" className="mb-4 ps-3 pt-2">
            <CardBody className="pb-0 d-flex justify-content-between align-items-start">
              <div>
                <div className="fs-24 fw-semibold">{getAdminAggregate(data, 'canceled')}</div>
                <div>Canceled</div>
              </div>
            </CardBody>
            <div className="mt-3 mx-3" style={{ height: '70px' }}>
              <SessionChart />
            </div>
          </Card>
        </div>
      </div>
      <div className="row ms-1 me-1 d-flex justify-content-between align-items-center">
        <div className="col-sm-6 col-lg-8  me-2 card p-4">
          <Card.Header className="ps-4 mb-2">Weekly SignOn Users</Card.Header>
          <div className="card-body">
            <div style={{ maxWidth: '100%' }}>
              <UserSignOnChart />
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3 d-flex justify-content-center align-items-center ">
          <div className="card-body">
            <div style={{ maxWidth: '100%' }}>{data?.length > 0 && <UserPolarChart data={data} />}</div>
          </div>
        </div>
      </div>
      <div className="row ms-1 me-1 card mt-4">
        <Card.Header className="ps-4">Recent Subscribers</Card.Header>
        <div className="card-body">
          <RecentUsers />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
