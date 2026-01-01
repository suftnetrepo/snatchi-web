import React from 'react';
import { Offcanvas } from 'react-bootstrap';
import {
  MdCancel,
  MdCalendarToday,
  MdWork,
  MdLabel,
  MdBuild,
  MdCheckBox,
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdAccessTime,
  MdInsertDriveFile
} from 'react-icons/md';
import { Card, Container, Row, Col, Badge, Table, ListGroup, Tab, Tabs } from 'react-bootstrap';
import { getStatusBadgeVariant, getPriorityBadgeVariant, getIcon, getIconColor, getPriorityStatusColorCode, getStatusColorCode } from '@/utils/helpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppContext } from '@/Store/AppContext';

const RenderProjectOffcanvas = ({ show, handleClose, project }) => {
  const { showTaskOffCanvas } = useAppContext();
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
                <h3 className="mb-0">{project?.name}</h3>
                 <span className={`badge ${getStatusColorCode(project?.status)}`}>{project?.status}</span>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                <Col md={12}>
                  <div>
                    <Row>
                      <Col md={6}>
                        <Table className="table-borderless">
                          <tbody>
                            <tr>
                              <td className="pe-3">
                                <MdCalendarToday size={18} className="text-primary me-2" />
                              </td>
                              <td className="fw-bold">Start Date:</td>
                              <td>{formatDate(project?.startDate)}</td>
                            </tr>

                            <tr>
                              <td>
                                <MdWork size={18} className="text-primary me-2" />
                              </td>
                              <td className="fw-bold">Project Number:</td>
                              <td>{project?.project_number}</td>
                            </tr>
                            <tr>
                              <td>
                                <MdLabel size={18} className="text-primary me-2" />
                              </td>
                              <td className="fw-bold">Priority:</td>
                              <td>
                                 <span className={`badge ${getPriorityStatusColorCode(project?.priority)} transparent`}>{project?.priority}</span>
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
                              <td>{formatDate(project?.endDate)}</td>
                            </tr>

                            <tr>
                              <td>
                                <MdBuild size={18} className="text-primary me-2" />
                              </td>
                              <td className="fw-bold">PPE Required:</td>
                              <td>{project?.ppe?.join(', ')}</td>
                            </tr>
                            <tr>
                              
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                  </div>
                </Col>

                <Col md={12}>
                  {project?.first_name && project?.last_name && (
                    <Card className="border mb-3">
                      <Card.Header className="bg-light ps-4">
                        <h5 className="mb-0">Contact Information</h5>
                      </Card.Header>
                      <Card.Body className="ps-4 py-2">
                        <ul className="list-unstyled">
                          <li className="mb-2">
                            <strong>Name:</strong> {project?.first_name} {project?.last_name}
                          </li>
                          <li>
                            <MdPhone size={16} className="text-primary me-2" /> {project?.mobile}
                          </li>
                          <li>
                            <MdEmail size={16} className="text-primary me-2" /> {project?.email}
                          </li>
                        </ul>
                      </Card.Body>
                    </Card>
                  )}

                  <Card className="border">
                    <Card.Header className="bg-light ps-4">
                      <h5 className="mb-0">Site Address</h5>
                    </Card.Header>
                    <Card.Body>
                      <p className="mt-4 ps-4">
                        <MdLocationOn size={16} className="text-primary me-2" /> {project?.completeAddress}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Tabs defaultActiveKey="description" className="mb-3">
                <Tab eventKey="description" title="Description">
                   <div className="mb-3 mt-3">
                    <div dangerouslySetInnerHTML={{ __html: project?.description }} className="text-gray-600" />
                  </div>
                </Tab>
                <Tab eventKey="attachments" title="Documents">
                  {project?.attachments?.length > 0 ? (
                    <Row>
                      <ListGroup>
                        {project?.attachments?.map((document, index) => {
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

export default RenderProjectOffcanvas;
