'use client';

import React from 'react';
import { Offcanvas, Button, Form, Alert } from 'react-bootstrap';
import { MdCancel } from 'react-icons/md';
import DeleteConfirmation from '../../../../src/components/elements/ConfirmDialogue';
import { OkDialogue } from '../../../../src/components/elements/ConfirmDialogue';

const RenderScheduleOffcanvas = ({
  errorMessages,
  show,
  handleClose,
  handleSubmit,
  fields,
  error,
  handleChange,
  handleDelete,
  success
}) => {
  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '30%', backgroundColor: 'white' }}>
      <div className="d-flex flex-row justify-content-between align-items-center p-7">
        <div className="d-flex flex-column justify-content-start align-items-start">
          <p className="text-dark fw-bold fs-18"> Job Scheduler</p>
        </div>
        <div>
          <MdCancel size={48} color="black" onClick={handleClose} className="pointer" />
        </div>
      </div>
      <Offcanvas.Body>
        {error && (
          <div className="row">
            <div className="col-md-12">
              <Alert variant={'danger'}>{error}</Alert>
            </div>
          </div>
        )}
        <Form>
          <div className="row">
            <div className="col-md-12">
              <Form.Group controlId="formTitle" className="mb-3">
                <Form.Label className="text-dark"> Title</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter job title"
                  name="title"
                  value={fields?.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="border-dark"
                />
                {errorMessages?.title?.message && (
                  <span className="text-danger fs-13 ms-2">{errorMessages?.title?.message}</span>
                )}
              </Form.Group>
            </div>

            <div className="col-md-6"></div>
          </div>
          <div className="row mb-3">
            <div className="col-md-12">
              <div className="row">
                <div className="col-md-6">
                  <Form.Group controlId="formStartDate">
                    <Form.Label className="text-dark">Start Date</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={fields.startDate}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      className="border-dark"
                    />
                  </Form.Group>
                  {errorMessages?.startDate?.message && (
                    <span className="text-danger fs-13">{errorMessages?.startDate?.message}</span>
                  )}
                </div>
                <div className="col-md-6">
                  <Form.Group controlId="formEndDate">
                    <Form.Label className="text-dark">End Date</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={fields.endDate}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                      className="border-dark"
                    />
                  </Form.Group>
                  {errorMessages?.endDate?.message && (
                    <span className="text-danger fs-13">{errorMessages?.endDate?.message}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <Form.Group className="mb-3">
                <Form.Label className="text-dark">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter short job description"
                  value={fields.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="border-dark"
                />
                {errorMessages?.description?.message && (
                  <span className="text-danger fs-13">{errorMessages.description?.message}</span>
                )}
              </Form.Group>
            </div>
          </div>
          <div className="col-md-6">
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label className="text-dark">Status</Form.Label>
              <Form.Select
                className="border-dark"
                value={fields?.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option>Select Status</option>
                <option value="Accepted">Accepted</option>
                <option value="Declined">Declined</option>
                <option value="Pending">Pending</option>
                <option value="Block">Block</option>
              </Form.Select>
              {errorMessages?.status?.message && (
                <span className="text-danger fs-13">{errorMessages?.status?.message}</span>
              )}
            </Form.Group>
          </div>
          <div className="d-flex justify-content-start">
            <Button type="button" variant="primary" onClick={() => handleSubmit()}>
              Save Changes
            </Button>
            <DeleteConfirmation
              onConfirm={async (id) => {
                handleDelete(id);
                handleClose();
              }}
              onCancel={() => {}}
              itemId={fields._id}
            >
              <Button type="button" variant="outline-danger" className="ms-2" onClick={handleClose}>
                Delete
              </Button>
            </DeleteConfirmation>

            <Button type="button" variant="secondary" className="ms-2" onClick={handleClose}>
              Close
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

export { RenderScheduleOffcanvas };
