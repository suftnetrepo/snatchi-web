'use client';

import React, { useState } from 'react';
import { Offcanvas } from 'react-bootstrap';
import { validate } from '../../../../validator/validator';
import { taskValidator } from '../rules';
import { ConfirmationDialogue, OkDialogue } from '../../../../src/components/elements/ConfirmDialogue';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import { MdCancel } from 'react-icons/md';
import dynamic from 'next/dynamic';
const TaskForm = dynamic(() => import('./taskForm'), { ssr: false });

const RenderTaskOffcanvas = ({
  show,
  setShow,
  projectId,
  error,
  fields,
  success,
  handleChange,
  handleEdit,
  handleSave,
  handleReset,
  handleDelete
}) => {
  const [errorMessages, setErrorMessages] = useState({});

  const handleSubmit = async () => {
    setErrorMessages({});
    const validationResult = validate(fields, taskValidator.rules);

    if (validationResult.hasError) {
      setErrorMessages(validationResult.errors);
      return;
    }

    const body = {
      project: projectId,
      ...fields
    };

    if (fields?._id) {
      await handleEdit(body, fields._id);
    } else {
      await handleSave(body);
    }
  };

  return (
    <Offcanvas
      show={show}
      onHide={() => setShow(false)}
      placement="end"
      style={{ width: '30%', backgroundColor: 'white' }}
    >
      <div className="d-flex flex-row justify-content-between align-items-center p-7">
        <div className="d-flex flex-column justify-content-start align-items-start">
          <p className="text-dark fw-bold fs-18">{fields._id ? 'Edit Task' : 'Add New Task'}</p>
        </div>
        <div>
          <MdCancel size={48} color="black" onClick={() => setShow(false)} className="pointer" />
        </div>
      </div>
      <Offcanvas.Body>
        <TaskForm
          handleChange={handleChange}
          fields={fields}
          handleSubmit={handleSubmit}
          errorMessages={errorMessages}
          projectId={projectId}
          handleDelete={handleDelete}
        />
      </Offcanvas.Body>
      {success && (
        <>
          {fields?._id ? (
            <OkDialogue
              show={success}
              message="Your changes was save successfully"
              onConfirm={() => {
                setShow(false);
                handleReset();
              }}
            />
          ) : (
            <ConfirmationDialogue
              show={success}
              onClose={async () => {
                setShow(false);
                handleReset();
              }}
              onConfirm={() => {
                setShow(false);
                handleReset();
              }}
            />
          )}
        </>
      )}
      {error && <ErrorDialogue showError={error} onClose={() => handleReset()} />}
    </Offcanvas>
  );
};

export default RenderTaskOffcanvas;
