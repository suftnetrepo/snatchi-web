/* eslint-disable jsx-a11y/alt-text */
'use client';
import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Image, InputGroup } from 'react-bootstrap';
import { dateFormatted } from '../../../../utils/helpers';
import { useSettings } from '../../../../hooks/useSettings';
import { validate } from '../../../../validator/validator';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import { OkDialogue } from '../../../../src/components/elements/errorDialogue';
import { useSubscriber } from '../../../../hooks/useSubscriber';

const SettingsPage = () => {
    const { handleSave, handleChange, rules, loading, error, fields, success, handleSaveChangePassword } = useSettings();
    const { handleCustomerPortalSession } = useSubscriber();
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedMenu, setSelectedMenu] = useState('profile');
    const [errorMessages, setErrorMessages] = useState({});
    const [file, setFile] = useState(null);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

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
        await handleSaveChangePassword({ password: fields.password })
    };

    const renderContent = (data) => {
        switch (selectedMenu) {
            case 'profile':
                return (
                    <Form>
                        <Row className="mb-3">
                            <Col xs={12} md={4}>
                                <div className="d-flex flex-column justify-content-start align-items-start">
                                    {previewUrl ? (
                                        <Image
                                            src={previewUrl}
                                            width={150}
                                            height={150}
                                            layout="fill"
                                            alt="Avatar"
                                            roundedCircle
                                            className="mb-3"
                                        />
                                    ) : (
                                        <>
                                            {!fields.secure_url && (
                                                <div
                                                    style={{
                                                        width: 150,
                                                        height: 150,
                                                        borderRadius: '50%',
                                                        backgroundColor: '#ccc',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    150 x 150
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {fields.secure_url && (
                                        <div className="d-flex align-items-center">
                                            <img
                                                src={fields.secure_url}
                                                alt="Avata"
                                                className="rounded-circle me-2"
                                                width="150"
                                                height="150"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/img/blank.png';
                                                }}
                                            />
                                        </div>
                                    )}
                                    <Button variant="success" className="mb-2 mt-3" onClick={() => handleImageClick()}>
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
                            className={`py-1 ps-8 d-flex justify-content-start menu-item ${selectedMenu === 'profile' ? 'active-menu' : ''
                                }`}
                        >
                            Profile
                        </div>
                        <div
                            onClick={() => setSelectedMenu('Subscription')}
                            className={`py-1 ps-8 d-flex justify-content-start menu-item ${selectedMenu === 'Subscription' ? 'active-menu' : ''
                                }`}
                        >
                            Subscription
                        </div>
                        <div
                            onClick={() => setSelectedMenu('ChangePassword')}
                            className={`py-1 ps-8 d-flex justify-content-start menu-item ${selectedMenu === 'ChangePassword' ? 'active-menu' : ''
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
            {success && <OkDialogue showSuccess={success} onClose={() => { }} />}
            {error && <ErrorDialogue showError={error} onClose={() => { }} />}
        </>
    );
};

export default SettingsPage;
