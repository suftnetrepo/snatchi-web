'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { Container, Row, Col, Card, Image } from 'react-bootstrap';
import { FaClock } from 'react-icons/fa';
import ProgressBar from '../../../../src/components/common/ProgressBar';
import {
  getStatusColorCode,
  getRandomColor,
  getInitials,
  getDaysLeftColor,
  daysLeft,
  dateFormatted
} from '@/utils/helpers';
import RenderProjectOffcanvas from './renderProjectOffcanvas';
import { useSession } from 'next-auth/react';

const Page = () => {
  const { data: session } = useSession();
  const { data, handleFetchUserProjects, handleFilterProjects, search_term } = useProject();
  const [show, setShow] = useState(false);
  const [project, setProject] = useState();

  useEffect(() => {
    handleFetchUserProjects(session?.user?.id || '679735d6e0a110edbc266745');
  }, []);

  const handleClose = () => {
    setShow(false);
    setProject(null);
  };
  const handleShow = (project) => {
    setShow(true);
    setProject(project);
  };

  return (
    <Container fluid className="py-8 px-8">
      <Row className="mb-4 align-items-start">
        <input
          type="text"
          className="form-control w-25 border-dark"
          placeholder="Search..."
          value={search_term}
          onChange={(e) => handleFilterProjects(e.target.value)}
        />
      </Row>
      <Row>
        {data.map((project) => {
          const daysleft = daysLeft(project);
          return (
            <Col
              md={6}
              lg={4}
              xl={3}
              key={project._id}
              style={{ width: '21rem' }}
              className="mb-2 py-2 shadow-lg border rounded me-2"
            >
              <Card className="h-100 shadow-sm" onClick={() => handleShow(project)}>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-3">
                    <div
                      className={`d-flex align-items-center justify-content-center rounded bg-${getRandomColor()} text-white`}
                      style={{ width: '48px', height: '48px', fontSize: '16px' }}
                    >
                      {getInitials(project.name)}
                    </div>
                  </div>

                  <h5 className="">
                    <span className="text-dark fw-normal fs-18"> {project.name}</span>
                    <div className="flex-fill">
                      <span className="text-muted d-block fs-14">
                        Total{' '}
                        <strong className="text-default">
                          {project.completedTasks}/{project.totalTasks}
                        </strong>{' '}
                        tasks completed
                      </span>
                    </div>
                  </h5>
                  <div className="d-flex align-items-center justify-content-start">
                    <span className={`badge ${getStatusColorCode(project.status)}`}>{project.status}</span>
                  </div>

                  <p className="small text-muted mb-2 mt-2">{project.completeAddress}</p>

                  <span className="text-dark me-2">Status</span>
                  <div className="d-flex row align-items-center">
                    <ProgressBar value={project.progress} max={100} />
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div className={`d-flex align-items-center ${getDaysLeftColor(daysleft)}`}>
                      <FaClock size={16} className="me-1" />
                      <small>{daysleft} days left</small>
                    </div>

                    <div className="d-flex">
                      {project.assignedTo?.slice(0, 3).map((_, index) => (
                        <Image
                          key={index}
                          src={`/img/faces/9.jpg`}
                          roundedCircle
                          width={28}
                          height={28}
                          className="border border-white ms-n2"
                          alt="User avatar"
                        />
                      ))}
                    </div>
                  </div>
                </Card.Body>
                <Card.Footer className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-14 d-block">Start Date </span>
                    <span className="fw-normal fs-14 d-block">{dateFormatted(project.startDate)}</span>
                  </div>
                  <div className="text-end">
                    <span className="text-muted fs-14 d-block">End Date </span>
                    <span className="fw-normal fs-14 d-block">{dateFormatted(project.endDate)}</span>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          );
        })}
      </Row>
      <RenderProjectOffcanvas project={project} show={show} handleClose={handleClose} setShow={setShow} />
    </Container>
  );
};

export default Page;
