import React, { useState, useEffect } from 'react';
import { Offcanvas, Button, Form, Container } from 'react-bootstrap';
import { validate } from '../../../../validator/validator';
import { MdCancel } from 'react-icons/md';
import { OkDialogue } from '../../../../src/components/elements/ConfirmDialogue';
import StyledImage from '@/components/reuseable/StyledImage';
import { useUser } from '@/hooks/useUser';
import { useAppContext } from '@/Store/AppContext';

const RenderUserUserOffcanvas = ({ show }) => {
  const { showOffCanvas } = useAppContext();
  const [errorMessages, setErrorMessages] = useState({});
  const { success, rules, fields, handleChange, handleReset, handleEditUser, handleFetchOneUser } = useUser('', false);

  useEffect(() => {
    handleFetchOneUser();
  }, [show]);

  const handleClose = () => {
    handleReset();
    showOffCanvas(false);
  };

  const handleSubmit = async () => {
    setErrorMessages({});
    const validationResult = validate(fields, rules);

    if (validationResult.hasError) {
      setErrorMessages(validationResult.errors);
      return;
    }

    handleEditUser(fields, fields?._id).then((result) => {});
  };

  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '30%', backgroundColor: 'white' }}>
      <div className="d-flex flex-row justify-content-between align-items-center p-7">
        <div className="d-flex flex-column justify-content-start align-items-start">
          <p className="text-dark fw-bold fs-18">{'Edit Profile'}</p>
        </div>
        <div>
          <MdCancel size={48} color="black" onClick={handleClose} className="pointer" />
        </div>
      </div>
      <Offcanvas.Body>
        <Container className="text-center">
          <div className="d-flex flex-column align-items-center justify-content-center mb-10">
            {fields && <StyledImage url={fields?.secure_url} height="160" width="160" roundedCircle />}
          </div>
        </Container>
        <Form>
          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="formFirstName" className="mb-3">
                <Form.Label className="text-dark">First Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter first name"
                  name="first_name"
                  value={fields.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className="border-dark"
                />
                {errorMessages.first_name?.message && (
                  <span className="text-danger">{errorMessages.first_name?.message}</span>
                )}
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group controlId="formLastName" className="mb-3">
                <Form.Label className="text-dark">Last Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter last name"
                  name="last_name"
                  value={fields.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className="border-dark"
                />
                {errorMessages.last_name?.message && (
                  <span className="text-danger">{errorMessages.last_name?.message}</span>
                )}
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="formEmail" className="mb-3">
                <Form.Label className="text-dark">Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  name="email"
                  value={fields.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="border-dark"
                />
                {errorMessages.email?.message && <span className="text-danger">{errorMessages.email?.message}</span>}
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group controlId="formMobile" className="mb-3">
                <Form.Label className="text-dark">Mobile</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter mobile number"
                  name="mobile"
                  value={fields.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  className="border-dark"
                />
                {errorMessages.mobile?.message && (
                  <span className="text-danger alert-danger">{errorMessages.mobile?.message}</span>
                )}
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="formRole" className="mb-3">
                <Form.Label className="text-dark">Role</Form.Label>
                <Form.Select disabled name="role" value={fields.role} className="border-dark">
                  <option value="">Select a role</option>
                  <option value="engineer">Engineer</option>
                  <option value="manager">Manager</option>
                  <option value="guest">Guest</option>
                </Form.Select>
                {errorMessages.role?.message && <span className="text-danger">{errorMessages.role?.message}</span>}
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group controlId="formEngineer" className="mb-3">
                <Form.Label className="text-dark">Visibility</Form.Label>
                <Form.Select disabled name="visible" value={fields.visible} className="border-dark">
                  <option value="">Select a visibility</option>
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </Form.Select>
                {errorMessages.visible?.message && (
                  <span className="text-danger">{errorMessages.visible?.message}</span>
                )}
              </Form.Group>
            </div>
          </div>

          <Form.Group controlId="formUserStatus" className="mb-3">
            <Form.Check
              type="checkbox"
              label="Active Status"
              name="user_status"
              checked={fields.user_status}
              onChange={(e) => {}}
              className="text-dark border-dark"
            />
          </Form.Group>

          <Form.Group controlId="formChatStatus" className="mb-3">
            <Form.Check
              type="checkbox"
              label="Chat Status"
              name="chat_status"
              checked={fields.chat_status}
              onChange={(e) => {}}
              className="text-dark border-dark"
            />
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" className="me-2" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={() => handleSubmit()}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Offcanvas.Body>
      {success && (
        <OkDialogue
          show={success}
          message="Your changes was save successfully"
          onConfirm={() => {
            handleClose();
          }}
        />
      )}
    </Offcanvas>
  );
};

export default RenderUserUserOffcanvas;
