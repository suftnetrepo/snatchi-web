import React from 'react';
import { Offcanvas } from 'react-bootstrap';
import {
  MdCancel,
  MdCalendarToday,
  MdLabel,
} from 'react-icons/md';
import { Card, Container, Row, Col, Badge, Table, ListGroup, Tab, Tabs } from 'react-bootstrap';
import { getStatusBadgeVariant, getPriorityBadgeVariant, getIcon, getIconColor } from '@/utils/helpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import RenderTaskComment from './renderComments';
import { useAppContext } from '@/Store/AppContext';

const RenderTaskOffcanvas = ({ show, task }) => {
  const { showTaskOffCanvas } = useAppContext();

  const handleClose = () => {
    showTaskOffCanvas(false, null);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '50%', backgroundColor: 'white' }}>
      <div className="d-flex flex-row justify-content-between align-items-center p-2 pe-8">
        <div className="d-flex flex-column justify-content-start align-items-start"></div>
        <div>
          <MdCancel size={48} color="black" onClick={handleClose} className="pointer" />
        </div>
      </div>
      <Offcanvas.Body>
        <Container className="my-1">
          <Card className="shadow-sm mb-4">
            <Card.Header className=" text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">{task?.name}</h3>
                <Badge bg={getStatusBadgeVariant(task?.status)} className="fs-14">
                  {task?.status}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                <Col md={12}>
                  <div className="mb-3 mt-3">
                    <h5 className="text-secondary">Task Description</h5>
                    <div dangerouslySetInnerHTML={{ __html: task?.description }} className="text-gray-600" />
                  </div>

                  <div className="mb-3">
                    <h5 className="text-secondary">Task Details</h5>
                    <Row>
                      <Col md={6}>
                        <Table className="table-borderless">
                          <tbody>
                            <tr>
                              <td className="pe-3">
                                <MdCalendarToday size={18} className="text-primary me-2" />
                              </td>
                              <td className="fw-bold">Start Date:</td>
                              <td>{formatDate(task?.startDate)}</td>
                            </tr>
                            <tr>
                              <td>
                                <MdLabel size={18} className="text-primary me-2" />
                              </td>
                              <td className="fw-bold">Priority:</td>
                              <td>
                                <Badge bg={getPriorityBadgeVariant(task?.priority)}>{task?.priority}</Badge>
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                      <Col md={6}>
                        <Table className="table-borderless">
                          <tbody>
                            <tr>
                              <td>
                                <MdCalendarToday size={18} className="text-primary me-2" />
                              </td>
                              <td className="fw-bold">End Date:</td>
                              <td>{formatDate(task?.endDate)}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>

              <Tabs defaultActiveKey="comments" className="mb-3">
                <Tab eventKey="comments" title="Comments">
                  <RenderTaskComment comments={task.comments} projectId={task.project} taskId={task._id} />
                </Tab>
                <Tab eventKey="attachments" title="Documents">
                  {task?.attachments?.length > 0 ? (
                    <Row>
                      <ListGroup>
                        {task?.attachments?.map((document, index) => {
                          return (
                            <ListGroup.Item
                              key={`${index}-${document._id}`}
                              as="li"
                              className="d-flex justify-content-between align-items-center"
                            >
                              <div className="d-flex justify-content-start align-items-center me-auto">
                                <FontAwesomeIcon
                                  icon={getIcon(document.document_type)}
                                  style={{ color: getIconColor(document.document_type), fontSize: '20px' }}
                                ></FontAwesomeIcon>
                                <div className="fw-normal ms-1">
                                  {' '}
                                  <a href={document.secure_url} target="_blank" rel="noopener noreferrer">
                                    {document.document_name}
                                  </a>
                                </div>
                              </div>
                            </ListGroup.Item>
                          );
                        })}
                      </ListGroup>
                    </Row>
                  ) : (
                    <p className="text-muted">No attachments available.</p>
                  )}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Container>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default RenderTaskOffcanvas;
