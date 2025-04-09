import React, { useState, useEffect } from 'react';
import { Offcanvas, Button, Form } from 'react-bootstrap';
import { validate } from '../../../validator/validator';
import { userValidator } from './rules';

const RenderUserOffcanvas = ({ show, handleClose, userData, handleSaveUser, handleEditUser }) => {
  const [errorMessages, setErrorMessages] = useState({});
  const [fields, setFields] = useState(userValidator.fields);

  useEffect(() => {
    setFields((pre) => {
      return {
        ...pre,
        ...userData
      };
    });
  }, [userData]);

  const resetFields = () => {
    setFields(userValidator.reset());
    if (userData?._id) handleClose();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFields({
      ...fields,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async () => {
    setErrorMessages({});
    const validationResult = validate(fields, userValidator.rules);

    if (validationResult.hasError) {
      setErrorMessages(validationResult.errors);
      return;
    }

    if (userData) {
      handleEditUser(fields, userData?._id).then((result) => {
        result && resetFields();
      });
    } else {
      handleSaveUser(fields).then((result) => {
        result && resetFields();
      });
    }
  };

  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '30%', backgroundColor: 'white' }}>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>{userData ? 'Edit' : 'Add New User'}</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
                  className="border-dark"
                />
                {errorMessages.mobile?.message && (
                  <span className="text-danger alert-danger">{errorMessages.mobile?.message}</span>
                )}
              </Form.Group>
            </div>
          </div>   

          <div className="row">
            <div className="col-md-12">
              <Form.Group controlId="formRole" className="mb-3">
                <Form.Label className="text-dark">Role</Form.Label>
                <Form.Select name="role" value={fields.role} className="border-dark" onChange={handleChange}>
                  <option value="">Select a role</option>
                  <option value="guest">Guest</option>
                  <option value="admin">Admin</option>
                  <option value="integrator">Integrator</option>
                </Form.Select>
                {errorMessages.role?.message && <span className="text-danger">{errorMessages.role?.message}</span>}
              </Form.Group>
            </div>          
          </div> 
    
         <Form.Group controlId="formUserStatus" className="mb-3">
            <Form.Check
              type="checkbox"
              label="Active Status"
              name="user_status"
              checked={fields.user_status}
              onChange={handleChange}
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
    </Offcanvas>
  );
};

export default RenderUserOffcanvas;
