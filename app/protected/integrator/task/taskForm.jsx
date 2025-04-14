'use client';

import React from 'react';
import { Form, Button } from 'react-bootstrap';
import DeleteConfirmation from '../../../../src/components/elements/ConfirmDialogue';

const TaskForm = ({ errorMessages, handleDelete, handleSubmit, handleChange, fields }) => {

  const handlePaste = (e) => {  
    const pastedText = e.clipboardData.getData('text');
    handleChange('description', pastedText);
    e.preventDefault();
  };

  return (
    <Form>
      <div className="row">
        <div className="col-md-12">
          <Form.Group controlId="formName" className="mb-3">
            <Form.Label className="text-dark"> Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter task name"
              name="name"
              value={fields?.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="border-dark"
            />
            {errorMessages?.name?.message && (
              <span className="text-danger fs-13 ms-2">{errorMessages?.name?.message}</span>
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
                  value={fields?.startDate}
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
                  value={fields?.endDate}
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
              placeholder="Enter task description"
              value={fields.description}
              onPaste={handlePaste}
              onChange={(e) => handleChange('description', e.target.value)}
                   className="border-dark"
            />
            {errorMessages?.description?.message && (
              <span className="text-danger fs-13">{errorMessages.description?.message}</span>
            )}
          </Form.Group>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="formLastName" className="mb-3">
                <Form.Label className="text-dark">Status</Form.Label>
                <Form.Select
                  className="border-dark"
                  value={fields?.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option>Select status</option>
                  <option value="Pending">Pending</option>
                  <option value="Progress">Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Canceled">Canceled</option>
                </Form.Select>
                {errorMessages?.status?.message && (
                  <span className="text-danger fs-13">{errorMessages?.status?.message}</span>
                )}
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group controlId="formEmail" className="mb-3">
                <Form.Label className="text-dark">Priority</Form.Label>
                <Form.Select
                  className="border-dark"
                  value={fields?.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  <option>Select Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Form.Select>
                {errorMessages?.priority?.message && (
                  <span className="text-danger fs-13">{errorMessages?.priority?.message}</span>
                )}
              </Form.Group>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-start">
        <Button type="button" variant="primary" onClick={() => handleSubmit()}>
          Save Changes
        </Button>
        {fields?._id && (
          <DeleteConfirmation
            onConfirm={async (id) => {
              handleDelete(id);
            }}
            onCancel={() => {}}
            itemId={fields?._id}
          >
            <Button type="button" className="ms-4" variant="danger">
              Delete
            </Button>
          </DeleteConfirmation>
        )}
      </div>
    </Form>
  );
};

export default TaskForm;
