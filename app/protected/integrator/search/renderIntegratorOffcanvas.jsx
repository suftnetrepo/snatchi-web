import React from 'react';
import { Container, Offcanvas, Form, Row, Col } from 'react-bootstrap';
import { dateFormatted } from '../../../../utils/helpers';

const RenderIntegratorOffcanvas = ({ show, handleClose, data }) => {
  return (
    <Container className="mt-5">
      <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '30%', backgroundColor: 'white' }}>
        <Offcanvas.Header closeButton></Offcanvas.Header>
        <Offcanvas.Body>
          <Form>
            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label className="text-dark">Company</Form.Label>
                  <Form.Control type="text" readOnly value={data.name} className="border-dark" />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label className="text-dark">Mobile</Form.Label>
                  <Form.Control type="text" readOnly value={data.mobile} className="border-dark" />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label className="text-dark">Email</Form.Label>
                  <Form.Control type="text" readOnly value={data.email} className="border-dark" />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label className="text-dark">Status</Form.Label>
                  <Form.Control type="text" readOnly value={data.status} className="border-dark" />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="text-dark">Plan</Form.Label>
              <Form.Control type="text" readOnly value={data.plan} className="border-dark" />
            </Form.Group>

            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label className="text-dark">Start Date</Form.Label>
                  <Form.Control type="text" readOnly value={dateFormatted(data.startDate)} className="border-dark" />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label className="text-dark">End Date</Form.Label>
                  <Form.Control type="text" readOnly value={dateFormatted(data.endDate)} className="border-dark" />
                </Form.Group>
              </Col>
            </Row>

            {data.status === 'trialing' && (
              <Row className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label className="text-dark">Trial Start</Form.Label>
                    <Form.Control
                      type="text"
                      readOnly
                      value={dateFormatted(data.trial_start)}
                      className="border-dark"
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label className="text-dark">Trial End</Form.Label>
                    <Form.Control type="text" readOnly value={dateFormatted(data.trial_end)} className="border-dark" />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="text-dark">Description</Form.Label>
              <Form.Control as="textarea" rows={3} readOnly value={data.description} className="border-dark" />
            </Form.Group>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
};

export default RenderIntegratorOffcanvas;
