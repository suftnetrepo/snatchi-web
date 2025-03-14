'use client';

import React, { useState } from 'react';
import { Offcanvas } from 'react-bootstrap';
import { validate } from '../../../../validator/validator';
import { taskValidator } from '../../../protected/integrator/rules';

import { ConfirmationDialogue } from '../../../../src/components/elements/ConfirmDialogue';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
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
      <Offcanvas.Header closeButton>
        <Offcanvas.Title></Offcanvas.Title>
      </Offcanvas.Header>
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
        <ConfirmationDialogue
          show={success}
          onClose={async () => {
            setShow(false);
            handleReset()
          }}
          onConfirm={() => { setShow(false); handleReset() }}
        />
      )}
      {error && <ErrorDialogue showError={error} onClose={() => handleReset()} />}
    </Offcanvas>
  );
};

export default RenderTaskOffcanvas;
