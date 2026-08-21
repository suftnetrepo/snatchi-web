import { useState } from 'react';
import { Alert, Button, Container, Offcanvas, Form, Row, Col } from 'react-bootstrap';
import { dateFormatted } from '../../../utils/helpers';

const RenderIntegratorOffcanvas = ({ show, handleClose, data }) => {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const suspended = data.adminSuspension?.suspended || data.status === 'suspended';

  const updateAccess = async () => {
    if (reason.trim().length < 8) return setMessage('Enter an operational reason of at least 8 characters.');
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/organisations/${data._id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspended: !suspended, reason: reason.trim() })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Access update failed');
      setMessage(`Organisation ${suspended ? 'restored' : 'suspended'}. Refresh the table to see the new status.`);
      setReason('');
    } catch (error) { setMessage(error.message); } finally { setSaving(false); }
  };
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
            <hr />
            <h2 className="h6 text-dark">Organisation access control</h2>
            <p className="small text-muted">This is reversible and does not alter the Stripe subscription.</p>
            {message && <Alert variant="info">{message}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label className="text-dark">Operational reason</Form.Label>
              <Form.Control as="textarea" rows={2} value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} />
            </Form.Group>
            <Button variant={suspended ? 'success' : 'danger'} disabled={saving || !data._id} onClick={updateAccess}>
              {saving ? 'Saving…' : suspended ? 'Restore organisation' : 'Suspend organisation'}
            </Button>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
};

export default RenderIntegratorOffcanvas;
