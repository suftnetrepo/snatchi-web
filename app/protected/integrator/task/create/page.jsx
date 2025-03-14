'use client';

import React, { useState, Suspense } from 'react';
import { validate } from '../../../../../validator/validator';
import { taskValidator } from '../../rules';
import { useTaskEdit } from '../../../../../hooks/useTask';
import { ConfirmationDialogue } from '../../../../../src/components/elements/ConfirmDialogue';
import { useRouter, useSearchParams } from 'next/navigation';
import ErrorDialogue from '../../../../../src/components/elements/errorDialogue';
import Button from 'react-bootstrap/Button';
import { MdArrowBack } from 'react-icons/md';
import dynamic from 'next/dynamic';

const TaskForm = dynamic(() => import('../taskForm'), { ssr: false });

const TaskCreateContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [errorMessages, setErrorMessages] = useState({});
  const { handleSave, fields, handleChange, success, handleReset, error } = useTaskEdit(null, projectId);

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

    await handleSave(body);
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="ms-5 me-10 mt-5">
        <div className="card-body">
          <div className="d-flex justify-content-start align-items-center mb-3">
            <Button
              variant="outline-secondary"
              onClick={() => router.push(`/protected/integrator/task?projectId=${projectId}`)}
            >
              <MdArrowBack size={24} /> Back
            </Button>
            <h3 className="card-title ms-2">New Task</h3>
          </div>
          <TaskForm
            handleChange={handleChange}
            fields={fields}
            handleSubmit={handleSubmit}
            errorMessages={errorMessages}
            projectId={projectId}
          />
        </div>
      </div>
      {success && (
        <ConfirmationDialogue
          show={success}
          onClose={async () => {
            handleReset();
            router.push(`/protected/integrator/task?projectId=${projectId}`);
          }}
          onConfirm={() => handleReset()}
        />
      )}
      {error && <ErrorDialogue showError={error} onClose={() => handleReset()} />}
    </Suspense>
  );
};

export default function CreateForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TaskCreateContent />
    </Suspense>
  );
}