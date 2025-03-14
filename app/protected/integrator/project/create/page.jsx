'use client';

import React, { useState } from 'react';
import { validate } from '../../../../../validator/validator';
import { projectValidator } from '../../rules';
import { useProjectEdit } from '../../../../../hooks/useProject';
import { ConfirmationDialogue } from '../../../../../src/components/elements/ConfirmDialogue';
import { useRouter } from 'next/navigation';
import ErrorDialogue from '../../../../../src/components/elements/errorDialogue';
import Button from 'react-bootstrap/Button';
import { MdArrowBack } from 'react-icons/md';
import dynamic from 'next/dynamic'

const ProjectForm = dynamic(
  () => import('../projectForm'),
  { ssr: false }
);

const CreateForm = () => {
  const router = useRouter();
  const [errorMessages, setErrorMessages] = useState({});
  const { handleSave, fields, handleChange, success, handleReset, error, handleSelectedAddress } = useProjectEdit();

  const handleSubmit = async () => {
    setErrorMessages({});
    const validationResult = validate(fields, projectValidator.rules);

    if (validationResult.hasError) {
      setErrorMessages(validationResult.errors);
      return;
    }

    await handleSave(fields);
  };

  return (
    <>
      <div className="ms-5 me-10 mt-5">
        <div className="card-body">
          <div className="d-flex justify-content-start align-items-center mb-3">
            <Button variant="outline-secondary" onClick={() => router.push(`/protected/integrator/project`)}>
              <MdArrowBack size={24} /> Back
            </Button>
            <h3 className="card-title ms-2">New Project</h3>
          </div>
          <ProjectForm
            handleChange={handleChange}
            fields={fields}
            handleSubmit={handleSubmit}
            errorMessages={errorMessages}
            handleSelectedAddress={handleSelectedAddress}
          />
        </div>
      </div>
      {success && (
        <ConfirmationDialogue
          show={success}
          onClose={async () => {
            handleReset();
            router.push(`/protected/integrator/project`);
          }}
          onConfirm={() => handleReset()}
        />
      )}
      {error && <ErrorDialogue showError={error} onClose={() => handleReset()} />}
    </>
  );
};

export default CreateForm;
