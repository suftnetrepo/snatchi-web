/* eslint-disable jsx-a11y/alt-text */
'use client';
import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { dateFormatted } from '../../../../utils/helpers';
import { useSettings } from '../../../../hooks/useSettings';
import { validate } from '../../../../validator/validator';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import { OkDialogue } from '../../../../src/components/elements/errorDialogue';
import { useSubscriber } from '../../../../hooks/useSubscriber';
import { useStripeConnectStatus } from '../../../../hooks/useStripeConnectStatus';

const SettingsPage = () => {
  const { handleSave, handleChange, rules, loading, error, fields, success, handleSaveChangePassword } = useSettings();
  const { handleCustomerPortalSession } = useSubscriber();
  const { connectStatus, connectLoading, connectError, fetchConnectStatus, handleCreateOnboarding, handleRefreshOnboarding } = useStripeConnectStatus();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState('profile');
  const [errorMessages, setErrorMessages] = useState({});
  const [file, setFile] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [connectSuccess, setConnectSuccess] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Fetch Connect account status when component mounts
  useEffect(() => {
    fetchConnectStatus();
  }, []);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'onboarding_started':
        return 'info';
      case 'requirements_pending':
        return 'warning';
      case 'verification_failed':
        return 'danger';
      case 'restricted':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'not_started': 'Not Started',
      'onboarding_started': 'Onboarding In Progress',
      'verified': 'Verified ✓',
      'restricted': 'Restricted',
      'requirements_pending': 'Additional Information Needed',
      'verification_failed': 'Verification Failed'
    };
    return labels[status] || status;
  };

  const handleImageClick = () => {
    document.getElementById('file-input').click();
  };

  const handleFileChange = (e) => {
    setPreviewUrl(null);
    const selectedFile = e.target.files[0];

    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const onSubmit = async () => {
    setErrorMessages({});
    const validationResult = validate(fields, rules);

    if (validationResult.hasError) {
      setErrorMessages(validationResult.errors);
      return;
    }

    const formData = new FormData();
    formData.append('description', fields.description);
    if (file) {
      formData.append('file', file);
    }
    formData.append('name', fields.name);
    formData.append('email', fields.email);
    formData.append('mobile', fields.mobile);

    await handleSave(formData);
  };

  const handleSubmit = (fields) => {
    const body = {
      stripeCustomerId: fields.stripeCustomerId
    };
    handleCustomerPortalSession(body).then((result) => {
      if (result?.url) {
        if (result?.url) {
          window.location.href = result.url;
        }
      }
    });
  };

  const handleSavePassword = async (fields) => {
    await handleSaveChangePassword({ password: fields.password });
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case 'profile':
        return (
          <Form>
            <Row className="mb-3">
              <Col xs={12} md={4}>
                <div className="d-flex flex-column justify-content-start align-items-start">
                  <div
                    style={{
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      backgroundColor: '#ccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                    className="mb-3"
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Avatar Preview"
                        className="img-fluid rounded-circle"
                        style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                      />
                    ) : fields.secure_url ? (
                      <img
                        src={fields.secure_url}
                        alt="Avatar"
                        className="img-fluid rounded-circle"
                        style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/img/blank.png';
                        }}
                      />
                    ) : (
                      <span>150 x 150</span>
                    )}
                  </div>

                  <Button variant="success" className="mb-2 mt-3" onClick={handleImageClick}>
                    Change picture
                  </Button>
                </div>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Row className="mb-1">
                  <Col>
                    <Form.Group>
                      <Form.Label className="text-dark">Company</Form.Label>
                      <Form.Control
                        type="text"
                        value={fields?.name}
                        className="border-dark"
                        onChange={(e) => handleChange('name', e.target.value)}
                      />
                    </Form.Group>
                    {errorMessages?.name?.message && (
                      <span className="text-danger fs-13">{errorMessages?.name?.message}</span>
                    )}
                  </Col>
                </Row>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Row className="mb-1">
                  <Col>
                    <Form.Group>
                      <Form.Label className="text-dark">Email</Form.Label>
                      <Form.Control
                        type="text"
                        maxLength={50}
                        value={fields?.email}
                        readOnly
                        className="border-dark"
                        onChange={(e) => handleChange('email', e.target.value)}
                      />
                    </Form.Group>
                    {errorMessages?.email?.message && (
                      <span className="text-danger fs-13">{errorMessages?.email?.message}</span>
                    )}
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label className="text-dark">Mobile</Form.Label>
                      <Form.Control
                        type="text"
                        maxLength={50}
                        value={fields?.mobile}
                        className="border-dark"
                        onChange={(e) => handleChange('mobile', e.target.value)}
                      />
                    </Form.Group>
                    {errorMessages?.mobile?.message && (
                      <span className="text-danger fs-13">{errorMessages?.mobile?.message}</span>
                    )}
                  </Col>
                </Row>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="text-dark">Description</Form.Label>
              <Form.Control
                maxLength={500}
                as="textarea"
                rows={3}
                value={fields?.description}
                className="border-dark"
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </Form.Group>

            <div className="d-flex justify-content-start">
              <Button type="button" variant="primary" onClick={() => onSubmit()}>
                Save Changes
              </Button>
            </div>
          </Form>
        );
      case 'Subscription':
        return (
          <Form>
            <Row className="mb-4">
              <h4>Subscription </h4>
            </Row>
            <Row className="mb-1">
              <Col md={6}>
                <Row className="mb-1">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-dark">Plan</Form.Label>
                      <Form.Control type="text" readOnly value={fields?.plan} />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label className="text-dark">Status</Form.Label>
                      <Form.Control type="text" readOnly value={fields?.status} />
                    </Form.Group>
                  </Col>
                </Row>
              </Col>
            </Row>

            {fields?.status !== 'trialing' && (
              <Row>
                <Col md={6}>
                  <Row className="mb-3">
                    <Col>
                      <Form.Group>
                        <Form.Label className="text-dark">Start Date</Form.Label>
                        <Form.Control type="text" readOnly value={dateFormatted(fields?.startDate)} />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group>
                        <Form.Label className="text-dark">End Date</Form.Label>
                        <Form.Control type="text" readOnly value={dateFormatted(fields?.endDate)} />
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
              </Row>
            )}

            {fields?.status === 'trialing' && (
              <Row>
                <Col md={6}>
                  <Row className="mb-1">
                    <Col>
                      <Form.Group>
                        <Form.Label className="text-dark">Trial Start</Form.Label>
                        <Form.Control
                          type="text"
                          readOnly
                          value={dateFormatted(fields?.trial_start)}
                          className="border-dark"
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group>
                        <Form.Label className="text-dark">Trial End</Form.Label>
                        <Form.Control type="text" readOnly value={dateFormatted(fields?.trial_end)} />
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
              </Row>
            )}

            <div className="d-flex justify-content-start">
              <Button type="button" variant="primary" onClick={() => handleSubmit(fields)}>
                Go to Stripe Portal
              </Button>
            </div>
          </Form>
        );

      case 'ChangePassword':
        return (
          <Form>
            <Row className="mb-4">
              <h4>Change Password </h4>
            </Row>
            <Row className="mb-1">
              <Col md={6}>
                <Row className="mb-1">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-dark">New Password</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          value={fields.password}
                          onChange={(e) => handleChange('password', e.target.value)}
                          placeholder="Enter your password"
                          maxLength={20}
                        />
                        <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? 'Hide' : 'Show'}
                        </Button>
                      </InputGroup>{' '}
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label className="text-dark">Confirm Password</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={fields.confirm_password}
                          maxLength={20}
                          onChange={(e) => handleChange('confirm_password', e.target.value)}
                          placeholder="Confirm your password"
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? 'Hide' : 'Show'}
                        </Button>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
              </Col>
            </Row>

            <div className="d-flex justify-content-start">
              <Button
                type="button"
                variant="primary"
                disabled={
                  fields.password !== fields.confirm_password ||
                  fields.password.length === 0 ||
                  fields.confirm_password.length === 0
                }
                onClick={() => handleSavePassword(fields)}
              >
                Save Changes
              </Button>
            </div>
          </Form>
        );

      case 'ReceivePayments':
        return (
          <Form>
            <Row className="mb-4">
              <Col>
                <h4>Receive Payments</h4>
                <p className="text-muted">Set up a Stripe Connect account to receive payments when other integrators book your engineers.</p>
              </Col>
            </Row>

            {connectError && (
              <Row className="mb-3">
                <Col>
                  <Alert variant="danger">{connectError}</Alert>
                </Col>
              </Row>
            )}

            {connectSuccess && (
              <Row className="mb-3">
                <Col>
                  <Alert variant="success">{connectSuccess}</Alert>
                </Col>
              </Row>
            )}

            {connectLoading ? (
              <Row className="mb-4">
                <Col>
                  <div className="d-flex align-items-center">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Loading Connect status...</span>
                  </div>
                </Col>
              </Row>
            ) : connectStatus ? (
              <>
                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-dark">Connection Status</Form.Label>
                      <div className="d-flex align-items-center">
                        <span
                          className={`badge bg-${getStatusBadgeVariant(connectStatus.status)} me-2`}
                        >
                          {getStatusLabel(connectStatus.status)}
                        </span>
                        {connectStatus.accountId && (
                          <span className="text-muted fs-13">(Account: {connectStatus.accountId.slice(-8)})</span>
                        )}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                {connectStatus.status === 'verified' && (
                  <>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Row>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="text-dark">Charges Enabled</Form.Label>
                              <div className="text-success fw-bold">
                                {connectStatus.chargesEnabled ? '✓ Yes' : '✗ No'}
                              </div>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="text-dark">Payouts Enabled</Form.Label>
                              <div className="text-success fw-bold">
                                {connectStatus.payoutsEnabled ? '✓ Yes' : '✗ No'}
                              </div>
                            </Form.Group>
                          </Col>
                        </Row>
                      </Col>
                    </Row>

                    {connectStatus.bankAccountOnFile && (
                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="text-dark">Bank Account</Form.Label>
                            <div className="text-success">✓ On file</div>
                          </Form.Group>
                        </Col>
                      </Row>
                    )}

                    <Row className="mb-4">
                      <Col>
                        <Alert variant="success">
                          <strong>Great!</strong> Your Stripe Connect account is ready to receive payments. 
                          When engineers from your company are booked by other integrators, payments will be transferred to this account.
                        </Alert>
                      </Col>
                    </Row>
                  </>
                )}

                {connectStatus.status === 'onboarding_started' && (
                  <Row className="mb-4">
                    <Col>
                      <Alert variant="info">
                        <strong>Onboarding in progress.</strong> You started the setup process but haven't completed all required steps.
                        Click "Resume Setup" to continue where you left off.
                      </Alert>
                    </Col>
                  </Row>
                )}

                {connectStatus.status === 'requirements_pending' && (
                  <>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="text-dark">Information Needed</Form.Label>
                          <ul className="text-danger">
                            {connectStatus.requirementsStatus?.currentlyDue?.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row className="mb-4">
                      <Col>
                        <Alert variant="warning">
                          <strong>Action Required.</strong> Stripe needs additional information to verify your account.
                          Please click "Resume Setup" to provide the missing details.
                        </Alert>
                      </Col>
                    </Row>
                  </>
                )}

                {connectStatus.status === 'verification_failed' && (
                  <>
                    {connectStatus.rejectReason && (
                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="text-dark">Rejection Reason</Form.Label>
                            <div className="text-danger">{connectStatus.rejectReason}</div>
                          </Form.Group>
                        </Col>
                      </Row>
                    )}
                    <Row className="mb-4">
                      <Col>
                        <Alert variant="danger">
                          <strong>Verification Failed.</strong> Your account could not be verified. 
                          Please click "Try Again" to restart the onboarding process.
                        </Alert>
                      </Col>
                    </Row>
                  </>
                )}

                {connectStatus.status === 'restricted' && (
                  <Row className="mb-4">
                    <Col>
                      <Alert variant="danger">
                        <strong>Account Restricted.</strong> Your Connect account has been restricted. 
                        Please contact Stripe support or click "Resume Setup" for more information.
                      </Alert>
                    </Col>
                  </Row>
                )}

                {connectStatus.status === 'not_started' && (
                  <Row className="mb-4">
                    <Col>
                      <Alert variant="secondary">
                        <strong>Ready to get started?</strong> Click the button below to begin your Stripe Connect setup.
                      </Alert>
                    </Col>
                  </Row>
                )}

                <div className="d-flex gap-2 justify-content-start">
                  {connectStatus.status === 'not_started' && (
                    <Button
                      type="button"
                      variant="primary"
                      disabled={connectLoading}
                      onClick={handleCreateOnboarding}
                    >
                      {connectLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Setting up...
                        </>
                      ) : (
                        'Set Up Now'
                      )}
                    </Button>
                  )}

                  {(connectStatus.status === 'onboarding_started' ||
                    connectStatus.status === 'requirements_pending' ||
                    connectStatus.status === 'verification_failed' ||
                    connectStatus.status === 'restricted') && (
                    <Button
                      type="button"
                      variant="primary"
                      disabled={connectLoading}
                      onClick={handleRefreshOnboarding}
                    >
                      {connectLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Resuming...
                        </>
                      ) : (
                        'Resume Setup'
                      )}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline-secondary"
                    disabled={connectLoading}
                    onClick={fetchConnectStatus}
                  >
                    Refresh Status
                  </Button>
                </div>
              </>
            ) : null}
          </Form>
        );

      default:
        return <h4>Select an option</h4>;
    }
  };

  return (
    <>
      <Row>
        <Col md={2} className="bg-light border-end vh-100 d-flex flex-column align-items-center py-3">
          <div className="w-100 text-center">
            <div
              onClick={() => setSelectedMenu('profile')}
              className={`py-1 ps-8 d-flex justify-content-start menu-item ${
                selectedMenu === 'profile' ? 'active-menu' : ''
              }`}
            >
              Profile
            </div>
            <div
              onClick={() => setSelectedMenu('Subscription')}
              className={`py-1 ps-8 d-flex justify-content-start menu-item ${
                selectedMenu === 'Subscription' ? 'active-menu' : ''
              }`}
            >
              Subscription
            </div>
            <div
              onClick={() => setSelectedMenu('ReceivePayments')}
              className={`py-1 ps-8 d-flex justify-content-start menu-item ${
                selectedMenu === 'ReceivePayments' ? 'active-menu' : ''
              }`}
            >
              Receive Payments
            </div>
            <div
              onClick={() => setSelectedMenu('ChangePassword')}
              className={`py-1 ps-8 d-flex justify-content-start menu-item ${
                selectedMenu === 'ChangePassword' ? 'active-menu' : ''
              }`}
            >
              Change Password
            </div>
          </div>
        </Col>

        <Col md={10} className="p-4">
          {renderContent(fields)}
        </Col>
      </Row>
      <input type="file" id="file-input" accept="image/*" onChange={handleFileChange} hidden />
      {!loading && <span className="overlay__block" />}
      {success && <OkDialogue showSuccess={success} onClose={() => {}} />}
      {error && <ErrorDialogue showError={error} onClose={() => {}} />}
    </>
  );
};

export default SettingsPage;
