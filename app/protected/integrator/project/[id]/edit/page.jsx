'use client';

import React, { useState } from 'react';
import { validate } from '../../../../../../validator/validator';
import { projectValidator } from '../../../rules';
import { useRouter, useParams } from 'next/navigation';
import { useProjectEdit } from '../../../../../../hooks/useProject';
import ErrorDialogue from '../../../../../../src/components/elements/errorDialogue';
import Button from 'react-bootstrap/Button';
import { MdArrowBack } from 'react-icons/md';

import dynamic from 'next/dynamic'

const ProjectForm = dynamic(
  () => import('../../projectForm'),
  { ssr: false }
);

const EditForm = () => {
  const { id } = useParams();
  const router = useRouter()
  const [errorMessages, setErrorMessages] = useState({});
  const { handleEdit, fields, handleChange, error, handleReset, handleSelectedAddress } = useProjectEdit(id);
   
  const resetFields = () => {
    router.push(`/protected/integrator/project`);
  };

  const handleSubmit = async () => {
    setErrorMessages({});
    const validationResult = validate(fields, projectValidator.rules);

    if (validationResult.hasError) {
      setErrorMessages(validationResult.errors);
      return;
    }

    handleEdit(fields, id).then((result) => {
      result && resetFields();
    });
  };

  return (
    <>
      <div className="ms-5 me-10 mt-5">
        <div className="card-body">
          <div className="d-flex justify-content-start align-items-center mb-3">
            <Button variant="outline-secondary" onClick={() => router.push(`/protected/integrator/project`)}><MdArrowBack size={24} /> Back</Button>
            <h3 className="card-title ms-2">Edit Project</h3>
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
      {error && <ErrorDialogue showError={error} onClose={() => handleReset()} />}
    </>
  );
};

export default EditForm;
