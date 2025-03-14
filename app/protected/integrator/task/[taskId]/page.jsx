'use client';

import React, { useState, Suspense } from 'react';
import { validate } from '../../../../../validator/validator';
import { taskValidator } from '../../rules';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTaskEdit } from '../../../../../hooks/useTask';
import TaskForm from '../taskForm';
import ErrorDialogue from '../../../../../src/components/elements/errorDialogue';

const EditForm = () => {
  const router = useRouter(); 
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const taskId = searchParams.get('taskId');
  const [errorMessages, setErrorMessages] = useState({});
  const { handleEdit, fields, handleChange, error, handleReset } = useTaskEdit(taskId, projectId);
   
  const resetFields = () => {
    router.push(`/protected/integrator/task?projectId=${projectId}`);
  };

  const handleSubmit = async () => {
    setErrorMessages({});
    const validationResult = validate(fields, taskValidator.rules);

    if (validationResult.hasError) {
      setErrorMessages(validationResult.errors);
      return;
    }

    handleEdit(fields, taskId).then((result) => {
      result && resetFields();
    });
  };

  return (
      <Suspense fallback={<div>Loading...</div>}>
      <div className="ms-5 me-10 mt-5">
        <div className="card-body">
          <h3 className="card-title  mb-2 mb-5">Edit Task</h3>
          <TaskForm
            handleChange={handleChange}
            fields={fields}
            handleSubmit={handleSubmit}
            errorMessages={errorMessages}   
            projectId={projectId}        
          />
        </div>
      </div>
      {error && <ErrorDialogue showError={error} onClose={() => handleReset()} />}
    </Suspense>
  );
};

export default EditForm;
