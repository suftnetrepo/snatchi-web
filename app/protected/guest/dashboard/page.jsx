'use client';

import React, { useEffect } from 'react';
import { useProject } from '@/hooks/useProject';
import { Container, Row, Col, Card, Form, InputGroup, ProgressBar, Dropdown, Badge, Button } from 'react-bootstrap';
import { Search, Filter, Grid3x3, List, Clock } from 'lucide-react';

const Page = () => {
  const { data, handleFetchUserProjects } = useProject();

  useEffect(() => {
    handleFetchUserProjects('679735d6e0a110edbc266745');
  }, []);

  console.log('.........................data', data);

  const projectsData = [
    {
      _id: '67bc2cabbb47cab9f8a15709',
      name: 'Live Streaming & Recording System for a Church',
      description:
        'Multi-Camera Setup, Live Streaming to Social Media, On-Demand Video Recording, Integrated Audio System, Volunteer-Friendly Control System',
      status: 'Pending',
      priority: 'Medium',
      progress: 48,
      daysLeft: 7,
      assignedTo: [
        { id: '679735d6e0a110edbc266745' },
        { id: '67973603e0a110edbc266747' },
        { id: '68132f34e0e7ea2c3839b91d' }
      ],
      url: 'springfieldmedia.com',
      shortDescription: 'Multimedia content studio. Simply unique'
    },
    {
      _id: '67bc2c1ebb47cab9f8a156eb',
      name: 'Deploy a cloud-based digital signage system for a retail chain',
      description:
        'Dynamic Content Management, Scheduling System, Interactive Kiosks, Multi-Screen Synchronization, Remote Monitoring & Analytics',
      status: 'Pending',
      priority: 'Medium',
      progress: 64,
      daysLeft: 4,
      assignedTo: [
        { id: '679735d6e0a110edbc266745' },
        { id: '67973603e0a110edbc266747' },
        { id: '68132f34e0e7ea2c3839b91d' }
      ],
      url: 'homechoice.com',
      shortDescription: 'Resource that allows you to buy a cheap accommodation in a steep place'
    },
    {
      _id: '67bc2bd0bb47cab9f8a156e9',
      name: 'Design and implement an AV system for a modern conference room',
      description:
        'Video Conferencing System, Wireless Presentation, Smart Audio System, Automated Lighting & Blinds, Touch Panel Control',
      status: 'Pending',
      priority: 'High',
      progress: 94,
      daysLeft: 2,
      assignedTo: [{ id: '67973603e0a110edbc266747' }, { id: '679735d6e0a110edbc266745' }],
      url: 'sportsinteractive.com',
      shortDescription: 'Web resource which contains all about transfers in the world of sports'
    },
    {
      _id: '67bc2bd0bb47cab9f8a156e1',
      name: 'Big Money Real Estate',
      description: 'Luxury real estate services',
      status: 'In Progress',
      priority: 'Medium',
      progress: 59,
      daysLeft: 5,
      assignedTo: [
        { id: '679735d6e0a110edbc266740' },
        { id: '67973603e0a110edbc266741' },
        { id: '68132f34e0e7ea2c3839b910' }
      ],
      url: 'bigmoneyrealestate.com',
      shortDescription: 'Agency that specializes in luxury real estate in Monte Carlo'
    },
    {
      _id: '67bc2bd0bb47cab9f8a156e2',
      name: 'Regular logistics',
      description: 'Logistic services',
      status: 'In Progress',
      priority: 'Low',
      progress: 35,
      daysLeft: 10,
      assignedTo: [{ id: '679735d6e0a110edbc266742' }],
      url: 'regularlogistics.com',
      shortDescription: 'Logistic company that specializes in regular shipments within Europe'
    },
    {
      _id: '67bc2bd0bb47cab9f8a156e3',
      name: 'Foursquares agency',
      description: 'Marketing and advertising',
      status: 'In Progress',
      priority: 'Medium',
      progress: 50,
      daysLeft: 8,
      assignedTo: [{ id: '679735d6e0a110edbc266743' }, { id: '67973603e0a110edbc266744' }],
      url: 'foursquaresagency.com',
      shortDescription: 'Creative agency that deals with advertising and marketing'
    },
    {
      _id: '67bc2bd0bb47cab9f8a156e4',
      name: 'Piece studio',
      description: 'Interactive events',
      status: 'Completed',
      priority: 'High',
      progress: 100,
      daysLeft: 0,
      assignedTo: [{ id: '679735d6e0a110edbc266745' }, { id: '67973603e0a110edbc266747' }],
      url: 'piecestudio.com',
      shortDescription: 'Studio that specializes in interactive events'
    },
    {
      _id: '67bc2bd0bb47cab9f8a156e5',
      name: 'Legacy foundation',
      description: 'Building confidence',
      status: 'In Progress',
      priority: 'Medium',
      progress: 75,
      daysLeft: 3,
      assignedTo: [{ id: '679735d6e0a110edbc266748' }, { id: '67973603e0a110edbc266749' }],
      url: 'legacyfoundation.com',
      shortDescription: 'Foundation that helps people to be more confident and achieve their goals'
    }
  ];

  // Generate random color for the project icon
  const getRandomColor = () => {
    const colors = ['primary', 'info', 'success', 'warning', 'danger', 'secondary'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Generate initials for project icon
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Progress bar variant based on progress
  const getProgressVariant = (progress) => {
    if (progress < 30) return 'danger';
    if (progress < 70) return 'warning';
    return 'success';
  };

  // Days left indicator color
  const getDaysLeftColor = (days) => {
    if (days <= 2) return 'text-danger';
    if (days <= 5) return 'text-warning';
    return 'text-primary';
  };

  // Avatar placeholder
  const Avatar = ({ index }) => {
    const colors = ['bg-primary', 'bg-success', 'bg-info', 'bg-warning', 'bg-danger'];
    return (
      <div
        className={`rounded-circle ${colors[index % colors.length]} text-white d-flex align-items-center justify-content-center`}
        style={{ width: '32px', height: '32px', fontSize: '14px' }}
      >
        {String.fromCharCode(65 + index)}
      </div>
    );
  };

  return (
    <Container fluid className="py-4">
      {/* Header with search and filters */}
      <Row className="mb-4 align-items-center">
        <Col md={4}>
          <InputGroup>
            <InputGroup.Text className="bg-light border-end-0">
              <Search size={18} />
            </InputGroup.Text>
            <Form.Control placeholder="Search a project" className="border-start-0 bg-light" />
          </InputGroup>
        </Col>
        <Col md={8} className="d-flex justify-content-end align-items-center">
          <span className="text-muted me-2">Sort by</span>
          <Dropdown className="me-3">
            <Dropdown.Toggle variant="light" id="dropdown-sort" className="d-flex align-items-center">
              Project progress
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item>Project progress</Dropdown.Item>
              <Dropdown.Item>Date created</Dropdown.Item>
              <Dropdown.Item>Priority</Dropdown.Item>
              <Dropdown.Item>Name</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Button variant="light" className="me-2">
            <Filter size={18} />
          </Button>
          <div className="btn-group">
            <Button variant="light" className="active">
              <Grid3x3 size={18} />
            </Button>
            <Button variant="light">
              <List size={18} />
            </Button>
          </div>
        </Col>
      </Row>

      {/* Projects grid */}
      <Row>
        {projectsData.map((project, index) => (
          <Col md={6} lg={4} xl={3} key={project._id} style={{ width: '21rem' }} className="mb-2 py-2 shadow-lg border rounded me-2">
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between mb-3">
                  <div
                    className={`d-flex align-items-center justify-content-center rounded bg-${getRandomColor()} text-white`}
                    style={{ width: '48px', height: '48px', fontSize: '16px' }}
                  >
                    {getInitials(project.name)}
                  </div>
                  <Button variant="light" size="sm" className="p-1">
                  
                  </Button>
                </div>

                <h5 className="mb-1">
                  {project.name.length > 25 ? `${project.name.substring(0, 25)}...` : project.name}
                </h5>
                <p className="text-muted small mb-2">
                  <a
                    href={`https://${project.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none text-muted"
                  >
                    {project.url}
                  </a>
                </p>

                <p className="small text-muted mb-4">{project.shortDescription}</p>

                <ProgressBar now={project.progress} variant={getProgressVariant(project.progress)} className="mb-3" />

                <div className="d-flex justify-content-between align-items-center">
                  <div className={`d-flex align-items-center ${getDaysLeftColor(project.daysLeft)}`}>
                    <Clock size={16} className="me-1" />
                    <small>{project.daysLeft} days left</small>
                  </div>

                  <div className="d-flex">
                    {project.assignedTo.slice(0, 3).map((member, idx) => (
                      <div key={member.id} style={{ marginLeft: idx > 0 ? '-8px' : '0' }}>
                        <Avatar index={idx} />
                      </div>
                    ))}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Page;
